/**
 * Frame selection routes for the Binding stage
 *
 * Provides the endpoint for persisting frame selections to Supabase.
 * Called by the frontend after a user confirms a frame via the
 * FrameDetail "Select Frame" button.
 *
 * Routes:
 *   POST /api/frame/select -- Save a frame selection
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { getSupabase } from '../services/supabase.js';

const router: RouterType = Router();

// =============================================================================
// Types
// =============================================================================

interface FrameSelectBody {
  sessionId: string;
  frameId: string;
}

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /api/frame/select
 *
 * Persist a frame selection to the adventure state in Supabase.
 * Updates the JSONB state column with the selected frame.
 */
router.post('/select', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const body = req.body as Partial<FrameSelectBody>;

  if (!isValidFrameSelectBody(body)) {
    res.status(400).json({
      error: 'Invalid request: sessionId and frameId are required',
    });
    return;
  }

  try {
    await persistFrameToState(body as FrameSelectBody);
    res.json({ status: 'ok', frameId: body.frameId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to persist frame: ${message}` });
  }
});

// =============================================================================
// Validation
// =============================================================================

function isValidFrameSelectBody(body: unknown): body is FrameSelectBody {
  if (!body || typeof body !== 'object') return false;
  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.sessionId === 'string' &&
    typeof candidate.frameId === 'string'
  );
}

// =============================================================================
// Persistence
// =============================================================================

/**
 * Update the adventure state JSONB with the selected frame ID.
 *
 * Reads the current state, sets the frame field, and writes back.
 */
async function persistFrameToState(body: FrameSelectBody): Promise<void> {
  const supabase = getSupabase();

  // Find the adventure state row for this session
  const { data: stateRow, error: fetchError } = await supabase
    .from('sage_adventure_state')
    .select('id, state')
    .eq('session_id', body.sessionId)
    .single();

  if (fetchError || !stateRow) {
    throw new Error(`Adventure state not found for session ${body.sessionId}`);
  }

  // Look up the frame from the database
  const { data: frameRow, error: frameError } = await supabase
    .from('daggerheart_frames')
    .select('*')
    .eq('id', body.frameId)
    .single();

  if (frameError || !frameRow) {
    throw new Error(`Frame not found: ${body.frameId}`);
  }

  // Merge the frame into the adventure state
  const state = (stateRow.state as Record<string, unknown>) ?? {};
  state.frame = {
    id: frameRow.id,
    name: frameRow.name,
    description: frameRow.description,
    themes: frameRow.themes ?? [],
    typicalAdversaries: frameRow.typical_adversaries ?? [],
    lore: frameRow.lore ?? '',
    isCustom: false,
  };

  const { error: updateError } = await supabase
    .from('sage_adventure_state')
    .update({ state })
    .eq('id', stateRow.id);

  if (updateError) {
    throw new Error(`Failed to update state: ${updateError.message}`);
  }
}

export default router;
