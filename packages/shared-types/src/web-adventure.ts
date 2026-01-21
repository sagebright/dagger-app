/**
 * Web Adventure Types for Supabase Persistence
 *
 * These types define the schema for the daggerheart_web_adventures table
 * which stores adventure state for the web application.
 */

import type { Json } from './database.js';
import type { Phase } from './dials.js';

// =============================================================================
// Database Row Types (matching Supabase schema)
// =============================================================================

/**
 * Complete web adventure row from the database
 *
 * Maps to the daggerheart_web_adventures table schema.
 */
export interface WebAdventure {
  /** Primary key (UUID) */
  id: string;
  /** Unique session identifier for this adventure */
  session_id: string;
  /** User-provided adventure name */
  adventure_name: string;
  /** Current workflow phase */
  current_phase: Phase;
  /** Array of phases visited (for back-navigation) */
  phase_history: Phase[];
  /** When the adventure was created */
  created_at: string;
  /** When the adventure was last updated */
  updated_at: string;
  /** Current dial values (JSONB) */
  dials: Json;
  /** Array of dial IDs that have been confirmed */
  confirmed_dials: string[];
  /** Selected frame data (JSONB, nullable) */
  selected_frame: Json | null;
  /** Whether the frame has been confirmed */
  frame_confirmed: boolean;
  /** Current outline data (JSONB, nullable) */
  current_outline: Json | null;
  /** Whether the outline has been confirmed */
  outline_confirmed: boolean;
  /** Array of scene data (JSONB) */
  scenes: Json[];
  /** ID of the currently active scene (nullable) */
  current_scene_id: string | null;
  /** Array of NPC data (JSONB) */
  npcs: Json[];
  /** Array of confirmed NPC IDs */
  confirmed_npc_ids: string[];
  /** Array of selected adversary data (JSONB) */
  selected_adversaries: Json[];
  /** Array of confirmed adversary IDs */
  confirmed_adversary_ids: string[];
  /** Array of selected item data (JSONB) */
  selected_items: Json[];
  /** Array of confirmed item IDs */
  confirmed_item_ids: string[];
  /** Array of echo data (JSONB) */
  echoes: Json[];
  /** Array of confirmed echo IDs */
  confirmed_echo_ids: string[];
  /** When the adventure was last exported (nullable) */
  last_exported_at: string | null;
  /** Number of times the adventure has been exported */
  export_count: number;
}

/**
 * Insert payload for creating a new web adventure
 *
 * Only session_id and adventure_name are required; all other fields have defaults.
 */
export interface WebAdventureInsert {
  /** Optional custom ID (will be auto-generated if not provided) */
  id?: string;
  /** Unique session identifier (required) */
  session_id: string;
  /** User-provided adventure name (required) */
  adventure_name: string;
  /** Initial phase (defaults to 'setup') */
  current_phase?: Phase;
  /** Initial phase history (defaults to []) */
  phase_history?: Phase[];
  /** Initial timestamp (defaults to now()) */
  created_at?: string;
  /** Initial timestamp (defaults to now()) */
  updated_at?: string;
  /** Initial dial values (defaults to {}) */
  dials?: Json;
  /** Initial confirmed dials (defaults to []) */
  confirmed_dials?: string[];
  /** Initial frame (defaults to null) */
  selected_frame?: Json | null;
  /** Initial frame confirmed state (defaults to false) */
  frame_confirmed?: boolean;
  /** Initial outline (defaults to null) */
  current_outline?: Json | null;
  /** Initial outline confirmed state (defaults to false) */
  outline_confirmed?: boolean;
  /** Initial scenes (defaults to []) */
  scenes?: Json[];
  /** Initial current scene ID (defaults to null) */
  current_scene_id?: string | null;
  /** Initial NPCs (defaults to []) */
  npcs?: Json[];
  /** Initial confirmed NPC IDs (defaults to []) */
  confirmed_npc_ids?: string[];
  /** Initial selected adversaries (defaults to []) */
  selected_adversaries?: Json[];
  /** Initial confirmed adversary IDs (defaults to []) */
  confirmed_adversary_ids?: string[];
  /** Initial selected items (defaults to []) */
  selected_items?: Json[];
  /** Initial confirmed item IDs (defaults to []) */
  confirmed_item_ids?: string[];
  /** Initial echoes (defaults to []) */
  echoes?: Json[];
  /** Initial confirmed echo IDs (defaults to []) */
  confirmed_echo_ids?: string[];
  /** Initial export timestamp (defaults to null) */
  last_exported_at?: string | null;
  /** Initial export count (defaults to 0) */
  export_count?: number;
}

