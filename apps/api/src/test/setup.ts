/**
 * Vitest setup file for API server tests
 *
 * Provides:
 * - Environment variable defaults for test isolation
 * - Global mock reset between tests
 *
 * =============================================================================
 * TEST LOCATION CONVENTION
 * =============================================================================
 *
 * Co-located tests: Place test files next to the source file they test.
 *
 *   apps/api/src/services/anthropic.ts
 *   apps/api/src/services/anthropic.test.ts
 *
 *   apps/api/src/routes/chat.ts
 *   apps/api/src/routes/chat.test.ts
 *
 * Shared test infrastructure:
 *
 *   apps/api/src/test/setup.ts        -- This file (global setup)
 *   apps/api/src/test/mocks/          -- Reusable mock factories
 *     anthropic.ts                    -- Anthropic Messages API mock
 *     supabase.ts                     -- Supabase client mock
 *   apps/api/src/test/helpers/        -- Test utility functions
 *     sse.ts                          -- SSE stream assertion helpers
 *   apps/api/src/test/fixtures/       -- Static test data
 *     adventure-state.ts              -- Sample adventure state objects
 *     messages.ts                     -- Sample chat messages
 *     tool-calls.ts                   -- Sample Anthropic tool_use blocks
 *
 * =============================================================================
 */

import { afterEach, beforeAll, vi } from 'vitest';

// =============================================================================
// Environment Variables
// =============================================================================

const TEST_ENV_DEFAULTS: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3001',
  ANTHROPIC_API_KEY: 'test-api-key-not-real',
  SUPABASE_URL: 'https://test-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-not-real',
  ALLOWED_ORIGINS: 'http://localhost:5173',
};

beforeAll(() => {
  for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
});

// =============================================================================
// Global Mock Reset
// =============================================================================

afterEach(() => {
  vi.restoreAllMocks();
});
