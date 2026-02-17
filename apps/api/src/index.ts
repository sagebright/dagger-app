/**
 * Sage Codex API Server
 *
 * Entry point for the Express server that serves as the backend for
 * Daggerheart adventure generation. Provides REST endpoints for
 * health checks and Daggerheart content queries.
 */

import 'dotenv/config';
import express, { type Express } from 'express';
import { config } from './config.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/logger.js';
import healthRouter from './routes/health.js';
import daggerheartRouter from './routes/daggerheart.js';

export const API_VERSION = '0.0.1';

const app: Express = express();

// Middleware
app.use(requestLogger());
app.use(createCorsMiddleware());
app.use(express.json());

// Routes (all prefixed with /api)
app.use('/api/health', healthRouter);
app.use('/api/daggerheart', daggerheartRouter);

/**
 * Export the app for testing (supertest) and the start function
 * for the actual server entry point.
 */
export { app };

/** Start the server (only when run directly, not when imported for tests) */
export function startServer(): void {
  app.listen(config.port, () => {
    console.log(`Sage Codex API running on http://localhost:${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/api/health`);
  });
}

// Auto-start when this file is the entry point
const isDirectExecution = process.argv[1]?.endsWith('index.ts') ||
  process.argv[1]?.endsWith('index.js');

if (isDirectExecution) {
  startServer();
}
