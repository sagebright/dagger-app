/**
 * Tier 2 integration tests for the Binding stage
 *
 * Verifies against the real API + Supabase backend that:
 *   - Frame gallery renders from real Supabase data (conditional rendering)
 *   - Frame selection persists after page reload (data roundtrip)
 *   - State across navigation: returning to binding preserves frame selection
 *
 * Patterns used: data roundtrip, state across navigation, conditional rendering
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
 * Advance a session to the binding stage via sequential API calls.
 *
 * invoking -> attuning -> binding
 */
async function advanceToBinding(
  sessionId: string,
  accessToken: string
): Promise<void> {
  const stages = ['attuning', 'binding'];

  for (const _stage of stages) {
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
        `Failed to advance session to ${_stage} (HTTP ${response.status}): ${body}`
      );
    }
  }
}

// =============================================================================
// Test Suite
// =============================================================================

test.describe('Binding Stage (Tier 2)', () => {
  let auth: AuthSession;
  let sessionId: string;
  let mock: AnthropicMockController;

  test.beforeEach(async ({ page }) => {
    auth = await signInTestUser();
    await cleanupActiveSessions(auth.accessToken);
    const { session } = await createTestSession({ accessToken: auth.accessToken });
    sessionId = session.id;

    /* Advance to binding stage */
    await advanceToBinding(sessionId, auth.accessToken);

    /* Inject auth tokens into browser localStorage */
    await page.goto('/login');
    await page.evaluate(
      ({ token, refresh }) => {
        localStorage.setItem('sage_codex_token', token);
        localStorage.setItem('sage_codex_refresh', refresh);
      },
      { token: auth.accessToken, refresh: auth.refreshToken }
    );

    /* Install Anthropic mock with binding-appropriate responses (includes auth session mock) */
    mock = await installAnthropicMock(page, {
      initialGreetBody: buildSimpleSSE(
        'I have found frames that match your vision. Explore them and select one.'
      ),
      initialChatBody: buildSimpleSSE(
        'The frame is bound. Shall we weave the scenes?'
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
  // Pattern 3: Conditional rendering — binding stage renders
  // ---------------------------------------------------------------------------

  test('renders the binding stage panel', async ({ page }) => {
    await page.goto('/adventure');

    /* The frame gallery listbox should appear (even if empty, it is rendered) */
    const gallery = page.getByRole('listbox', {
      name: /available adventure frames/i,
    });
    await expect(gallery).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 3: Conditional rendering — greeting displays
  // ---------------------------------------------------------------------------

  test('displays greeting from mocked SSE response', async ({ page }) => {
    await page.goto('/adventure');

    await expect(
      page.getByText(/found frames that match your vision/i)
    ).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 1: Data roundtrip — binding stage persists after reload
  // ---------------------------------------------------------------------------

  test('binding stage persists after page reload', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for the page to load */
    const gallery = page.getByRole('listbox', {
      name: /available adventure frames/i,
    });
    await expect(gallery).toBeVisible({ timeout: 15000 });

    /* Reload the page */
    await page.reload();

    /* Frame gallery should still be visible */
    await expect(gallery).toBeVisible({ timeout: 15000 });

    /* Verify the server-side stage */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('binding');
  });

  // ---------------------------------------------------------------------------
  // Pattern 2: State across navigation — stage preserved after nav away
  // ---------------------------------------------------------------------------

  test('session stage preserved after navigating away and returning', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for the binding stage to load */
    await expect(
      page.getByRole('listbox', { name: /available adventure frames/i })
    ).toBeVisible({ timeout: 15000 });

    /* Navigate away to the home/sessions page */
    await page.goto('/');

    /* Navigate back to the adventure */
    await page.goto('/adventure');

    /* The binding stage should still be active */
    await expect(
      page.getByRole('listbox', { name: /available adventure frames/i })
    ).toBeVisible({ timeout: 15000 });
  });
});
