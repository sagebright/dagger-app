/**
 * Version history service for Sage Codex
 *
 * Manages push-on-update versioning for adventure state sections.
 * Each section (spark, components, frame, scene sections) maintains
 * a stack of up to MAX_VERSION_HISTORY_ENTRIES previous values.
 *
 * Used by the undo endpoint to revert sections to previous states.
 */

import type {
  AdventureState,
  SectionPath,
  VersionEntry,
  InscribedSceneSection,
} from '@sage-codex/shared-types';

// =============================================================================
// Constants
// =============================================================================

/** Re-export for local use (avoids importing the const value at runtime) */
const MAX_ENTRIES = 10;

// =============================================================================
// Types
// =============================================================================

export interface PushVersionParams {
  /** The adventure state to modify (mutated in place) */
  state: AdventureState;
  /** Which section is being updated */
  sectionPath: SectionPath;
  /** The current value before the update (will be stored in history) */
  previousValue: unknown;
  /** Optional description of the change */
  description?: string;
}

export interface UndoResult {
  /** Whether the undo was successful */
  success: boolean;
  /** The restored value, or null if no history */
  restoredValue: unknown | null;
  /** Error message if the undo failed */
  error?: string;
  /** Remaining history entries after the undo */
  remainingEntries: number;
}

// =============================================================================
// Push Version
// =============================================================================

/**
 * Push the current value of a section onto its version history stack.
 *
 * Call this BEFORE updating the section value. The previous value is
 * stored so it can be restored via undo.
 *
 * Enforces a maximum of MAX_ENTRIES per section. Oldest entries are
 * dropped when the limit is exceeded.
 */
export function pushVersion(params: PushVersionParams): void {
  const { state, sectionPath, previousValue, description } = params;

  const entry: VersionEntry = {
    timestamp: new Date().toISOString(),
    value: structuredClone(previousValue),
    description,
  };

  if (!state.versionHistory[sectionPath]) {
    state.versionHistory[sectionPath] = [];
  }

  const stack = state.versionHistory[sectionPath];
  stack.push(entry);

  // Enforce max entries: drop oldest when over limit
  while (stack.length > MAX_ENTRIES) {
    stack.shift();
  }
}

// =============================================================================
// Undo
// =============================================================================

/**
 * Pop the most recent version entry and return it for restoration.
 *
 * The caller is responsible for applying the restored value to the
 * appropriate section of the adventure state.
 *
 * Returns { success: false } if no history exists for the section.
 */
export function popVersion(
  state: AdventureState,
  sectionPath: SectionPath
): UndoResult {
  const stack = state.versionHistory[sectionPath];

  if (!stack || stack.length === 0) {
    return {
      success: false,
      restoredValue: null,
      error: `No version history for section "${sectionPath}"`,
      remainingEntries: 0,
    };
  }

  const entry = stack.pop()!;

  return {
    success: true,
    restoredValue: entry.value,
    remainingEntries: stack.length,
  };
}

// =============================================================================
// Undo Application
// =============================================================================

/**
 * Parse a SectionPath into its components.
 *
 * Returns { type: 'top-level', key } for simple paths like 'spark',
 * or { type: 'scene', arcId, section } for scene paths like 'scene:abc:introduction'.
 */
export function parseSectionPath(
  path: SectionPath
): { type: 'top-level'; key: string } | { type: 'scene'; arcId: string; section: InscribedSceneSection } {
  if (path.startsWith('scene:')) {
    const parts = path.split(':');
    return {
      type: 'scene',
      arcId: parts[1],
      section: parts[2] as InscribedSceneSection,
    };
  }

  return { type: 'top-level', key: path };
}

/**
 * Apply an undo operation to the adventure state.
 *
 * Pops the most recent version entry and restores it to the
 * appropriate section. Returns the undo result.
 */
export function applyUndo(
  state: AdventureState,
  sectionPath: SectionPath
): UndoResult {
  const undoResult = popVersion(state, sectionPath);
  if (!undoResult.success) return undoResult;

  const parsed = parseSectionPath(sectionPath);

  if (parsed.type === 'top-level') {
    applyTopLevelUndo(state, parsed.key, undoResult.restoredValue);
  } else {
    applySceneUndo(state, parsed.arcId, parsed.section, undoResult.restoredValue);
  }

  return undoResult;
}

/**
 * Restore a top-level section value.
 */
function applyTopLevelUndo(
  state: AdventureState,
  key: string,
  value: unknown
): void {
  switch (key) {
    case 'spark':
      state.spark = value as AdventureState['spark'];
      break;
    case 'components':
      state.components = value as AdventureState['components'];
      break;
    case 'frame':
      state.frame = value as AdventureState['frame'];
      break;
    case 'sceneArcs':
      state.sceneArcs = value as AdventureState['sceneArcs'];
      break;
  }
}

/**
 * Restore a scene section value.
 */
function applySceneUndo(
  state: AdventureState,
  arcId: string,
  section: InscribedSceneSection,
  value: unknown
): void {
  const scene = state.inscribedScenes.find((s) => s.arcId === arcId);
  if (!scene) return;

  // TypeScript-safe section assignment
  (scene as unknown as Record<string, unknown>)[section] = value;
}

// =============================================================================
// Query
// =============================================================================

/**
 * Get the version history for a specific section.
 */
export function getVersionHistory(
  state: AdventureState,
  sectionPath: SectionPath
): VersionEntry[] {
  return state.versionHistory[sectionPath] ?? [];
}

/**
 * Get the count of version history entries for a section.
 */
export function getVersionCount(
  state: AdventureState,
  sectionPath: SectionPath
): number {
  return (state.versionHistory[sectionPath] ?? []).length;
}
