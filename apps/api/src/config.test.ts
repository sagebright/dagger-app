/**
 * Tests for the API configuration module
 *
 * Verifies that config reads from environment variables with correct defaults.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset modules so config re-reads env vars
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses default port 3001 when PORT is not set', async () => {
    delete process.env.PORT;
    const { config } = await import('./config.js');
    expect(config.port).toBe(3001);
  });

  it('reads PORT from environment', async () => {
    process.env.PORT = '4000';
    const { config } = await import('./config.js');
    expect(config.port).toBe(4000);
  });

  it('defaults nodeEnv to development', async () => {
    delete process.env.NODE_ENV;
    const { config } = await import('./config.js');
    expect(config.nodeEnv).toBe('development');
  });

  it('reads NODE_ENV from environment', async () => {
    process.env.NODE_ENV = 'production';
    const { config } = await import('./config.js');
    expect(config.nodeEnv).toBe('production');
  });

  it('defaults allowedOrigins to localhost:5173', async () => {
    delete process.env.ALLOWED_ORIGINS;
    const { config } = await import('./config.js');
    expect(config.allowedOrigins).toBe('http://localhost:5173');
  });

  it('reads ALLOWED_ORIGINS from environment', async () => {
    process.env.ALLOWED_ORIGINS = 'http://example.com,http://other.com';
    const { config } = await import('./config.js');
    expect(config.allowedOrigins).toBe('http://example.com,http://other.com');
  });

  it('sets isDev to true in development', async () => {
    process.env.NODE_ENV = 'development';
    const { config } = await import('./config.js');
    expect(config.isDev).toBe(true);
  });

  it('sets isDev to false in production', async () => {
    process.env.NODE_ENV = 'production';
    const { config } = await import('./config.js');
    expect(config.isDev).toBe(false);
  });

  it('reads Supabase config from environment', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    const { config } = await import('./config.js');
    expect(config.supabase.url).toBe('https://test.supabase.co');
    expect(config.supabase.serviceRoleKey).toBe('test-key');
  });

  it('reads Anthropic API key from environment', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    const { config } = await import('./config.js');
    expect(config.anthropicApiKey).toBe('sk-ant-test');
  });

  it('defaults Anthropic API key to empty string', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { config } = await import('./config.js');
    expect(config.anthropicApiKey).toBe('');
  });
});
