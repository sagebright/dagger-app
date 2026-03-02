/**
 * Anthropic SDK mock for Tier 2 integration tests
 *
 * Intercepts chat endpoints at the Playwright route level so the real
 * Express routing, auth middleware, and Supabase persistence all execute
 * normally -- only the Anthropic API call is replaced with a deterministic
 * SSE response.
 *
 * Strategy:
 * The API server streams Anthropic responses through POST /api/chat and
 * POST /api/chat/greet. This module uses Playwright's page.route() to
 * intercept those requests and return pre-built SSE bodies, giving tests
 * full control over the "AI" responses.
 *
 * For deeper API-layer mocking (e.g., setting ANTHROPIC_API_KEY to a
 * test sentinel so the server skips real SDK calls), see the env.ts
 * configuration and .env.e2e.example.
 */

import type { Page, Route } from '@playwright/test';

// =============================================================================
// Constants
// =============================================================================

const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

// =============================================================================
// Types
// =============================================================================

export interface AnthropicMockController {
  /** Replace the SSE body returned by POST /api/chat */
  setChatResponse: (body: string) => void;
  /** Replace the SSE body returned by POST /api/chat/greet */
  setGreetResponse: (body: string) => void;
  /** Tear down route interception (call in afterEach) */
  dispose: () => Promise<void>;
}

// =============================================================================
// SSE Body Builder
// =============================================================================

/**
 * Build a minimal SSE body with a single text response.
 *
 * Produces the same event sequence the real API emits:
 *   chat:start -> chat:delta -> chat:end
 *
 * For tool-call responses, callers should construct the SSE body
 * manually using the event format from shared-types/sage-events.ts.
 */
export function buildSimpleSSE(text: string): string {
  const messageId = `msg_e2e_${Date.now()}`;
  const lines = [
    `event: chat:start\ndata: ${JSON.stringify({ messageId })}\n`,
    `event: chat:delta\ndata: ${JSON.stringify({ messageId, content: text })}\n`,
    `event: chat:end\ndata: ${JSON.stringify({ messageId, inputTokens: 10, outputTokens: 5 })}\n`,
  ];
  return lines.join('\n');
}

// =============================================================================
// Route Interception
// =============================================================================

/**
 * Install Playwright route handlers that intercept Anthropic-dependent
 * endpoints and return deterministic SSE responses.
 *
 * Returns a controller that lets each test swap the response body
 * between interactions (e.g., switch from invoking to attuning).
 *
 * Usage:
 *   const mock = await installAnthropicMock(page);
 *   mock.setChatResponse(buildSimpleSSE('Hello from the Sage'));
 *   // ... interact with page ...
 *   await mock.dispose();
 */
export async function installAnthropicMock(
  page: Page,
  options: {
    initialChatBody?: string;
    initialGreetBody?: string;
    /**
     * When provided, also intercept GET /api/auth/session to return the
     * authenticated user. This bypasses the server-side auth rate limiter
     * (10 req/min) that otherwise causes 429 errors when running the full
     * test suite sequentially.
     */
    authUser?: { id: string; email: string };
  } = {}
): Promise<AnthropicMockController> {
  let chatBody =
    options.initialChatBody ?? buildSimpleSSE('Mock Sage response.');
  let greetBody =
    options.initialGreetBody ?? buildSimpleSSE('Welcome, storyteller.');

  const chatHandler = async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: chatBody,
    });
  };

  const greetHandler = async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: greetBody,
    });
  };

  /* Install route handlers — greet first (more specific) */
  await page.route('**/api/chat/greet', greetHandler);
  await page.route('**/api/chat', chatHandler);

  /*
   * Optionally mock GET /api/auth/session to avoid the auth rate limiter.
   * The real API validates the Bearer token against Supabase; the mock
   * returns the known user directly so the AuthProvider's restoreSession()
   * succeeds without hitting the server.
   */
  let authSessionHandler: ((route: Route) => Promise<void>) | undefined;

  if (options.authUser) {
    const userPayload = JSON.stringify({ user: options.authUser });
    authSessionHandler = async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: userPayload,
        });
      } else {
        await route.continue();
      }
    };
    await page.route('**/api/auth/session', authSessionHandler);
  }

  /*
   * 429 retry handler for browser-side session/credit API calls.
   *
   * The API enforces a 100-req/min general rate limit. When the full suite
   * runs sequentially, browser-side calls to load sessions can get 429'd.
   * These handlers use route.fetch() + retry with backoff for the endpoints
   * the browser calls that are NOT already mocked (chat, greet, auth).
   */
  const retryOnRateLimit = async (route: Route) => {
    try {
      /*
       * Retry up to 45 seconds. The API's sliding window is 60s so worst
       * case we wait for the oldest request to age out.
       */
      const deadline = Date.now() + 45_000;
      let attempt = 0;
      while (Date.now() < deadline) {
        const response = await route.fetch();
        if (response.status() !== 429) {
          await route.fulfill({ response });
          return;
        }
        /* Use the server's Retry-After hint or fall back to escalating delay */
        let delayMs = Math.min(2000 * (attempt + 1), 10_000);
        const retryAfter = response.headers()['retry-after'];
        if (retryAfter) {
          delayMs = parseInt(retryAfter, 10) * 1000 + 500;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempt++;
      }
      /* Deadline exceeded — make one final attempt */
      const finalResponse = await route.fetch();
      await route.fulfill({ response: finalResponse });
    } catch {
      /* Swallow errors from page/test lifecycle teardown (e.g., "Test ended.") */
    }
  };

  /* Register retry handlers for browser-side session endpoints */
  await page.route('**/api/sessions', retryOnRateLimit);
  await page.route('**/api/session/**', retryOnRateLimit);
  await page.route('**/api/credits/**', retryOnRateLimit);

  return {
    setChatResponse: (body) => {
      chatBody = body;
    },
    setGreetResponse: (body) => {
      greetBody = body;
    },
    dispose: async () => {
      await page.unroute('**/api/sessions', retryOnRateLimit);
      await page.unroute('**/api/session/**', retryOnRateLimit);
      await page.unroute('**/api/credits/**', retryOnRateLimit);
      await page.unroute('**/api/chat/greet', greetHandler);
      await page.unroute('**/api/chat', chatHandler);
      if (authSessionHandler) {
        await page.unroute('**/api/auth/session', authSessionHandler);
      }
    },
  };
}
