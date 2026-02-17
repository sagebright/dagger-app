/**
 * Session management routes for Sage Codex API
 *
 * Provides CRUD endpoints for adventure sessions and stage advancement.
 * All routes require authentication (requireAuth middleware applied upstream).
 *
 * Routes:
 *   POST   /api/session         - Create a new session
 *   GET    /api/session/:id     - Load a specific session
 *   GET    /api/sessions        - List all sessions for the user
 *   DELETE /api/session/:id     - Abandon (deactivate) a session
 *   POST   /api/session/:id/advance  - Advance to next stage
 *   POST   /api/session/:id/complete - Mark session as completed
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import {
  createSession,
  loadSession,
  listSessions,
  abandonSession,
  advanceStage,
  completeSession,
} from '../services/session-state.js';

const router: RouterType = Router();

/**
 * Extract the :id route parameter as a string.
 *
 * Express 5 types allow params to be string | string[].
 * This helper normalizes to a plain string.
 */
function extractParamId(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /api/session
 *
 * Create a new adventure session. Enforces one-active-session-per-user.
 * Body: { title: string }
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'Title is required and must be a string' });
    return;
  }

  const result = await createSession(userId, title);

  if (result.error) {
    const status = result.error.includes('already exists') ? 409 : 500;
    res.status(status).json({ error: result.error });
    return;
  }

  res.status(201).json(result.data);
});

/**
 * GET /api/session/:id
 *
 * Load a specific session with its adventure state.
 */
router.get('/:id', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const result = await loadSession(extractParamId(req), userId);

  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }

  res.json(result.data);
});

/**
 * DELETE /api/session/:id
 *
 * Abandon (deactivate) a session. Does not delete data.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const result = await abandonSession(extractParamId(req), userId);

  if (result.error) {
    res.status(404).json({ error: result.error });
    return;
  }

  res.json(result.data);
});

/**
 * POST /api/session/:id/advance
 *
 * Advance a session to the next stage in the Unfolding.
 */
router.post('/:id/advance', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const result = await advanceStage(extractParamId(req), userId);

  if (result.error) {
    const status = result.error.includes('not found') ? 404 : 400;
    res.status(status).json({ error: result.error });
    return;
  }

  res.json(result.data);
});

/**
 * POST /api/session/:id/complete
 *
 * Mark a session as completed. Only valid when the session is in the
 * 'delivering' stage. Deactivates the session to free the user for
 * a new adventure.
 */
router.post('/:id/complete', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const result = await completeSession(extractParamId(req), userId);

  if (result.error) {
    const status = result.error.includes('not found') ? 404 : 400;
    res.status(status).json({ error: result.error });
    return;
  }

  res.json(result.data);
});

// =============================================================================
// Sessions List (separate path for REST convention)
// =============================================================================

/**
 * Create a separate router for the /sessions (plural) list endpoint.
 *
 * This is exported separately and mounted at /api/sessions in index.ts.
 */
export const sessionsListRouter: RouterType = Router();

/**
 * GET /api/sessions
 *
 * List all sessions for the authenticated user.
 */
sessionsListRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const result = await listSessions(userId);

  if (result.error) {
    res.status(500).json({ error: result.error });
    return;
  }

  res.json({ sessions: result.data });
});

export default router;
