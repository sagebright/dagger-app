/**
 * Sage Codex API Server
 *
 * Entry point for the Express server that serves as the backend for
 * Daggerheart adventure generation. Provides REST endpoints for
 * health checks, Daggerheart content queries, and session management.
 */

import 'dotenv/config';
import express, { type Express } from 'express';
import { config } from './config.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/logger.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import daggerheartRouter from './routes/daggerheart.js';
import sessionRouter, { sessionsListRouter } from './routes/session.js';
import chatRouter from './routes/chat.js';
import undoRouter from './routes/undo.js';
import componentRouter from './routes/component.js';
import frameRouter from './routes/frame.js';
import sceneRouter from './routes/scene.js';
import { requireAuth } from './middleware/auth.js';
import { registerInvokingTools } from './tools/invoking.js';
import { registerAttuningTools } from './tools/attuning.js';
import { registerBindingTools } from './tools/binding.js';
import { registerWeavingTools } from './tools/weaving.js';
import { registerInscribingTools } from './tools/inscribing.js';

export const API_VERSION = '0.0.1';

// Register tool handlers for all stages
registerInvokingTools();
registerAttuningTools();
registerBindingTools();
registerWeavingTools();
registerInscribingTools();

const app: Express = express();

// Middleware
app.use(requestLogger());
app.use(createCorsMiddleware());
app.use(express.json());

// Routes (all prefixed with /api)
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/daggerheart', requireAuth, daggerheartRouter);
app.use('/api/session', requireAuth, sessionRouter);
app.use('/api/sessions', requireAuth, sessionsListRouter);
app.use('/api/chat', requireAuth, chatRouter);
app.use('/api/section', requireAuth, undoRouter);
app.use('/api/component', requireAuth, componentRouter);
app.use('/api/frame', requireAuth, frameRouter);
app.use('/api/scene', requireAuth, sceneRouter);

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