/**
 * Update payload for modifying an existing web adventure
 *
 * All fields are optional. Note: session_id cannot be updated (immutable).
 */
export interface WebAdventureUpdate {
  /** Update adventure name */
  adventure_name?: string;
  /** Update current phase */
  current_phase?: Phase;
  /** Update phase history */
  phase_history?: Phase[];
  /** Update timestamp (typically auto-updated) */
  updated_at?: string;
  /** Update dial values */
  dials?: Json;
  /** Update confirmed dials */
  confirmed_dials?: string[];
  /** Update selected frame */
  selected_frame?: Json | null;
  /** Update frame confirmed state */
  frame_confirmed?: boolean;
  /** Update current outline */
  current_outline?: Json | null;
  /** Update outline confirmed state */
  outline_confirmed?: boolean;
  /** Update scenes */
  scenes?: Json[];
  /** Update current scene ID */
  current_scene_id?: string | null;
  /** Update NPCs */
  npcs?: Json[];
  /** Update confirmed NPC IDs */
  confirmed_npc_ids?: string[];
  /** Update selected adversaries */
  selected_adversaries?: Json[];
  /** Update confirmed adversary IDs */
  confirmed_adversary_ids?: string[];
  /** Update selected items */
  selected_items?: Json[];
  /** Update confirmed item IDs */
  confirmed_item_ids?: string[];
  /** Update echoes */
  echoes?: Json[];
  /** Update confirmed echo IDs */
  confirmed_echo_ids?: string[];
  /** Update export timestamp */
  last_exported_at?: string | null;
  /** Update export count */
  export_count?: number;
}

// =============================================================================
// Application Types (camelCase for frontend use)
// =============================================================================

/**
 * Lightweight snapshot of adventure state for session resume
 *
 * This provides the essential information needed to display
 * an adventure in a list and determine where to resume.
 */
export interface AdventureSnapshot {
  /** Session identifier */
  sessionId: string;
  /** Adventure name */
  adventureName: string;
  /** Current phase */
  currentPhase: Phase;
  /** Phases visited */
  phaseHistory: Phase[];
  /** List of confirmed dial IDs */
  dialsConfirmed: string[];
  /** Whether frame is confirmed */
  frameConfirmed: boolean;
  /** Whether outline is confirmed */
  outlineConfirmed: boolean;
  /** Number of scenes confirmed */
  scenesConfirmed: number;
  /** Total number of scenes in outline */
  totalScenes: number;
  /** Last update timestamp */
  lastUpdated: string;
}

/**
 * Adventure metadata for listing/management
 *
 * Contains identifiers and timestamps without full content.
 */
export interface AdventureMetadata {
  /** Database ID */
  id: string;
  /** Session identifier */
  sessionId: string;
  /** Adventure name */
  adventureName: string;
  /** Current phase */
  currentPhase: Phase;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Last export timestamp (null if never exported) */
  lastExportedAt: string | null;
  /** Number of exports */
  exportCount: number;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert a WebAdventure row to an AdventureSnapshot
 */
export function toAdventureSnapshot(adventure: WebAdventure): AdventureSnapshot {
  const scenes = Array.isArray(adventure.scenes) ? adventure.scenes : [];
  const confirmedScenes = scenes.filter(
    (s) => typeof s === 'object' && s !== null && 'status' in s && s.status === 'confirmed'
  );

  return {
    sessionId: adventure.session_id,
    adventureName: adventure.adventure_name,
    currentPhase: adventure.current_phase,
    phaseHistory: adventure.phase_history,
    dialsConfirmed: adventure.confirmed_dials,
    frameConfirmed: adventure.frame_confirmed,
    outlineConfirmed: adventure.outline_confirmed,
    scenesConfirmed: confirmedScenes.length,
    totalScenes: scenes.length,
    lastUpdated: adventure.updated_at,
  };
}

/**
 * Convert a WebAdventure row to AdventureMetadata
 */
export function toAdventureMetadata(adventure: WebAdventure): AdventureMetadata {
  return {
    id: adventure.id,
    sessionId: adventure.session_id,
    adventureName: adventure.adventure_name,
    currentPhase: adventure.current_phase,
    createdAt: adventure.created_at,
    updatedAt: adventure.updated_at,
    lastExportedAt: adventure.last_exported_at,
    exportCount: adventure.export_count,
  };
}
