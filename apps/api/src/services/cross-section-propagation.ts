/**
 * Cross-section propagation service for the Inscribing stage
 *
 * When an entity (NPC, adversary, item) is modified in one section,
 * this service detects what kind of change occurred and orchestrates
 * the appropriate propagation strategy:
 *
 * - **Deterministic**: Literal name replacements via find-and-replace.
 *   Fast, reliable, no LLM needed. Handles renames.
 *
 * - **Semantic**: Deeper changes (motivation, role, description) that
 *   require the LLM to re-evaluate how sections reference the entity.
 *   Produces "hints" that guide the LLM's next update pass.
 *
 * - **Both**: Combined rename + deeper change. The deterministic layer
 *   handles the name swap; the semantic layer handles the rest.
 *
 * - **None**: No meaningful change detected (e.g., identical values).
 */

import {
  scanSectionsForName,
  type SectionContent,
} from './deterministic-replace.js';

// =============================================================================
// Types
// =============================================================================

/** The kind of propagation needed for a given change */
export type PropagationType = 'deterministic' | 'semantic' | 'both' | 'none';

/** Change types that trigger deterministic propagation */
const DETERMINISTIC_CHANGE_TYPES = new Set(['rename']);

/** Change types that trigger semantic propagation */
const SEMANTIC_CHANGE_TYPES = new Set([
  'motivation',
  'role',
  'description',
  'backstory',
  'voice',
  'secret',
]);

/** Change types that trigger both propagation types */
const COMBINED_CHANGE_TYPES = new Set(['rename_and_role', 'rename_and_motivation']);

/** Describes a single entity change that may trigger propagation */
export interface EntityChange {
  /** What kind of entity changed */
  entityType: 'npc' | 'adversary' | 'item';
  /** Unique identifier for the entity */
  entityId: string;
  /** What aspect of the entity changed */
  changeType: string;
  /** The previous value */
  oldValue: string;
  /** The new value */
  newValue: string;
  /** Additional changes bundled with this one (for combined changes) */
  additionalChanges?: Record<string, { old: string; new: string }>;
}

/** Result of deterministic propagation across sections */
export interface DeterministicPropagationResult {
  updatedSections: Array<{
    sectionId: string;
    updatedContent: string;
    replacementCount: number;
  }>;
  totalReplacements: number;
}

/** A hint for the LLM to semantically update affected sections */
export interface SemanticPropagationHint {
  entityName: string;
  changeDescription: string;
  affectedSections: Array<{
    sectionId: string;
    currentContent: string;
  }>;
  suggestedAction: string;
}

// =============================================================================
// Propagation Type Detection
// =============================================================================

/**
 * Determine what kind of propagation is needed for an entity change.
 *
 * Returns "none" if the old and new values are identical (no real change).
 */
export function detectPropagationType(change: EntityChange): PropagationType {
  if (change.oldValue === change.newValue && !change.additionalChanges) {
    return 'none';
  }

  if (COMBINED_CHANGE_TYPES.has(change.changeType)) {
    return 'both';
  }

  if (DETERMINISTIC_CHANGE_TYPES.has(change.changeType)) {
    return 'deterministic';
  }

  if (SEMANTIC_CHANGE_TYPES.has(change.changeType)) {
    return 'semantic';
  }

  return 'none';
}

// =============================================================================
// Deterministic Propagation
// =============================================================================

/**
 * Build deterministic propagation results by scanning all sections
 * for literal name matches and performing replacements.
 *
 * Optionally excludes the originating section (the one where the
 * change was made) to avoid double-updating it.
 */
export function buildDeterministicPropagation(
  sections: SectionContent[],
  oldName: string,
  newName: string,
  excludeSectionId?: string
): DeterministicPropagationResult {
  const filteredSections = excludeSectionId
    ? sections.filter((s) => s.sectionId !== excludeSectionId)
    : sections;

  const scanResults = scanSectionsForName(filteredSections, oldName, newName);

  const updatedSections = scanResults.map((result) => ({
    sectionId: result.sectionId,
    updatedContent: result.updatedContent ?? '',
    replacementCount: result.matchCount,
  }));

  const totalReplacements = updatedSections.reduce(
    (sum, s) => sum + s.replacementCount,
    0
  );

  return { updatedSections, totalReplacements };
}

// =============================================================================
// Semantic Propagation
// =============================================================================

/**
 * Build a semantic propagation hint for the LLM.
 *
 * Scans sections for references to the entity name and produces
 * a structured hint that tells the LLM which sections need updating
 * and why. The LLM uses this on its next pass to revise content.
 */
export function buildSemanticPropagationHint(
  change: EntityChange,
  sections: SectionContent[],
  entityName: string
): SemanticPropagationHint {
  const scanResults = scanSectionsForName(sections, entityName);

  const affectedSections = scanResults.map((result) => {
    const originalSection = sections.find(
      (s) => s.sectionId === result.sectionId
    );
    return {
      sectionId: result.sectionId,
      currentContent: originalSection?.content ?? '',
    };
  });

  const changeDescription = formatChangeDescription(change);
  const suggestedAction = formatSuggestedAction(change, entityName);

  return {
    entityName,
    changeDescription,
    affectedSections,
    suggestedAction,
  };
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Format a human-readable description of what changed.
 */
function formatChangeDescription(change: EntityChange): string {
  const { oldValue, newValue } = change;

  return (
    `Entity ${change.changeType} changed: ` +
    `"${oldValue}" -> "${newValue}"`
  );
}

/**
 * Format a suggested action string for the LLM.
 */
function formatSuggestedAction(
  change: EntityChange,
  entityName: string
): string {
  const actionVerb = getActionVerb(change.changeType);

  return (
    `Please update all references to ${entityName} to reflect the ` +
    `${change.changeType} change. ${actionVerb}`
  );
}

/**
 * Get an action verb appropriate for the change type.
 */
function getActionVerb(changeType: string): string {
  switch (changeType) {
    case 'motivation':
      return 'Revise dialogue and behavior to reflect the new motivation.';
    case 'role':
      return 'Adjust interactions and narrative framing for the new role.';
    case 'description':
      return 'Update physical descriptions and first-impression text.';
    case 'backstory':
      return 'Revise any backstory references or foreshadowing.';
    case 'voice':
      return 'Adjust dialogue style and speech patterns.';
    case 'secret':
      return 'Update any hints or clues related to this secret.';
    default:
      return 'Review and update affected content as appropriate.';
  }
}
