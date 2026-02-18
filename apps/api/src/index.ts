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
import creditRouter from './routes/credits.js';
import stripeWebhookRouter from './routes/stripe-webhook.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { sanitizeInput } from './middleware/validation.js';
import { generalRateLimit, chatRateLimit, authRateLimit } from './middleware/rate-limit.js';
import { registerInvokingTools } from './tools/invoking.js';
import { registerAttuningTools } from './tools/attuning.js';
import { registerBindingTools } from './tools/binding.js';
import { registerWeavingTools } from './tools/weaving.js';
import { registerInscribingTools } from './tools/inscribing.js';
import { registerDeliveringTools } from './tools/delivering.js';

export const API_VERSION = '0.0.1';

// Register tool handlers for all stages
registerInvokingTools();
registerAttuningTools();
registerBindingTools();
registerWeavingTools();
registerInscribingTools();
registerDeliveringTools();

const app: Express = express();

// Middleware
app.use(requestLogger());
app.use(createCorsMiddleware());

// Stripe webhook must be registered BEFORE express.json() —
// signature verification requires the raw request body.
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter);

app.use(express.json());
app.use(sanitizeInput);

// Routes (all prefixed with /api)
app.use('/api/health', healthRouter);
app.use('/api/auth', authRateLimit, authRouter);
app.use('/api/daggerheart', generalRateLimit, requireAuth, daggerheartRouter);
app.use('/api/session', generalRateLimit, requireAuth, sessionRouter);
app.use('/api/sessions', generalRateLimit, requireAuth, sessionsListRouter);
app.use('/api/chat', chatRateLimit, requireAuth, chatRouter);
app.use('/api/section', generalRateLimit, requireAuth, undoRouter);
app.use('/api/component', generalRateLimit, requireAuth, componentRouter);
app.use('/api/frame', generalRateLimit, requireAuth, frameRouter);
app.use('/api/scene', generalRateLimit, requireAuth, sceneRouter);
app.use('/api/credits', generalRateLimit, requireAuth, creditRouter);

// Error handling middleware (must be registered after all routes)
app.use(errorHandler);

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
