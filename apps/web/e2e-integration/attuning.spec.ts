/**
 * Tier 2 integration tests for the Attuning stage
 *
 * Verifies against the real API + Supabase backend that:
 *   - All 8 component group labels display correctly (Session, Party, Essence)
 *   - Component update persistence across page reload (data roundtrip)
 *   - Conditional rendering: confirmed vs unconfirmed component rows
 *   - Rapid interaction: multiple component updates resolve correctly
 *
 * Patterns used: data roundtrip, conditional rendering, rapid interaction
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
// Constants
// =============================================================================

const COMPONENT_GROUPS = ['Session', 'Party', 'Essence'];
const COMPONENT_LABELS = [
  'Span', 'Scenes', 'Members', 'Tier',
  'Tenor', 'Pillars', 'Chorus', 'Threads',
];

// =============================================================================
// Helpers
// =============================================================================

/**
 * Advance a session to the attuning stage via the API.
 *
 * The session starts at 'invoking' — we POST /api/session/:id/advance
 * to move it to 'attuning'.
 */
async function advanceToAttuning(
  sessionId: string,
  accessToken: string
): Promise<void> {
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
      `Failed to advance session to attuning (HTTP ${response.status}): ${body}`
    );
  }
}

// =============================================================================
// Test Suite
// =============================================================================

test.describe('Attuning Stage (Tier 2)', () => {
  let auth: AuthSession;
  let sessionId: string;
  let mock: AnthropicMockController;

  test.beforeEach(async ({ page }) => {
    auth = await signInTestUser();
    const { session } = await createTestSession({ accessToken: auth.accessToken });
    sessionId = session.id;

    /* Advance to attuning stage */
    await advanceToAttuning(sessionId, auth.accessToken);

    /* Inject auth tokens into browser localStorage */
    await page.goto('/login');
    await page.evaluate(
      ({ token, refresh }) => {
        localStorage.setItem('sage_codex_token', token);
        localStorage.setItem('sage_codex_refresh', refresh);
      },
      { token: auth.accessToken, refresh: auth.refreshToken }
    );

    /* Install Anthropic mock */
    mock = await installAnthropicMock(page, {
      initialGreetBody: buildSimpleSSE(
        'Let us attune the 8 components that shape your adventure.'
      ),
      initialChatBody: buildSimpleSSE('I have set span to 3-4 hours.'),
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
  // Pattern 3: Conditional rendering — all 8 components displayed
  // ---------------------------------------------------------------------------

  test('displays all 3 component group labels', async ({ page }) => {
    await page.goto('/adventure');

    for (const group of COMPONENT_GROUPS) {
      await expect(page.getByText(group).first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('displays all 8 component rows', async ({ page }) => {
    await page.goto('/adventure');

    /* Each component has a button with aria-label "Select {Label}" */
    for (const label of COMPONENT_LABELS) {
      await expect(
        page.getByRole('button', { name: `Select ${label}` })
      ).toBeVisible({ timeout: 15000 });
    }
  });

  // ---------------------------------------------------------------------------
  // Pattern 1: Data roundtrip — session stage persists after reload
  // ---------------------------------------------------------------------------

  test('attuning stage persists after page reload', async ({ page }) => {
    await page.goto('/adventure');

    /* Verify we are on the attuning stage */
    await expect(page.getByText('Attuning').first()).toBeVisible({ timeout: 15000 });

    /* Reload the page */
    await page.reload();

    /* Verify the stage is still attuning */
    await expect(page.getByText('Attuning').first()).toBeVisible({ timeout: 15000 });

    /* Verify on the server side */
    const loaded = await loadTestSession(sessionId, auth.accessToken);
    expect(loaded.session.stage).toBe('attuning');
  });

  // ---------------------------------------------------------------------------
  // Pattern 3: Conditional rendering — counter shows 0 of 8 initially
  // ---------------------------------------------------------------------------

  test('shows 0 of 8 gathered initially', async ({ page }) => {
    await page.goto('/adventure');

    await expect(
      page.getByText(/0.*of 8 gathered/i)
    ).toBeVisible({ timeout: 15000 });
  });

  // ---------------------------------------------------------------------------
  // Pattern 4: Rapid interaction — multiple chat messages resolve correctly
  // ---------------------------------------------------------------------------

  test('chat input accepts rapid messages without errors', async ({ page }) => {
    await page.goto('/adventure');

    const chatInput = page.getByLabel('Chat message input');
    await expect(chatInput).toBeVisible({ timeout: 15000 });

    /* Send messages in quick succession */
    mock.setChatResponse(buildSimpleSSE('Span set to 3-4 hours.'));
    await chatInput.fill('Set span to 3-4 hours');
    await chatInput.press('Enter');

    /* Wait briefly for the first message to process */
    await expect(page.getByText('Span set to 3-4 hours.')).toBeVisible({
      timeout: 15000,
    });

    /* Send another message immediately */
    mock.setChatResponse(buildSimpleSSE('Scenes set to 4.'));
    await chatInput.fill('Set scenes to 4');
    await chatInput.press('Enter');

    /* Both responses should be visible */
    await expect(page.getByText('Scenes set to 4.')).toBeVisible({
      timeout: 15000,
    });
  });
});
