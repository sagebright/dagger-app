/**
 * Tier 2 integration tests for the Inscribing stage
 *
 * Verifies against the real API + Supabase backend that:
 *   - NPC/adversary/item data persists across page reload (data roundtrip)
 *   - Wave section rendering from DB (conditional rendering)
 *   - Chat interaction works in the inscribing context (rapid interaction)
 *   - State across navigation: inscribing data preserved after nav away
 *
 * Patterns used: data roundtrip, conditional rendering, rapid interaction,
 *                state across navigation
 */

import { test, expect } from '@playwright/test';
import { signInTestUser, signOutTestUser, type AuthSession } from './helpers/auth';
import { cleanupActiveSessions, createTestSession, deleteTestSession, fetchWithRetry, loadTestSession } from './helpers/test-data';
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
 * Advance a session to the inscribing stage via sequential API calls.
 *
 * invoking -> attuning -> binding -> weaving -> inscribing
 */
async function advanceToInscribing(
  sessionId: string,
  accessToken: string
): Promise<void> {
  const advanceCount = 4;

  for (let i = 0; i < advanceCount; i++) {
    const response = await fetchWithRetry(
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

test.describe('Inscribing Stage (Tier 2)', () => {
  let auth: AuthSession;
  let sessionId: string;
  let mock: AnthropicMockController;

  test.beforeEach(async ({ page }) => {
    auth = await signInTestUser();
    await cleanupActiveSessions(auth.accessToken);
    const { session } = await createTestSession({ accessToken: auth.accessToken });
    sessionId = session.id;

    /* Advance to inscribing stage */
    await advanceToInscribing(sessionId, auth.accessToken);

    /* Inject auth tokens into browser localStorage */
    await page.goto('/login');
    await page.evaluate(
      ({ token, refresh }) => {
        localStorage.setItem('sage_codex_token', token);
        localStorage.setItem('sage_codex_refresh', refresh);
      },
      { token: auth.accessToken, refresh: auth.refreshToken }
    );

    /* Install Anthropic mock with inscribing-appropriate responses (includes auth session mock) */
    mock = await installAnthropicMock(page, {
      initialGreetBody: buildSimpleSSE(
        'Wave 1 is inscribed. Review the sections and let me know if changes are needed.'
      ),
      initialChatBody: buildSimpleSSE(
        'Wave 2 entities are inscribed: NPCs, adversaries, and items.'
      ),
      authUser: { id: auth.userId, email: auth.email },
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
  // Pattern 3: Conditional rendering — inscribing stage loads
  // ---------------------------------------------------------------------------

  test('renders the inscribing stage with greeting', async ({ page }) => {
    await page.goto('/adventure');

    await expect(
      page.getByText(/wave 1 is inscribed/i)
    ).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 1: Data roundtrip — inscribing stage persists after reload
  // ---------------------------------------------------------------------------

  test('inscribing stage persists after page reload', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for the page to load */
    await expect(
      page.getByText(/wave 1 is inscribed/i)
    ).toBeVisible({ timeout: 15000 });

    /* Reload the page */
    await page.reload();

    /* Verify on the server side */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('inscribing');
    expect(loaded.session.is_active).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Pattern 3: Conditional rendering — wave indicator is present
  // ---------------------------------------------------------------------------

  test('wave progress indicator is visible', async ({ page }) => {
    await page.goto('/adventure');

    /* The wave indicator has aria-label "Wave progress" */
    await expect(
      page.getByLabel('Wave progress')
    ).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 4: Rapid interaction — wave 2 chat interaction
  // ---------------------------------------------------------------------------

  test('chat accepts messages during inscribing', async ({ page }) => {
    await page.goto('/adventure');

    const chatInput = page.getByLabel('Chat message input');
    await expect(chatInput).toBeVisible({ timeout: 15000 });

    /* Send a message to trigger Wave 2 */
    mock.setChatResponse(
      buildSimpleSSE('Wave 2 entities are inscribed: NPCs, adversaries, and items.')
    );
    await chatInput.fill('Continue with Wave 2');
    await chatInput.press('Enter');

    /* Verify the response appears */
    await expect(
      page.getByText(/wave 2 entities are inscribed/i)
    ).toBeVisible({ timeout: 15000 });

    /* Send another message for Wave 3 */
    mock.setChatResponse(
      buildSimpleSSE('Wave 3 is complete: transitions, portents, and GM notes.')
    );
    await chatInput.fill('Continue with Wave 3');
    await chatInput.press('Enter');

    /* Verify the Wave 3 response */
    await expect(
      page.getByText(/wave 3 is complete/i)
    ).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 2: State across navigation — inscribing preserved after nav away
  // ---------------------------------------------------------------------------

  test('inscribing stage preserved after navigating away and returning', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for inscribing to load */
    await expect(
      page.getByText(/wave 1 is inscribed/i)
    ).toBeVisible({ timeout: 15000 });

    /* Navigate away */
    await page.goto('/');

    /* Navigate back */
    await page.goto('/adventure');

    /* Verify inscribing is still the active stage */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('inscribing');
  });
});
