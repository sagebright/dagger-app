import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/* Load E2E-specific environment variables before anything else */
try {
  const envPath = resolve(import.meta.dirname ?? '.', '.env.e2e');
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!process.env[key]) {
      process.env[key] = trimmed.slice(eqIdx + 1).trim();
    }
  }
} catch {
  /* .env.e2e is optional — env vars may come from CI secrets */
}

/**
 * Playwright Tier 2 integration test configuration
 *
 * Runs against real API server + Supabase backend.
 * Anthropic SDK is mocked at the API layer for deterministic responses.
 *
 * Key differences from Tier 1 (playwright.config.ts):
 * - Single worker to avoid race conditions on shared backend state
 * - webServer array starts both API + web dev servers
 * - globalSetup validates API reachability before running specs
 * - Test directory: e2e-integration/ (not e2e/)
 */

const API_PORT = 3001;
const WEB_PORT = 5173;
const API_BASE_URL = `http://localhost:${API_PORT}`;
const WEB_BASE_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: './e2e-integration',
  globalSetup: './e2e-integration/global-setup.ts',

  /* Run specs sequentially to avoid shared-backend race conditions */
  fullyParallel: false,
  workers: 1,

  /* Allow extra time for rate-limit retries during test setup */
  timeout: 60_000,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'html',

  use: {
    baseURL: WEB_BASE_URL,
    trace: 'on-first-retry',
    /* Pass API URL so helpers can reach the backend directly */
    extraHTTPHeaders: {
      'X-Test-API-URL': API_BASE_URL,
    },
  },

  projects: [
    {
      name: 'integration',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm --filter api dev',
      url: `${API_BASE_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      cwd: '../../',
    },
    {
      command: 'pnpm --filter web dev',
      url: WEB_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      cwd: '../../',
    },
  ],
});
