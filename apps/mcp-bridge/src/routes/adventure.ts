/**
 * Adventure routes for MCP Bridge
 *
 * Provides REST endpoints for adventure persistence operations:
 * - POST /adventure/save - Save/update adventure state
 * - GET /adventure/:sessionId - Load full adventure
 * - GET /adventure/:sessionId/metadata - Get metadata for recovery modal
 * - DELETE /adventure/:sessionId - Delete adventure
 * - POST /adventure/:sessionId/export - Mark adventure as exported
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import type { AdventureSnapshot, ApiError } from '@dagger-app/shared-types';
import {
  saveAdventure,
  loadAdventure,
  getAdventureMetadata,
  deleteAdventure,
  markExported,
} from '../services/web-adventure-queries.js';

const router: RouterType = Router();

/**
 * Validate required fields for AdventureSnapshot
 */
function validateSnapshot(body: unknown): body is AdventureSnapshot {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const snapshot = body as Record<string, unknown>;
  return (
    typeof snapshot.sessionId === 'string' &&
    snapshot.sessionId.length > 0 &&
    typeof snapshot.adventureName === 'string' &&
    snapshot.adventureName.length > 0 &&
    typeof snapshot.currentPhase === 'string' &&
    Array.isArray(snapshot.phaseHistory)
  );
}

/**
 * POST /adventure/save
 *
 * Save or update adventure state. Uses upsert by session_id.
 */
router.post('/save', async (req: Request, res: Response) => {
  // Validate request body
  if (!validateSnapshot(req.body)) {
    const error: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Missing required fields: sessionId, adventureName, currentPhase, phaseHistory',
    };
    res.status(400).json(error);
    return;
  }

  const result = await saveAdventure(req.body);

  if (result.error || !result.data) {
    const error: ApiError = {
      code: 'SAVE_FAILED',
      message: result.error ?? 'Failed to save adventure',
    };
    res.status(500).json(error);
    return;
  }

  res.status(200).json({
    success: true,
    sessionId: result.data.sessionId,
    updatedAt: result.data.updatedAt,
  });
});

/**
 * GET /adventure/:sessionId
 *
 * Load full adventure state by session ID.
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  const result = await loadAdventure(sessionId);

  if (result.error) {
    const error: ApiError = {
      code: 'LOAD_FAILED',
      message: result.error,
    };
    res.status(500).json(error);
    return;
  }

  if (!result.data) {
    res.status(200).json({
      exists: false,
    });
    return;
  }

  res.status(200).json({
    exists: true,
    adventure: result.data,
  });
});

/**
 * GET /adventure/:sessionId/metadata
 *
 * Get lightweight metadata for recovery modal display.
 */
router.get('/:sessionId/metadata', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  const result = await getAdventureMetadata(sessionId);

  if (result.error) {
    const error: ApiError = {
      code: 'METADATA_FAILED',
      message: result.error,
    };
    res.status(500).json(error);
    return;
  }

  if (!result.data) {
    res.status(200).json({
      exists: false,
    });
    return;
  }

  res.status(200).json(result.data);
});

/**
 * DELETE /adventure/:sessionId
 *
 * Delete adventure (used for "Start Fresh" functionality).
 */
router.delete('/:sessionId', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  const result = await deleteAdventure(sessionId);

  if (!result.success) {
    const error: ApiError = {
      code: 'DELETE_FAILED',
      message: result.error ?? 'Failed to delete adventure',
    };
    res.status(500).json(error);
    return;
  }

  res.status(200).json({
    success: true,
  });
});

/**
 * POST /adventure/:sessionId/export
 *
 * Mark adventure as exported (updates timestamp and count).
 */
router.post('/:sessionId/export', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  const result = await markExported(sessionId);

  if (result.error || !result.data) {
    const error: ApiError = {
      code: 'EXPORT_MARK_FAILED',
      message: result.error ?? 'Failed to mark adventure as exported',
    };
    res.status(500).json(error);
    return;
  }

  res.status(200).json({
    success: true,
    lastExportedAt: result.data.lastExportedAt,
    exportCount: result.data.exportCount,
  });
});

export default router;
