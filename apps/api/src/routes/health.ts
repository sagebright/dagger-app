/**
 * Health check route for Sage Codex API
 *
 * Provides system health status including database connectivity.
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import type { HealthResponse } from '@dagger-app/shared-types';
import { checkSupabaseHealth } from '../services/supabase.js';

const router: RouterType = Router();

/**
 * GET /api/health
 *
 * Returns health status of the API server including:
 * - Server status
 * - Supabase database connectivity
 */
router.get('/', async (_req: Request, res: Response) => {
  const dbHealth = await checkSupabaseHealth();

  const response: HealthResponse = {
    status: dbHealth.connected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.connected,
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error,
    },
  };

  const statusCode = dbHealth.connected ? 200 : 503;
  res.status(statusCode).json(response);
});

export default router;
