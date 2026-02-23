/**
 * Weaving stage tool handlers
 *
 * Implements the tool handlers for the Weaving stage:
 * - set_all_scene_arcs: Populates all scenes at once (on stage entry)
 * - set_scene_arc: Updates a single scene arc (on revision)
 * - reorder_scenes: Reorders the scene arc sequence
 * - suggest_adventure_name: Suggests an adventure name (universal, handled here for event emission)
 *
 * Each handler queues panel SSE events so the frontend can
 * update the Weaving panel in real-time.
 */

import { registerToolHandler } from '../services/tool-dispatcher.js';
import type { ToolContext } from '../services/tool-dispatcher.js';
import { getSupabase } from '../services/supabase.js';
import type { SageEvent, SceneArcData } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

interface SceneArcInput {
  id: string;
  sceneNumber: number;
  title: string;
  subtitle?: string;
  description: string;
  keyElements?: string[];
  location?: string;
  sceneType?: string;
}

interface SetAllSceneArcsInput {
  sceneArcs: SceneArcInput[];
}

interface SetSceneArcInput {
  sceneIndex: number;
  sceneArc: SceneArcInput;
}

interface ReorderScenesInput {
  order: string[];
}

interface SuggestNameInput {
  name: string;
  reason?: string;
}

// =============================================================================
// Pending Events Queue
// =============================================================================

let pendingEvents: SageEvent[] = [];

/**
 * Get and clear all pending weaving events.
 */
export function drainWeavingEvents(): SageEvent[] {
  const events = [...pendingEvents];
  pendingEvents = [];
  return events;
}

// =============================================================================
// Conversion Helpers
// =============================================================================

/**
 * Convert a tool input scene arc to panel-friendly SceneArcData.
 */
function toSceneArcData(input: SceneArcInput): SceneArcData {
  return {
    id: input.id,
    sceneNumber: input.sceneNumber,
    title: input.title,
    subtitle: input.subtitle,
    description: input.description,
    confirmed: false,
  };
}

// =============================================================================
// Tool Handlers
// =============================================================================

/**
 * Register all Weaving stage tool handlers.
 */
export function registerWeavingTools(): void {
  registerToolHandler('set_all_scene_arcs', handleSetAllSceneArcs);
  registerToolHandler('set_scene_arc', handleSetSceneArc);
  registerToolHandler('reorder_scenes', handleReorderScenes);
  registerToolHandler('suggest_adventure_name', handleSuggestName);
}

/**
 * Handle the set_all_scene_arcs tool call.
 *
 * Populates all scene arc tabs at once. Called on Weaving stage entry
 * to fill the panel with initial scene content.
 */
async function handleSetAllSceneArcs(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const arcsInput = input as unknown as SetAllSceneArcsInput;

  if (!arcsInput.sceneArcs || !Array.isArray(arcsInput.sceneArcs)) {
    return {
      result: 'sceneArcs array is required for set_all_scene_arcs',
      isError: true,
    };
  }

  if (arcsInput.sceneArcs.length === 0) {
    return {
      result: 'sceneArcs must contain at least one scene',
      isError: true,
    };
  }

  const sceneArcData = arcsInput.sceneArcs.map(toSceneArcData);

  // Queue the panel:scene_arcs event
  pendingEvents.push({
    type: 'panel:scene_arcs',
    data: {
      sceneArcs: sceneArcData,
      activeSceneIndex: 0,
    },
  });

  // Persist all scene arcs to DB (best effort)
  try {
    await persistAllSceneArcs(context.sessionId, sceneArcData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Failed to persist scene arcs: ${message}`);
  }

  // Return summary for Claude
  const arcSummary = sceneArcData.map((arc) => ({
    id: arc.id,
    sceneNumber: arc.sceneNumber,
    title: arc.title,
  }));

  return {
    result: {
      status: 'scene_arcs_populated',
      count: sceneArcData.length,
      scenes: arcSummary,
    },
    isError: false,
  };
}

/**
 * Handle the set_scene_arc tool call.
 *
 * Updates a single scene arc during revision. Queues a panel:scene_arc
 * event for the frontend to update the specific scene tab.
 */
async function handleSetSceneArc(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const arcInput = input as unknown as SetSceneArcInput;

  if (arcInput.sceneIndex === undefined || arcInput.sceneIndex < 0) {
    return {
      result: 'sceneIndex (>= 0) is required for set_scene_arc',
      isError: true,
    };
  }

  if (!arcInput.sceneArc || !arcInput.sceneArc.title) {
    return {
      result: 'sceneArc with title is required for set_scene_arc',
      isError: true,
    };
  }

  const sceneArcData = toSceneArcData(arcInput.sceneArc);

  // Queue the panel:scene_arc event
  pendingEvents.push({
    type: 'panel:scene_arc',
    data: {
      sceneIndex: arcInput.sceneIndex,
      sceneArc: sceneArcData,
      streaming: false,
    },
  });

  // Persist the updated scene arc to DB (best effort)
  try {
    await persistSingleSceneArc(
      context.sessionId,
      arcInput.sceneIndex,
      sceneArcData
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Failed to persist scene arc: ${message}`);
  }

  return {
    result: {
      status: 'scene_arc_updated',
      sceneIndex: arcInput.sceneIndex,
      title: sceneArcData.title,
    },
    isError: false,
  };
}

