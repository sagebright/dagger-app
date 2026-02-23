/**
 * Adventure State Data Model for Sage Codex
 *
 * Defines the complete state shape for a Daggerheart adventure session.
 * This state evolves through the 6 stages of the Unfolding:
 *   invoking -> attuning -> binding -> weaving -> inscribing -> delivering
 *
 * Used by:
 * - Backend: state-serializer, context-assembler, version-history
 * - Frontend: adventureStore (read-only mirror via SSE)
 * - Shared: type-safe adventure data across the stack
 */

import type { Stage, ComponentsState } from './stages.js';
import type { FrameDetailSection } from './sage-events.js';

// =============================================================================
// Spark (Invoking Stage)
// =============================================================================

/** The initial vision set during the Invoking stage */
export interface AdventureSpark {
  /** User-provided adventure name */
  name: string;
  /** User's initial description or vision */
  vision: string;
}

// =============================================================================
// Frame (Binding Stage)
// =============================================================================

/** Selected or custom frame anchoring the adventure */
export interface BoundFrame {
  /** Frame identifier (DB id or custom UUID) */
  id: string;
  /** Frame name */
  name: string;
  /** Frame description */
  description: string;
  /** Thematic elements */
  themes: string[];
  /** Typical adversary types for this frame */
  typicalAdversaries: string[];
  /** Background lore */
  lore: string;
  /** Whether this frame was user-created */
  isCustom: boolean;
  /** Accordion sections for the frame detail view */
  sections: FrameDetailSection[];
}

// =============================================================================
// Scene Arcs (Weaving Stage)
// =============================================================================

/** A scene brief created during the Weaving stage */
export interface SceneArc {
  /** Unique scene identifier */
  id: string;
  /** 1-based scene number */
  sceneNumber: number;
  /** Scene title */
  title: string;
  /** Brief description of the scene */
  description: string;
  /** Key story elements in this scene */
  keyElements: string[];
  /** Location name */
  location: string;
  /** Scene type classification */
  sceneType: 'exploration' | 'social' | 'combat' | 'puzzle' | 'mixed';
}

// =============================================================================
// Inscribed Scene (Inscribing Stage) — 9 Sections
// =============================================================================

/** An NPC appearing within a specific scene */
export interface SceneNPC {
  /** NPC name */
  name: string;
  /** Role within the scene */
  role: string;
  /** Brief description */
  description: string;
  /** Scene ID where this NPC appears */
  sceneId: string;
}

/** An adversary appearing within a specific scene */
export interface SceneAdversary {
  /** Adversary name */
  name: string;
  /** Adversary type (e.g., undead, beast, humanoid) */
  type: string;
  /** Tier level for difficulty */
  tier: number;
  /** Scene ID where this adversary appears */
  sceneId: string;
  /** Optional Supabase adversary ID for stat block lookup */
  databaseId?: string;
  /** GM notes about this adversary */
  notes: string;
}

/** An item or reward within a specific scene */
export interface SceneItem {
  /** Item name */
  name: string;
  /** Brief item description */
  description: string;
  /** Suggested tier appropriateness */
  suggestedTier: number;
  /** Scene ID where this item can be found */
  sceneId: string;
}

/** A portent category for GM tools (Echoes) */
export interface PortentCategory {
  /** Category name (e.g., 'Omens', 'Rumors', 'Environmental Shifts') */
  category: string;
  /** Individual portent entries */
  entries: string[];
}

/**
 * A fully inscribed scene with all 9 sections.
 *
 * Each section can be independently edited and versioned.
 * The 9 sections are:
 *   1. introduction    — Scene-setting text
 *   2. keyMoments      — Important beats and events
 *   3. resolution      — How the scene can conclude
 *   4. npcs            — NPCs in this scene
 *   5. adversaries     — Adversaries in this scene
 *   6. items           — Items and rewards
 *   7. portents        — GM portent/echo tools
 *   8. tierGuidance    — Tier-specific difficulty notes
 *   9. toneNotes       — Tone and atmosphere guidance
 */
export interface InscribedScene {
  /** Links back to the SceneArc */
  arcId: string;
  /** 1-based scene number */
  sceneNumber: number;
  /** Scene title */
  title: string;

  /** Section 1: Scene-setting narrative */
  introduction: string;
  /** Section 2: Key dramatic moments */
  keyMoments: Array<{ title: string; description: string }>;
  /** Section 3: How the scene resolves */
  resolution: string;
  /** Section 4: NPCs in this scene */
  npcs: SceneNPC[];
  /** Section 5: Adversaries in this scene */
  adversaries: SceneAdversary[];
  /** Section 6: Items and rewards */
  items: SceneItem[];
  /** Section 7: GM portent tools */
  portents: PortentCategory[];
  /** Section 8: Tier-appropriate difficulty guidance */
  tierGuidance: string;
  /** Section 9: Tone and atmosphere notes */
  toneNotes: string;

  /** Draft status */
  status: 'draft' | 'revised' | 'confirmed';
}

// =============================================================================
// Section Identifiers (for undo/version history)
// =============================================================================

