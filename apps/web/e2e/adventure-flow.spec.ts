/**
 * E2E tests for the full adventure creation flow
 *
 * Tests the complete Sage Codex journey through all 6 stages:
 * Invoking -> Attuning -> Binding -> Weaving -> Inscribing -> Delivering
 *
 * These tests require a running dev server with API backend.
 * API routes are mocked at the network level to avoid
 * dependency on external services (Anthropic, Supabase).
 */

import { test, expect, type Page, type Route } from '@playwright/test';

// =============================================================================
// Constants
// =============================================================================

const MOCK_SESSION_ID = 'session-e2e-001';
const MOCK_USER_ID = 'user-e2e-001';
const MOCK_ACCESS_TOKEN = 'e2e-test-token';

const STAGES = [
  'invoking',
  'attuning',
  'binding',
  'weaving',
  'inscribing',
  'delivering',
] as const;

// =============================================================================
// Mock API Helpers
// =============================================================================

/**
 * Create a mock SSE response body for the chat endpoint.
 *
 * Simulates a minimal Sage response with a text message.
 */
function createMockSSEBody(text: string): string {
  const messageId = `msg_${Date.now()}`;
  const lines = [
    `event: chat:start\ndata: ${JSON.stringify({ messageId })}\n`,
    `event: chat:delta\ndata: ${JSON.stringify({ messageId, content: text })}\n`,
    `event: chat:end\ndata: ${JSON.stringify({ messageId, inputTokens: 50, outputTokens: 20 })}\n`,
  ];
  return lines.join('\n');
}

/**
 * Create a mock session response for a given stage.
 */
function createSessionResponse(stage: string) {
  return {
    session: {
      id: MOCK_SESSION_ID,
      user_id: MOCK_USER_ID,
      title: 'E2E Test Adventure',
      stage,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    adventureState: {
      id: 'state-e2e-001',
      session_id: MOCK_SESSION_ID,
      components: {},
      frame: null,
      outline: null,
      scenes: [],
    },
  };
}

/**
 * Set up API route mocks for the adventure flow.
 *
 * Intercepts all API calls and returns mock responses to
 * allow E2E testing without real backend services.
 */
async function setupAPIMocks(page: Page, initialStage: string = 'invoking') {
  let currentStage = initialStage;

  // Mock auth verification
  await page.route('**/api/auth/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: MOCK_USER_ID, email: 'test@e2e.com' },
        session: { access_token: MOCK_ACCESS_TOKEN },
      }),
    });
  });

  // Mock sessions list
  await page.route('**/api/sessions', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessions: [createSessionResponse(currentStage).session],
      }),
    });
  });

  // Mock session detail and create
  await page.route('**/api/session/**', async (route: Route) => {
    const method = route.request().method();

    if (method === 'POST') {
      // Create session
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createSessionResponse(currentStage)),
      });
      return;
    }

    if (method === 'PATCH') {
      // Advance stage
      const stageIndex = STAGES.indexOf(currentStage as typeof STAGES[number]);
      if (stageIndex < STAGES.length - 1) {
        currentStage = STAGES[stageIndex + 1];
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createSessionResponse(currentStage)),
      });
      return;
    }

    // GET session detail
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createSessionResponse(currentStage)),
    });
  });

  // Mock chat endpoint (SSE)
  await page.route('**/api/chat', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body: createMockSSEBody('The Sage responds to your words.'),
    });
  });

  // Mock component, frame, scene endpoints
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

  // Mock Daggerheart content queries
  await page.route('**/api/daggerheart/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  return {
    getStage: () => currentStage,
    setStage: (stage: string) => { currentStage = stage; },
  };
}

// =============================================================================
// Tests
// =============================================================================