/**
 * Handle the reorder_scenes tool call.
 *
 * Reorders scene arcs by the given ID sequence. The frontend
 * receives a panel:scene_arcs event with the new order.
 */
async function handleReorderScenes(
  input: Record<string, unknown>,
  _context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const reorderInput = input as unknown as ReorderScenesInput;

  if (!reorderInput.order || !Array.isArray(reorderInput.order)) {
    return {
      result: 'order array of scene IDs is required for reorder_scenes',
      isError: true,
    };
  }

  if (reorderInput.order.length === 0) {
    return {
      result: 'order array must contain at least one scene ID',
      isError: true,
    };
  }

  return {
    result: {
      status: 'scenes_reordered',
      order: reorderInput.order,
    },
    isError: false,
  };
}

/**
 * Handle the suggest_adventure_name tool call.
 *
 * Suggests an adventure name and queues a panel:name event
 * for the frontend to display the name banner.
 */
async function handleSuggestName(
  input: Record<string, unknown>,
  _context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const nameInput = input as unknown as SuggestNameInput;

  if (!nameInput.name) {
    return {
      result: 'name is required for suggest_adventure_name',
      isError: true,
    };
  }

  // Queue the panel:name event
  pendingEvents.push({
    type: 'panel:name',
    data: {
      name: nameInput.name,
      reason: nameInput.reason,
    },
  });

  return {
    result: {
      status: 'name_suggested',
      name: nameInput.name,
    },
    isError: false,
  };
}

// =============================================================================
// Persistence
// =============================================================================

/**
 * Persist all scene arcs to the adventure state in Supabase.
 *
 * Reads the current state JSONB, sets state.sceneArcs, and writes back.
 * Best-effort; callers catch and log failures.
 */
async function persistAllSceneArcs(
  sessionId: string,
  sceneArcs: SceneArcData[]
): Promise<void> {
  const supabase = getSupabase();

  const { data: stateRow, error: fetchError } = await supabase
    .from('sage_adventure_state')
    .select('id, state')
    .eq('session_id', sessionId)
    .single();

  if (fetchError || !stateRow) {
    console.warn(`Adventure state not found for session ${sessionId}`);
    return;
  }

  const currentState = (stateRow.state as Record<string, unknown>) ?? {};
  const updatedState = { ...currentState, sceneArcs };

  const { error: updateError } = await supabase
    .from('sage_adventure_state')
    .update({ state: updatedState })
    .eq('id', stateRow.id);

  if (updateError) {
    console.warn(`Failed to update scene arcs state: ${updateError.message}`);
  }
}

/**
 * Persist a single scene arc update to the adventure state in Supabase.
 *
 * Reads the current state JSONB, updates the entry at the given index,
 * and writes back. Best-effort; callers catch and log failures.
 */
async function persistSingleSceneArc(
  sessionId: string,
  sceneIndex: number,
  sceneArc: SceneArcData
): Promise<void> {
  const supabase = getSupabase();

  const { data: stateRow, error: fetchError } = await supabase
    .from('sage_adventure_state')
    .select('id, state')
    .eq('session_id', sessionId)
    .single();

  if (fetchError || !stateRow) {
    console.warn(`Adventure state not found for session ${sessionId}`);
    return;
  }

  const currentState = (stateRow.state as Record<string, unknown>) ?? {};
  const sceneArcs = [...((currentState.sceneArcs as SceneArcData[]) ?? [])];

  // Grow array if needed and set the updated arc at the given index
  while (sceneArcs.length <= sceneIndex) {
    sceneArcs.push({} as SceneArcData);
  }
  sceneArcs[sceneIndex] = sceneArc;

  const updatedState = { ...currentState, sceneArcs };

  const { error: updateError } = await supabase
    .from('sage_adventure_state')
    .update({ state: updatedState })
    .eq('id', stateRow.id);

  if (updateError) {
    console.warn(`Failed to update scene arc state: ${updateError.message}`);
  }
}
