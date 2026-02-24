/**
 * Stateful API mock controller for E2E tests
 *
 * Provides a `MockController` that intercepts all API routes via Playwright's
 * page.route() and returns stage-appropriate responses. Supports:
 *
 * - setChatResponse(body)   — swap the SSE body returned by POST /api/chat
 * - setGreetResponse(body)  — swap the SSE body returned by POST /api/chat/greet
 * - setStage(stage)         — update the session stage for subsequent requests
 * - advanceStage()          — move to the next stage in sequence
 *
 * Usage:
 *   const controller = await setupMockAPI(page, 'invoking');
 *   controller.setChatResponse(buildInvokingSSE());
 *   // ... interact with page ...
 *   controller.setStage('attuning');
 */

import type { Page, Route } from '@playwright/test';
import { MOCK_USER_ID, MOCK_ACCESS_TOKEN, MOCK_EMAIL } from './auth';
import { buildSessionResponse } from './fixtures';
import { buildSimpleChatSSE } from './sse-builders';

// =============================================================================
// Constants
// =============================================================================

const STAGES = [
  'invoking',
  'attuning',
  'binding',
  'weaving',
  'inscribing',
  'delivering',
] as const;

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

const JSON_CONTENT_TYPE = 'application/json';

// =============================================================================
// MockController
// =============================================================================

export interface MockController {
  /** Set the SSE body for POST /api/chat */
  setChatResponse: (body: string) => void;
  /** Set the SSE body for POST /api/chat/greet (first call returns SSE, subsequent return JSON) */
  setGreetResponse: (body: string) => void;
  /** Update the current stage for session responses */
  setStage: (stage: string) => void;
  /** Advance to the next stage in sequence */
  advanceStage: () => void;
  /** Get the current stage */
  getStage: () => string;
  /** Reset the greet-called flag so greet returns SSE again */
  resetGreet: () => void;
}

// =============================================================================
// Setup
// =============================================================================

/**
 * Install all API route mocks and return a MockController.
 *
 * The controller lets tests swap responses between interactions,
 * enabling multi-stage journey tests in a single spec.
 */
export async function setupMockAPI(
  page: Page,
  initialStage: string = 'invoking'
): Promise<MockController> {
  let currentStage = initialStage;
  let chatBody = buildSimpleChatSSE('The Sage responds.');
  let greetBody = buildSimpleChatSSE('Welcome, storyteller.');
  let greetCalled = false;

  const controller: MockController = {
    setChatResponse: (body) => { chatBody = body; },
    setGreetResponse: (body) => { greetBody = body; },
    setStage: (stage) => { currentStage = stage; },
    advanceStage: () => {
      const idx = STAGES.indexOf(currentStage as typeof STAGES[number]);
      if (idx >= 0 && idx < STAGES.length - 1) {
        currentStage = STAGES[idx + 1];
      }
    },
    getStage: () => currentStage,
    resetGreet: () => { greetCalled = false; },
  };

  // ---- Auth routes ----
  await page.route('**/api/auth/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({
        user: { id: MOCK_USER_ID, email: MOCK_EMAIL },
        session: { access_token: MOCK_ACCESS_TOKEN },
      }),
    });
  });

  // ---- Sessions list ----
  await page.route('**/api/sessions', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({
        sessions: [buildSessionResponse(currentStage).session],
      }),
    });
  });

  // ---- Session detail / create / advance ----
  await page.route('**/api/session/**', async (route: Route) => {
    const method = route.request().method();

    if (method === 'PATCH') {
      controller.advanceStage();
      await fulfillSession(route, currentStage);
      return;
    }

    await fulfillSession(route, currentStage);
  });

  // ---- Chat SSE ----
  await page.route('**/api/chat', async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: chatBody,
    });
  });

  // ---- Greet SSE / JSON ----
  await page.route('**/api/chat/greet', async (route: Route) => {
    if (greetCalled) {
      await route.fulfill({
        status: 200,
        contentType: JSON_CONTENT_TYPE,
        body: JSON.stringify({ status: 'already_greeted' }),
      });
      return;
    }

    greetCalled = true;
    await route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: greetBody,
    });
  });

  // ---- Content mutation endpoints ----
  await page.route('**/api/component/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/frame/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/scene/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ success: true }),
    });
  });

  // ---- Daggerheart content queries ----
  await page.route('**/api/daggerheart/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ data: [] }),
    });
  });

  // ---- Credits endpoint ----
  await page.route('**/api/credits/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: JSON_CONTENT_TYPE,
      body: JSON.stringify({ credits: 10 }),
    });
  });

  return controller;
}

// =============================================================================
// Helpers
// =============================================================================

async function fulfillSession(route: Route, stage: string): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: JSON_CONTENT_TYPE,
    body: JSON.stringify(buildSessionResponse(stage)),
  });
}
