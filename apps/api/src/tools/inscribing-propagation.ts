/**
 * Cross-section propagation tool handlers for the Inscribing stage
 *
 * Extracted from inscribing.ts to keep file sizes manageable.
 * These handlers coordinate cross-section entity propagation:
 *
 * - propagate_rename: Deterministic find-and-replace across sections
 * - propagate_semantic: Semantic change hints for LLM review
 *
 * Both handlers read from the section cache and emit panel events
 * via the shared pending events queue.
 */

import { registerToolHandler } from '../services/tool-dispatcher.js';
import type { ToolContext } from '../services/tool-dispatcher.js';
import type {
  SageEvent,
  InscribingSectionId,
} from '@sage-codex/shared-types';
import {
  buildDeterministicPropagation,
  buildSemanticPropagationHint,
  type EntityChange,
} from '../services/cross-section-propagation.js';
import {
  getCachedSections,
  cacheSection,
} from '../services/section-cache.js';

// =============================================================================
// Types
// =============================================================================

interface PropagateRenameInput {
  sceneArcId: string;
  oldName: string;
  newName: string;
  originSectionId?: InscribingSectionId;
}

interface PropagateSemanticInput {
  sceneArcId: string;
  entityName: string;
  changeType: string;
  oldValue: string;
  newValue: string;
}

// =============================================================================
// Shared Events Queue
// =============================================================================

let pendingPropagationEvents: SageEvent[] = [];

/**
 * Get and clear all pending propagation events.
 */
export function drainPropagationEvents(): SageEvent[] {
  const events = [...pendingPropagationEvents];
  pendingPropagationEvents = [];
  return events;
}

// =============================================================================
// Registration
// =============================================================================

/**
 * Register all propagation tool handlers.
 */
export function registerPropagationTools(): void {
  registerToolHandler('propagate_rename', handlePropagateRename);
  registerToolHandler('propagate_semantic', handlePropagateSemantic);
}

// =============================================================================
// propagate_rename Handler
// =============================================================================

/**
 * Handle the propagate_rename tool call.
 *
 * Scans all cached sections for the scene, replaces literal name
 * matches, emits panel:section events for each updated section,
 * and emits a panel:propagation_deterministic summary event.
 */
async function handlePropagateRename(
  input: Record<string, unknown>,
  _context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const renameInput = input as unknown as PropagateRenameInput;

  if (!renameInput.sceneArcId) {
    return { result: 'sceneArcId is required for propagate_rename', isError: true };
  }

  if (!renameInput.oldName) {
    return { result: 'oldName is required for propagate_rename', isError: true };
  }

  if (!renameInput.newName) {
    return { result: 'newName is required for propagate_rename', isError: true };
  }

  if (renameInput.oldName === renameInput.newName) {
    return {
      result: {
        status: 'no_propagation_needed',
        reason: 'Old and new names are identical',
      },
      isError: false,
    };
  }

  const sections = getCachedSections(renameInput.sceneArcId);

  if (sections.length === 0) {
    return {
      result: {
        status: 'no_sections_cached',
        sceneArcId: renameInput.sceneArcId,
      },
      isError: false,
    };
  }

  const propagationResult = buildDeterministicPropagation(
    sections,
    renameInput.oldName,
    renameInput.newName,
    renameInput.originSectionId
  );

  // Update cache and emit section events for each changed section
  for (const updated of propagationResult.updatedSections) {
    cacheSection(renameInput.sceneArcId, updated.sectionId, updated.updatedContent);

    pendingPropagationEvents.push({
      type: 'panel:section',
      data: {
        sceneArcId: renameInput.sceneArcId,
        sectionId: updated.sectionId as InscribingSectionId,
        content: updated.updatedContent,
        streaming: false,
      },
    });
  }

  // Emit summary propagation event
  pendingPropagationEvents.push({
    type: 'panel:propagation_deterministic',
    data: {
      sceneArcId: renameInput.sceneArcId,
      oldName: renameInput.oldName,
      newName: renameInput.newName,
      updatedSections: propagationResult.updatedSections.map((s) => ({
        sectionId: s.sectionId,
        replacementCount: s.replacementCount,
      })),
      totalReplacements: propagationResult.totalReplacements,
    },
  });

  return {
    result: {
      status: 'rename_propagated',
      sceneArcId: renameInput.sceneArcId,
      oldName: renameInput.oldName,
      newName: renameInput.newName,
      sectionsUpdated: propagationResult.updatedSections.length,
      totalReplacements: propagationResult.totalReplacements,
    },
    isError: false,
  };
}

// =============================================================================
// propagate_semantic Handler
// =============================================================================

/**
 * Handle the propagate_semantic tool call.
 *
 * Scans cached sections for entity references and produces a
 * semantic propagation hint. Emits a panel:propagation_semantic
 * event so the frontend can show which sections need review.
 */
async function handlePropagateSemantic(
  input: Record<string, unknown>,
  _context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const semanticInput = input as unknown as PropagateSemanticInput;

  if (!semanticInput.sceneArcId) {
    return { result: 'sceneArcId is required for propagate_semantic', isError: true };
  }

  if (!semanticInput.entityName) {
    return { result: 'entityName is required for propagate_semantic', isError: true };
  }

  if (!semanticInput.changeType) {
    return { result: 'changeType is required for propagate_semantic', isError: true };
  }

  const sections = getCachedSections(semanticInput.sceneArcId);

  const change: EntityChange = {
    entityType: 'npc',
    entityId: 'runtime',
    changeType: semanticInput.changeType,
    oldValue: semanticInput.oldValue ?? '',
    newValue: semanticInput.newValue ?? '',
  };

  const hint = buildSemanticPropagationHint(
    change,
    sections,
    semanticInput.entityName
  );

  pendingPropagationEvents.push({
    type: 'panel:propagation_semantic',
    data: {
      sceneArcId: semanticInput.sceneArcId,
      entityName: semanticInput.entityName,
      changeType: semanticInput.changeType,
      affectedSectionIds: hint.affectedSections.map((s) => s.sectionId),
      suggestedAction: hint.suggestedAction,
    },
  });

  return {
    result: {
      status: 'semantic_propagation_hint',
      sceneArcId: semanticInput.sceneArcId,
      entityName: semanticInput.entityName,
      affectedSections: hint.affectedSections.length,
      suggestedAction: hint.suggestedAction,
    },
    isError: false,
  };
}
