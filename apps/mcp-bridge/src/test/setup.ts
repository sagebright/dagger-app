/**
 * Vitest setup file for mcp-bridge tests
 *
 * Sets required environment variables before tests run.
 * These values are for testing only and not real credentials.
 */

// Set test environment variables before any tests run
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-for-testing-only';
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
