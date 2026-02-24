/**
 * E2E auth injection helpers
 *
 * Shared patterns for injecting mock Supabase auth session
 * into localStorage so protected routes allow access.
 *
 * Usage:
 *   import { injectAuth, MOCK_USER_ID, MOCK_ACCESS_TOKEN } from './helpers/auth';
 *   await injectAuth(page);
 */

import type { Page } from '@playwright/test';

// =============================================================================
// Constants
// =============================================================================

export const MOCK_USER_ID = 'user-e2e-001';
export const MOCK_ACCESS_TOKEN = 'e2e-test-token';
export const MOCK_REFRESH_TOKEN = 'e2e-refresh-token';
export const MOCK_EMAIL = 'test@e2e.com';

// =============================================================================
// Auth Injection
// =============================================================================

/**
 * Inject a mock Supabase auth session into localStorage.
 *
 * Navigates to /login first (to establish the page context),
 * sets tokens in localStorage, then returns so the caller can
 * navigate to the desired page.
 */
export async function injectAuth(page: Page): Promise<void> {
  await page.goto('/login');
  await page.evaluate(
    ({ token, refresh }) => {
      localStorage.setItem('sage_codex_token', token);
      localStorage.setItem('sage_codex_refresh', refresh);
    },
    { token: MOCK_ACCESS_TOKEN, refresh: MOCK_REFRESH_TOKEN }
  );
}