/**
 * Identifies a versionable section of adventure state.
 *
 * Top-level sections are simple string identifiers.
 * Scene sections use "scene:<arcId>:<sectionName>" format.
 */
export type SectionPath =
  | 'spark'
  | 'components'
  | 'frame'
  | 'sceneArcs'
  | `scene:${string}:introduction`
  | `scene:${string}:keyMoments`
  | `scene:${string}:resolution`
  | `scene:${string}:npcs`
  | `scene:${string}:adversaries`
  | `scene:${string}:items`
  | `scene:${string}:portents`
  | `scene:${string}:tierGuidance`
  | `scene:${string}:toneNotes`;

// =============================================================================
// Version History
// =============================================================================

/** A single version snapshot for undo capability */
export interface VersionEntry {
  /** When the version was captured */
  timestamp: string;
  /** The serialized section value at this point */
  value: unknown;
  /** Optional description of the change */
  description?: string;
}

// =============================================================================
// Complete Adventure State
// =============================================================================

/**
 * Serializable components state for storage.
 *
 * Mirrors ComponentsState from stages.ts but uses an array instead of Set
 * for JSON compatibility (Sets don't serialize to JSON).
 */
export interface SerializableComponentsState {
  span: string | null;
  scenes: number | null;
  members: number | null;
  tier: number | null;
  tenor: string | null;
  pillars: string | null;
  chorus: string | null;
  threads: string[];
  confirmedComponents: string[];
}

/**
 * The complete adventure state for a session.
 *
 * This is the authoritative data model that evolves through the Unfolding.
 * Stored in sage_adventure_state.state JSONB column.
 */
export interface AdventureState {
  /** Current stage in the Unfolding */
  stage: Stage;

  /** Invoking: initial adventure vision */
  spark: AdventureSpark | null;

  /** Attuning: the 8 component selections */
  components: SerializableComponentsState;

  /** Binding: selected thematic framework */
  frame: BoundFrame | null;

  /** Weaving: scene arc briefs (3-6 scenes) */
  sceneArcs: SceneArc[];

  /** Inscribing: fully written scenes with all 9 sections */
  inscribedScenes: InscribedScene[];

  /** Version history for undo (section path -> version stack) */
  versionHistory: Record<string, VersionEntry[]>;

  /** Adventure name (may differ from spark.name after refinement) */
  adventureName: string | null;

  /** Stage summaries for cross-stage LLM context (stage -> summary text) */
  stageSummaries?: Record<string, string>;
}

// =============================================================================
// Factory
// =============================================================================

/** Default empty components state */
const DEFAULT_SERIALIZABLE_COMPONENTS: SerializableComponentsState = {
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

/** Pre-loaded defaults for the Attuning stage (all confirmed) */
export const ATTUNING_DEFAULTS: SerializableComponentsState = {
  span: '3-4 hours',
  scenes: 4,
  members: 4,
  tier: 2,
  tenor: 'balanced',
  pillars: 'interwoven',
  chorus: 'moderate',
  threads: ['redemption-sacrifice', 'identity-legacy', 'found-family'],
  confirmedComponents: ['span', 'scenes', 'members', 'tier', 'tenor', 'pillars', 'chorus', 'threads'],
};

/** Create a fresh adventure state for a new session */
export function createEmptyAdventureState(): AdventureState {
  return {
    stage: 'invoking',
    spark: null,
    components: { ...DEFAULT_SERIALIZABLE_COMPONENTS },
    frame: null,
    sceneArcs: [],
    inscribedScenes: [],
    versionHistory: {},
    adventureName: null,
  };
}

/** Merge a partial server state with safe defaults (handles missing/undefined sub-keys) */
export function mergeWithDefaults(partial: Partial<AdventureState>): AdventureState {
  const defaults = createEmptyAdventureState();
  return {
    ...defaults,
    ...partial,
    components: { ...defaults.components, ...(partial.components ?? {}) },
    sceneArcs: partial.sceneArcs ?? defaults.sceneArcs,
    inscribedScenes: partial.inscribedScenes ?? defaults.inscribedScenes,
    versionHistory: partial.versionHistory ?? defaults.versionHistory,
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert a ComponentsState (with Set) to SerializableComponentsState (with array).
 *
 * Used when persisting frontend state to the backend.
 */
export function toSerializableComponents(
  state: ComponentsState
): SerializableComponentsState {
  return {
    span: state.span,
    scenes: state.scenes,
    members: state.members,
    tier: state.tier,
    tenor: state.tenor,
    pillars: state.pillars,
    chorus: state.chorus,
    threads: [...state.threads],
    confirmedComponents: [...state.confirmedComponents],
  };
}

/** Scene section names for iteration */
export const INSCRIBED_SCENE_SECTIONS = [
  'introduction',
  'keyMoments',
  'resolution',
  'npcs',
  'adversaries',
  'items',
  'portents',
  'tierGuidance',
  'toneNotes',
] as const;

export type InscribedSceneSection = typeof INSCRIBED_SCENE_SECTIONS[number];

/** Maximum version history entries per section */
export const MAX_VERSION_HISTORY_ENTRIES = 10;
