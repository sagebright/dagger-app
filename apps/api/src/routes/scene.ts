/**
 * Scene confirmation routes for the Weaving stage
 *
 * Provides the endpoint for locking (confirming) a scene arc in Supabase.
 * Called by the frontend when the user confirms a scene summary.
 *
 * Routes:
 *   POST /api/scene/confirm -- Lock a scene arc as confirmed
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { getSupabase } from '../services/supabase.js';

const router: RouterType = Router();

// =============================================================================
// Types
// =============================================================================

interface SceneConfirmBody {
  sessionId: string;
  sceneArcId: string;
}

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /api/scene/confirm
 *
 * Mark a scene arc as confirmed in the adventure state.
 * Updates the JSONB state column to set the scene's confirmed status.
 */
router.post('/confirm', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const body = req.body as Partial<SceneConfirmBody>;

  if (!isValidSceneConfirmBody(body)) {
    res.status(400).json({
      error: 'Invalid request: sessionId and sceneArcId are required',
    });
    return;
  }

  try {
    await confirmSceneInState(body as SceneConfirmBody);
    res.json({ status: 'ok', sceneArcId: body.sceneArcId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to confirm scene: ${message}` });
  }
});

// =============================================================================
// Validation
// =============================================================================

function isValidSceneConfirmBody(body: unknown): body is SceneConfirmBody {
  if (!body || typeof body !== 'object') return false;
  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.sessionId === 'string' &&
    typeof candidate.sceneArcId === 'string'
  );
}

// =============================================================================
// Persistence
// =============================================================================

/**
 * Mark a scene arc as confirmed in the adventure state JSONB.
 *
 * Reads the current state, finds the matching scene arc, sets its
 * confirmed flag, and writes back.
 */
async function confirmSceneInState(body: SceneConfirmBody): Promise<void> {
  const supabase = getSupabase();

  const { data: stateRow, error: fetchError } = await supabase
    .from('sage_adventure_state')
    .select('id, state')
    .eq('session_id', body.sessionId)
    .single();

  if (fetchError || !stateRow) {
    throw new Error(
      `Adventure state not found for session ${body.sessionId}`
    );
  }

  const state = (stateRow.state as Record<string, unknown>) ?? {};
  const sceneArcs = (state.sceneArcs as Array<Record<string, unknown>>) ?? [];

  const sceneIndex = sceneArcs.findIndex(
    (arc) => arc.id === body.sceneArcId
  );

  if (sceneIndex === -1) {
    throw new Error(`Scene arc not found: ${body.sceneArcId}`);
  }

  // Mark the scene as confirmed
  sceneArcs[sceneIndex] = { ...sceneArcs[sceneIndex], confirmed: true };
  state.sceneArcs = sceneArcs;

  const { error: updateError } = await supabase
    .from('sage_adventure_state')
    .update({ state })
    .eq('id', stateRow.id);

  if (updateError) {
    throw new Error(`Failed to update state: ${updateError.message}`);
  }
}

export default router;
