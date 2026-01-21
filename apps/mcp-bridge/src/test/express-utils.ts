/**
 * Express test utilities for mcp-bridge
 *
 * Provides a test app factory for use with supertest.
 * Creates a minimal Express app with routes but without server startup.
 */

import express, { type Express } from 'express';
import healthRouter from '../routes/health.js';
import adventureRouter from '../routes/adventure.js';
import customFramesRouter from '../routes/custom-frames.js';

/**
 * Creates a test Express app with all routes configured.
 *
 * This creates a lightweight app suitable for supertest without:
 * - WebSocket server
 * - Request logging (to keep test output clean)
 * - Server.listen() call
 *
 * @example
 * ```ts
 * import { describe, it, expect } from 'vitest';
 * import request from 'supertest';
 * import { createTestApp } from '../test/express-utils.js';
 *
 * describe('health route', () => {
 *   it('returns 200', async () => {
 *     const app = createTestApp();
 *     const response = await request(app).get('/health');
 *     expect(response.status).toBe(200);
 *   });
 * });
 * ```
 */
export function createTestApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  app.use('/health', healthRouter);
  app.use('/adventure', adventureRouter);
  app.use('/api/custom-frames', customFramesRouter);

  return app;
}
