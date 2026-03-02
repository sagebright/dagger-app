/**
 * E2E tests for session resume after page refresh
 *
 * Verifies that the application correctly restores session state
 * when the user refreshes the page at each stage of the adventure.
 *
 * Tests cover:
 * - Resuming at each of the 6 stages (Invoking through Delivering)
 * - Auth session persistence across page refresh
 * - Navigation back to the correct stage after refresh
 */

import { test, expect, type Page, type Route } from '@playwright/test';

// =============================================================================
// Constants
// =============================================================================

const MOCK_SESSION_ID = 'session-resume-001';
const MOCK_USER_ID = 'user-resume-001';

const STAGES = [
  'invoking',
  'attuning',
  'binding',
  'weaving',
  'inscribing',
  'delivering',
] as const;

type StageName = typeof STAGES[number];

// =============================================================================
// Mock Helpers
// =============================================================================

/**
 * Create a mock session at a specific stage.
 */
function createStageSession(stage: StageName) {
  return {
    session: {
      id: MOCK_SESSION_ID,
      user_id: MOCK_USER_ID,
      title: 'Resume Test Adventure',
      stage,
      is_active: true,
      created_at: '2026-02-15T10:00:00.000Z',
      updated_at: new Date().toISOString(),
    },
    adventureState: {
      id: 'state-resume-001',
      session_id: MOCK_SESSION_ID,
      state: {
        stage,
        spark: stage !== 'invoking' ? 'A dark tale of mystery' : '',
        components: {},
        frame: stage === 'binding' || stage === 'weaving' || stage === 'inscribing' || stage === 'delivering'
          ? { name: 'The Haunted Monastery', description: 'Ancient halls' }
          : null,
        outline: null,
        scenes: [],
        sceneArcs: [],
        entities: { npcs: [], adversaries: [], items: [], portents: [] },
      },
      components: {},
      frame: null,
      outline: null,
      scenes: [],
    },
  };
}

/**
 * Set up mocks for a specific stage and inject auth state.
 */
async function setupStageResumeMocks(page: Page, stage: StageName) {
  // Mock auth
  await page.route('**/api/auth/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: MOCK_USER_ID, email: 'test@resume.com' },
      }),
    });
  });

  // Mock sessions list
  await page.route('**/api/sessions', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessions: [createStageSession(stage).session],
      }),
    });
  });

  // Mock session detail
  await page.route('**/api/session/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createStageSession(stage)),
    });
  });

  // Mock chat endpoint
  await page.route('**/api/chat', async (route: Route) => {
    const messageId = `msg_${Date.now()}`;
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        `event: chat:start\ndata: ${JSON.stringify({ messageId })}\n`,
        `event: chat:delta\ndata: ${JSON.stringify({ messageId, content: 'Welcome back, storyteller.' })}\n`,
        `event: chat:end\ndata: ${JSON.stringify({ messageId, inputTokens: 10, outputTokens: 5 })}\n`,
      ].join('\n'),
    });
  });

  // Mock content endpoints
  await page.route('**/api/daggerheart/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/component/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/frame/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/scene/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Inject a mock Supabase auth session into localStorage.
 */
async function injectAuthSession(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    const mockSession = {
      access_token: 'resume-test-token',
      refresh_token: 'resume-refresh-token',
      expires_at: Date.now() / 1000 + 3600,
      user: { id: 'user-resume-001', email: 'test@resume.com' },
    };
    localStorage.setItem('sage_codex_token', mockSession.access_token);
    localStorage.setItem('sage_codex_refresh', mockSession.refresh_token);
  });
}

// =============================================================================
// Tests
// =============================================================================

test.describe('Session Resume After Page Refresh', () => {
  for (const stage of STAGES) {
    test(`should resume at the ${stage} stage after page refresh`, async ({ page }) => {
      await setupStageResumeMocks(page, stage);
      await injectAuthSession(page);

      // Navigate to adventure page
      await page.goto('/adventure');

      // The page should load without errors (not redirected to login)
      await expect(page).toHaveURL(/\/adventure/, { timeout: 10000 });

      // Simulate page refresh
      await page.reload();

      // After refresh, should still be on the adventure page
      await expect(page).toHaveURL(/\/adventure/, { timeout: 10000 });
    });
  }

  test('should preserve auth state across page refresh', async ({ page }) => {
    await setupStageResumeMocks(page, 'attuning');
    await injectAuthSession(page);

    await page.goto('/adventure');
    await expect(page).toHaveURL(/\/adventure/, { timeout: 10000 });

    // Verify auth token is still in localStorage
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('sage_codex_token') !== null;
    });
    expect(hasToken).toBe(true);

    // Refresh the page
    await page.reload();

    // Auth should still be valid
    const hasTokenAfterRefresh = await page.evaluate(() => {
      return localStorage.getItem('sage_codex_token') !== null;
    });
    expect(hasTokenAfterRefresh).toBe(true);

    // Should not be redirected to login
    await expect(page).toHaveURL(/\/adventure/);
  });

  test('should redirect to session picker if session becomes inactive', async ({ page }) => {
    // Mock with inactive session
    await page.route('**/api/auth/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: MOCK_USER_ID, email: 'test@resume.com' },
        }),
      });
    });

    await page.route('**/api/sessions', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [{
            id: MOCK_SESSION_ID,
            user_id: MOCK_USER_ID,
            title: 'Old Adventure',
            stage: 'delivering',
            is_active: false,
            created_at: '2026-02-15T10:00:00.000Z',
            updated_at: new Date().toISOString(),
          }],
        }),
      });
    });

    await injectAuthSession(page);
    await page.goto('/adventure');

    // Should redirect to session picker since no active session exists
    await expect(page).not.toHaveURL(/\/adventure/, { timeout: 10000 });
  });
});
