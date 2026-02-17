/**
 * Tests for the health check route
 *
 * Verifies GET /api/health returns correct status and database health.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import healthRouter from './health.js';

// Mock the supabase service
vi.mock('../services/supabase.js', () => ({
  checkSupabaseHealth: vi.fn(),
}));

import { checkSupabaseHealth } from '../services/supabase.js';
const mockCheckHealth = vi.mocked(checkSupabaseHealth);

function createTestApp() {
  const app = express();
  app.use('/api/health', healthRouter);
  return app;
}

describe('Health Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with ok status when database is connected', async () => {
    mockCheckHealth.mockResolvedValue({
      connected: true,
      latencyMs: 15,
    });

    const app = createTestApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database.connected).toBe(true);
    expect(response.body.database.latencyMs).toBe(15);
    expect(response.body.timestamp).toBeDefined();
  });

  it('returns 503 with error status when database is disconnected', async () => {
    mockCheckHealth.mockResolvedValue({
      connected: false,
      error: 'Connection refused',
    });

    const app = createTestApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.database.connected).toBe(false);
    expect(response.body.database.error).toBe('Connection refused');
  });

  it('includes a timestamp in ISO format', async () => {
    mockCheckHealth.mockResolvedValue({ connected: true, latencyMs: 5 });

    const app = createTestApp();
    const response = await request(app).get('/api/health');

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp.toISOString()).toBe(response.body.timestamp);
  });
});
