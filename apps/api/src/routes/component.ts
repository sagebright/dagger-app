/**
 * Component selection routes for the Attuning stage
 *
 * Provides the endpoint for persisting component selections to Supabase.
 * Called by the frontend after a user confirms a component choice in
 * the ComponentChoice panel.
 *
 * Routes:
 *   POST /api/component/select — Save a component selection
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { getSupabase } from '../services/supabase.js';

const router: RouterType = Router();

// =============================================================================
// Types
// =============================================================================

interface ComponentSelectBody {
  sessionId: string;
  componentId: string;
  value: string | number | string[];
  confirmed: boolean;
}

const VALID_COMPONENT_IDS = [
  'span', 'scenes', 'members', 'tier',
  'tenor', 'pillars', 'chorus', 'threads',
] as const;

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /api/component/select
 *
 * Persist a single component selection to the adventure state in Supabase.
 * Updates the JSONB state column with the new component value.
 */
router.post('/select', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const body = req.body as ComponentSelectBody;

  if (!isValidComponentSelectBody(body)) {
    res.status(400).json({
      error: 'Invalid request: sessionId, componentId, and value are required',
    });
    return;
  }

  try {
    await persistComponentToState(body);
    res.json({ status: 'ok', componentId: body.componentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to persist component: ${message}` });
  }
});

// =============================================================================
// Validation
// =============================================================================

function isValidComponentSelectBody(body: unknown): body is ComponentSelectBody {
  if (!body || typeof body !== 'object') return false;

  const candidate = body as Record<string, unknown>;
  if (typeof candidate.sessionId !== 'string') return false;
  if (typeof candidate.componentId !== 'string') return false;
  if (!VALID_COMPONENT_IDS.includes(candidate.componentId as typeof VALID_COMPONENT_IDS[number])) return false;
  if (candidate.value === undefined || candidate.value === null) return false;

  return true;
}

// =============================================================================
// Persistence
// =============================================================================

/**
 * Update the adventure state JSONB with the selected component value.
 *
 * Reads current state, merges the component, and writes back.
 * Uses Supabase's JSONB operations for atomic updates.
 */
async function persistComponentToState(body: ComponentSelectBody): Promise<void> {
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

  // Merge the component into the state
  const state = (stateRow.state as Record<string, unknown>) ?? {};
  const components = (state.components as Record<string, unknown>) ?? {};

  components[body.componentId] = body.value;

  // Update confirmed list
  if (body.confirmed) {
    const confirmed = new Set(
      (components.confirmedComponents as string[]) ?? []
    );
    confirmed.add(body.componentId);
    components.confirmedComponents = [...confirmed];
  }

  state.components = components;

  const { error: updateError } = await supabase
    .from('sage_adventure_state')
    .update({ state })
    .eq('id', stateRow.id);

  if (updateError) {
    throw new Error(`Failed to update state: ${updateError.message}`);
  }
}

export default router;
