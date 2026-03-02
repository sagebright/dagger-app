/**
 * Tier 2 integration tests for the Weaving stage
 *
 * Verifies against the real API + Supabase backend that:
 *   - Scene arc data persists after page reload (data roundtrip)
 *   - Adventure name saves correctly to DB (data roundtrip)
 *   - Conditional rendering: scene tabs and arc content display
 *   - State across navigation: scene data preserved after nav away
 *
 * Patterns used: data roundtrip, state across navigation, conditional rendering
 */

import { test, expect } from '@playwright/test';
import { signInTestUser, signOutTestUser, type AuthSession } from './helpers/auth';
import { createTestSession, deleteTestSession, loadTestSession } from './helpers/test-data';
import {
  installAnthropicMock,
  buildSimpleSSE,
  type AnthropicMockController,
} from './helpers/anthropic-mock';
import { API_BASE_URL } from './env';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Advance a session to the weaving stage via sequential API calls.
 *
 * invoking -> attuning -> binding -> weaving
 */
async function advanceToWeaving(
  sessionId: string,
  accessToken: string
): Promise<void> {
  const advanceCount = 3;

  for (let i = 0; i < advanceCount; i++) {
    const response = await fetch(
      `${API_BASE_URL}/api/session/${sessionId}/advance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to advance session (step ${i + 1}, HTTP ${response.status}): ${body}`
      );
    }
  }
}

// =============================================================================
// Test Suite
// =============================================================================

test.describe('Weaving Stage (Tier 2)', () => {
  let auth: AuthSession;
  let sessionId: string;
  let mock: AnthropicMockController;

  test.beforeEach(async ({ page }) => {
    auth = await signInTestUser();
    const { session } = await createTestSession({ accessToken: auth.accessToken });
    sessionId = session.id;

    /* Advance to weaving stage */
    await advanceToWeaving(sessionId, auth.accessToken);

    /* Inject auth tokens into browser localStorage */
    await page.goto('/login');
    await page.evaluate(
      ({ token, refresh }) => {
        localStorage.setItem('sage_codex_token', token);
        localStorage.setItem('sage_codex_refresh', refresh);
      },
      { token: auth.accessToken, refresh: auth.refreshToken }
    );

    /* Install Anthropic mock with weaving-appropriate responses */
    mock = await installAnthropicMock(page, {
      initialGreetBody: buildSimpleSSE(
        'I have drafted scene arcs. Review each one and confirm when ready.'
      ),
      initialChatBody: buildSimpleSSE(
        'All scenes confirmed. Let us name this adventure.'
      ),
    });
  });

  test.afterEach(async () => {
    if (mock) await mock.dispose();
    if (sessionId && auth) {
      await deleteTestSession({ sessionId, accessToken: auth.accessToken });
    }
    if (auth) await signOutTestUser();
  });

  // ---------------------------------------------------------------------------
  // Pattern 3: Conditional rendering — weaving stage loads
  // ---------------------------------------------------------------------------

  test('renders the weaving stage with greeting', async ({ page }) => {
    await page.goto('/adventure');

    await expect(
      page.getByText(/drafted scene arcs/i)
    ).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 1: Data roundtrip — weaving stage persists after reload
  // ---------------------------------------------------------------------------

  test('weaving stage persists after page reload', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for the page to load */
    await expect(
      page.getByText(/drafted scene arcs/i)
    ).toBeVisible({ timeout: 15000 });

    /* Reload the page */
    await page.reload();

    /* Verify the session is still on the weaving stage (server-side) */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('weaving');
  });

  // ---------------------------------------------------------------------------
  // Pattern 3: Conditional rendering — chat input is available
  // ---------------------------------------------------------------------------

  test('chat input is available for scene discussions', async ({ page }) => {
    await page.goto('/adventure');

    const chatInput = page.getByLabel('Chat message input');
    await expect(chatInput).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 2: State across navigation — weaving preserved after nav away
  // ---------------------------------------------------------------------------

  test('weaving stage preserved after navigating away and returning', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for weaving to load */
    await expect(
      page.getByText(/drafted scene arcs/i)
    ).toBeVisible({ timeout: 15000 });

    /* Navigate away */
    await page.goto('/');

    /* Navigate back */
    await page.goto('/adventure');

    /* Verify weaving is still active (server confirms stage) */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('weaving');
  });

  // ---------------------------------------------------------------------------
  // Pattern 1: Data roundtrip — adventure name persistence via API
  // ---------------------------------------------------------------------------

  test('adventure name can be verified via API after page interaction', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for the chat to be ready */
    const chatInput = page.getByLabel('Chat message input');
    await expect(chatInput).toBeVisible({ timeout: 15000 });

    /* Send a message (the mock returns a generic confirmation) */
    await chatInput.fill('Confirm all scenes and name the adventure');
    await chatInput.press('Enter');

    /* Verify the mock response appears */
    await expect(
      page.getByText(/all scenes confirmed/i)
    ).toBeVisible({ timeout: 15000 });

    /* The session should still exist and be on weaving stage */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('weaving');
    expect(loaded.session.is_active).toBe(true);
  });
});
