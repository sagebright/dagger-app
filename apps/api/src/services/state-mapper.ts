/**
 * Adventure state mapper for Sage Codex
 *
 * Loads the adventure state from the sage_adventure_state `state` JSONB
 * column and maps it to the typed AdventureState interface used by the
 * context-assembler and state-serializer.
 *
 * Provides safe defaults for all fields, so the mapper works at any
 * stage of the Unfolding — even when the state JSONB is empty or partial.
 */

import { getSupabase } from './supabase.js';
import type {
  AdventureState,
  SerializableComponentsState,
} from '@dagger-app/shared-types';
import type { Stage } from '@dagger-app/shared-types';

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_COMPONENTS: SerializableComponentsState = {
  span: null,
  scenes: null,
  members: null,
  tier: null,
  tenor: null,
  pillars: null,
  chorus: null,
  threads: [],
  confirmedComponents: [],
};

// =============================================================================
// Mapper
// =============================================================================

/**
 * Map a raw state JSONB object to a typed AdventureState.
 *
 * Fills in defaults for any missing fields so downstream consumers
 * (context-assembler, state-serializer) always get a valid object.
 */
export function mapRawStateToAdventureState(
  raw: Record<string, unknown> | null,
  stage: Stage
): AdventureState {
  const state = raw ?? {};

  return {
    stage,
    spark: isValidSpark(state.spark) ? state.spark : null,
    components: isValidComponents(state.components)
      ? (state.components as SerializableComponentsState)
      : { ...DEFAULT_COMPONENTS },
    frame: state.frame ? (state.frame as AdventureState['frame']) : null,
    sceneArcs: Array.isArray(state.sceneArcs) ? state.sceneArcs : [],
    inscribedScenes: Array.isArray(state.inscribedScenes)
      ? state.inscribedScenes
      : [],
    versionHistory: (state.versionHistory as AdventureState['versionHistory']) ?? {},
    adventureName: typeof state.adventureName === 'string'
      ? state.adventureName
      : null,
  };
}

// =============================================================================
// Loader
// =============================================================================

/**
 * Load the adventure state for a session from Supabase.
 *
 * Reads the `state` JSONB column from sage_adventure_state and maps
 * it to a typed AdventureState. Returns a default empty state if the
 * row or column is missing.
 */
export async function loadAdventureState(
  sessionId: string,
  stage: Stage
): Promise<AdventureState> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sage_adventure_state')
    .select('state')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) {
    return mapRawStateToAdventureState(null, stage);
  }

  return mapRawStateToAdventureState(
    data.state as Record<string, unknown> | null,
    stage
  );
}

// =============================================================================
// Type Guards
// =============================================================================

function isValidSpark(value: unknown): value is AdventureState['spark'] {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === 'string' && typeof candidate.vision === 'string';
}

function isValidComponents(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  // Basic check — has at least one expected component field
  const candidate = value as Record<string, unknown>;
  return 'threads' in candidate || 'span' in candidate || 'confirmedComponents' in candidate;
}
