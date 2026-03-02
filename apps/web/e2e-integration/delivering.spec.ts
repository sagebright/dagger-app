/**
 * Tier 2 integration tests for the Delivering stage
 *
 * Verifies against the real API + Supabase backend that:
 *   - Final adventure is accessible and loads correctly (data roundtrip)
 *   - Download button is visible and interactive (conditional rendering)
 *   - Celebration panel content renders from DB state
 *   - Stage preserved across navigation (state across navigation)
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
 * Advance a session to the delivering stage via sequential API calls.
 *
 * invoking -> attuning -> binding -> weaving -> inscribing -> delivering
 */
async function advanceToDelivering(
  sessionId: string,
  accessToken: string
): Promise<void> {
  const advanceCount = 5;

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

test.describe('Delivering Stage (Tier 2)', () => {
  let auth: AuthSession;
  let sessionId: string;
  let mock: AnthropicMockController;

  test.beforeEach(async ({ page }) => {
    auth = await signInTestUser();
    const { session } = await createTestSession({ accessToken: auth.accessToken });
    sessionId = session.id;

    /* Advance to delivering stage */
    await advanceToDelivering(sessionId, auth.accessToken);

    /* Inject auth tokens into browser localStorage */
    await page.goto('/login');
    await page.evaluate(
      ({ token, refresh }) => {
        localStorage.setItem('sage_codex_token', token);
        localStorage.setItem('sage_codex_refresh', refresh);
      },
      { token: auth.accessToken, refresh: auth.refreshToken }
    );

    /* Install Anthropic mock with delivering-appropriate responses */
    mock = await installAnthropicMock(page, {
      initialGreetBody: buildSimpleSSE(
        'Your adventure is complete. Download your adventure below ' +
        'and bring this tale to life at your table.'
      ),
      initialChatBody: buildSimpleSSE(
        'The tale has been delivered. May it bring joy to your table.'
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
  // Pattern 3: Conditional rendering — delivering stage loads
  // ---------------------------------------------------------------------------

  test('renders the delivering stage with celebration greeting', async ({ page }) => {
    await page.goto('/adventure');

    await expect(
      page.getByText(/your adventure is complete/i)
    ).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 3: Conditional rendering — download button visible
  // ---------------------------------------------------------------------------

  test('download button is visible', async ({ page }) => {
    await page.goto('/adventure');

    const downloadButton = page.getByRole('button', {
      name: /bring this tale to life/i,
    });
    await expect(downloadButton).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 3: Conditional rendering — narrative send-off text
  // ---------------------------------------------------------------------------

  test('displays narrative send-off text', async ({ page }) => {
    await page.goto('/adventure');

    await expect(
      page.getByText(/your adventure has been delivered/i)
    ).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 1: Data roundtrip — delivering stage persists after reload
  // ---------------------------------------------------------------------------

  test('delivering stage persists after page reload', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for the page to load */
    await expect(
      page.getByText(/your adventure is complete/i)
    ).toBeVisible({ timeout: 15000 });

    /* Reload the page */
    await page.reload();

    /* Verify on the server side */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('delivering');
    expect(loaded.session.is_active).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Pattern 2: State across navigation — delivering preserved after nav away
  // ---------------------------------------------------------------------------

  test('delivering stage preserved after navigating away and returning', async ({ page }) => {
    await page.goto('/adventure');

    /* Wait for delivering to load */
    await expect(
      page.getByText(/your adventure is complete/i)
    ).toBeVisible({ timeout: 15000 });

    /* Navigate away to home */
    await page.goto('/');

    /* Navigate back */
    await page.goto('/adventure');

    /* Verify delivering is still the active stage */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('delivering');
  });
});