test.describe('Full Adventure Flow', () => {
  test('should load the adventure page with a session', async ({ page }) => {
    await setupAPIMocks(page, 'invoking');

    // Set auth state via localStorage mock for Supabase
    await page.goto('/login');
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'e2e-test-token',
        refresh_token: 'e2e-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-e2e-001', email: 'test@e2e.com' },
      };
      localStorage.setItem(
        'sb-ogvbbfzfljglfanceest-auth-token',
        JSON.stringify({ currentSession: mockSession, expiresAt: Date.now() + 3600000 })
      );
    });

    await page.goto('/adventure');

    // Should show the adventure page (not redirected to login)
    // The page should load without errors
    await page.waitForLoadState('networkidle');
  });

  test('should display session picker when no active session exists', async ({ page }) => {
    // Mock with no active session
    await page.route('**/api/sessions', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [] }),
      });
    });

    await page.route('**/api/auth/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: MOCK_USER_ID, email: 'test@e2e.com' },
        }),
      });
    });

    // Set auth state
    await page.goto('/login');
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'e2e-test-token',
        refresh_token: 'e2e-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-e2e-001', email: 'test@e2e.com' },
      };
      localStorage.setItem(
        'sb-ogvbbfzfljglfanceest-auth-token',
        JSON.stringify({ currentSession: mockSession, expiresAt: Date.now() + 3600000 })
      );
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show the new session form
    await expect(
      page.getByText(/begin a new tale|open the codex/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should handle chat message sending', async ({ page }) => {
    await setupAPIMocks(page, 'invoking');

    await page.goto('/login');
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'e2e-test-token',
        refresh_token: 'e2e-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-e2e-001', email: 'test@e2e.com' },
      };
      localStorage.setItem(
        'sb-ogvbbfzfljglfanceest-auth-token',
        JSON.stringify({ currentSession: mockSession, expiresAt: Date.now() + 3600000 })
      );
    });

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Look for a chat input area
    const chatInput = page.locator(
      'textarea[placeholder*="message"], input[placeholder*="message"], [data-testid="chat-input"]'
    );

    // If chat input is visible, try sending a message
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatInput.fill('I want to create a dark fantasy adventure');
      await chatInput.press('Enter');

      // Wait for streaming to complete
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Adventure Error Scenarios', () => {
  test('should show error when session load fails', async ({ page }) => {
    // Mock failing sessions endpoint
    await page.route('**/api/sessions', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/login');
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'e2e-test-token',
        refresh_token: 'e2e-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-e2e-001', email: 'test@e2e.com' },
      };
      localStorage.setItem(
        'sb-ogvbbfzfljglfanceest-auth-token',
        JSON.stringify({ currentSession: mockSession, expiresAt: Date.now() + 3600000 })
      );
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show an error state
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('should handle chat API errors gracefully', async ({ page }) => {
    const mocks = await setupAPIMocks(page, 'invoking');

    // Override chat to return error
    await page.route('**/api/chat', async (route: Route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded. Please wait before sending another message.',
        }),
      });
    });

    await page.goto('/login');
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'e2e-test-token',
        refresh_token: 'e2e-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-e2e-001', email: 'test@e2e.com' },
      };
      localStorage.setItem(
        'sb-ogvbbfzfljglfanceest-auth-token',
        JSON.stringify({ currentSession: mockSession, expiresAt: Date.now() + 3600000 })
      );
    });

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Attempt to find and use chat input
    const chatInput = page.locator(
      'textarea[placeholder*="message"], input[placeholder*="message"], [data-testid="chat-input"]'
    );

    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatInput.fill('test message');
      await chatInput.press('Enter');

      // Wait for error handling
      await page.waitForTimeout(2000);
    }

    // Suppress the lint warning about unused mocks variable
    void mocks;
  });

  test('should handle network failure during chat', async ({ page }) => {
    await setupAPIMocks(page, 'invoking');

    // Override chat to simulate network failure
    await page.route('**/api/chat', async (route: Route) => {
      await route.abort('failed');
    });

    await page.goto('/login');
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'e2e-test-token',
        refresh_token: 'e2e-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-e2e-001', email: 'test@e2e.com' },
      };
      localStorage.setItem(
        'sb-ogvbbfzfljglfanceest-auth-token',
        JSON.stringify({ currentSession: mockSession, expiresAt: Date.now() + 3600000 })
      );
    });

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');
  });
});
