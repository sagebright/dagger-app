/**
 * Undo endpoint for Sage Codex
 *
 * POST /api/section/undo
 *
 * Reverts a specific section of the adventure state to its previous
 * version using the version history stack. Emits an SSE event to
 * notify connected clients of the state change.
 *
 * Body: { sessionId: string, sectionPath: string }
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { getSupabase } from '../services/supabase.js';
import { applyUndo } from '../services/version-history.js';
import type { AdventureState, SectionPath } from '@sage-codex/shared-types';

// =============================================================================
// Constants
// =============================================================================

const VALID_TOP_LEVEL_SECTIONS = ['spark', 'components', 'frame', 'sceneArcs'];
const VALID_SCENE_SECTIONS = [
  'introduction', 'keyMoments', 'resolution',
  'npcs', 'adversaries', 'items',
  'portents', 'tierGuidance', 'toneNotes',
];

// =============================================================================
// Validation
// =============================================================================

interface UndoRequestBody {
  sessionId: string;
  sectionPath: SectionPath;
}

/**
 * Validate the undo request body.
 */
function validateUndoRequest(
  body: unknown
): UndoRequestBody | { error: string } {
  const req = body as Partial<UndoRequestBody>;

  if (!req.sessionId || typeof req.sessionId !== 'string') {
    return { error: 'sessionId is required and must be a string' };
  }

  if (!req.sectionPath || typeof req.sectionPath !== 'string') {
    return { error: 'sectionPath is required and must be a string' };
  }

  if (!isValidSectionPath(req.sectionPath)) {
    return { error: `Invalid sectionPath: "${req.sectionPath}"` };
  }

  return { sessionId: req.sessionId, sectionPath: req.sectionPath as SectionPath };
}

/**
 * Check if a string is a valid SectionPath.
 */
function isValidSectionPath(path: string): boolean {
  if (VALID_TOP_LEVEL_SECTIONS.includes(path)) return true;

  if (path.startsWith('scene:')) {
    const parts = path.split(':');
    if (parts.length !== 3) return false;
    return VALID_SCENE_SECTIONS.includes(parts[2]);
  }

  return false;
}

// =============================================================================
// Route
// =============================================================================

const router: RouterType = Router();

/**
 * POST /api/section/undo
 *
 * Reverts a section to its previous version.
 *
 * Loads the adventure state from the database, applies the undo,
 * saves the updated state, and returns the restored value.
 */
router.post('/undo', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const validation = validateUndoRequest(req.body);
  if ('error' in validation) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const { sessionId, sectionPath } = validation;

  try {
    const supabase = getSupabase();

    // Load the session to verify ownership
    const { data: sessionData, error: sessionError } = await supabase
      .from('sage_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !sessionData) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Load the adventure state
    const { data: stateRow, error: stateError } = await supabase
      .from('sage_adventure_state')
      .select('id, state')
      .eq('session_id', sessionId)
      .single();

    if (stateError || !stateRow) {
      res.status(404).json({ error: 'Adventure state not found' });
      return;
    }

    const adventureState = (stateRow as { id: string; state: AdventureState }).state;
    if (!adventureState) {
      res.status(400).json({ error: 'Adventure state is empty' });
      return;
    }

    // Apply the undo
    const undoResult = applyUndo(adventureState, sectionPath);
    if (!undoResult.success) {
      res.status(400).json({ error: undoResult.error });
      return;
    }

    // Save the updated state
    const { error: updateError } = await supabase
      .from('sage_adventure_state')
      .update({ state: adventureState })
      .eq('session_id', sessionId);

    if (updateError) {
      res.status(500).json({ error: 'Failed to save updated state' });
      return;
    }

    res.json({
      success: true,
      sectionPath,
      restoredValue: undoResult.restoredValue,
      remainingEntries: undoResult.remainingEntries,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Undo operation failed';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
