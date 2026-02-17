/**
 * Inscribing stage tool handlers
 *
 * Implements the tool handlers for the Inscribing stage:
 * - update_section: Update individual section content
 * - set_wave: Populate a wave of sections at once
 * - invalidate_wave3: Mark Wave 3 for regeneration
 * - warn_balance: Emit a game balance warning
 *
 * Each handler queues panel SSE events so the frontend can
 * update the Inscribing panel in real-time.
 */

import { registerToolHandler } from '../services/tool-dispatcher.js';
import type {
  SageEvent,
  InscribingSectionId,
  InscribingSectionData,
  WaveNumber,
  NPCCardData,
  AdversaryCardData,
  ItemCardData,
  PortentCategoryData,
} from '@dagger-app/shared-types';
import { SECTION_LABELS } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

interface UpdateSectionInput {
  sceneArcId: string;
  sectionId: InscribingSectionId;
  content: string;
}

interface SetWaveSectionEntry {
  sectionId: InscribingSectionId;
  content: string;
}

interface SetWaveInput {
  sceneArcId: string;
  wave: WaveNumber;
  sections: SetWaveSectionEntry[];
}

interface InvalidateWave3Input {
  sceneArcId: string;
  reason: string;
}

interface WarnBalanceInput {
  sceneArcId: string;
  message: string;
  sectionId?: InscribingSectionId;
}

interface SetEntityNPCsInput {
  sceneArcId: string;
  npcs: NPCCardData[];
}

interface SetEntityAdversariesInput {
  sceneArcId: string;
  adversaries: AdversaryCardData[];
}

interface SetEntityItemsInput {
  sceneArcId: string;
  items: ItemCardData[];
}

interface SetEntityPortentsInput {
  sceneArcId: string;
  categories: PortentCategoryData[];
}

// =============================================================================
// Pending Events Queue
// =============================================================================

let pendingEvents: SageEvent[] = [];

/**
 * Get and clear all pending inscribing events.
 */
export function drainInscribingEvents(): SageEvent[] {
  const events = [...pendingEvents];
  pendingEvents = [];
  return events;
}

// =============================================================================
// Validation Helpers
// =============================================================================

const VALID_WAVES = new Set([1, 2, 3]);

function isValidWave(wave: unknown): wave is WaveNumber {
  return typeof wave === 'number' && VALID_WAVES.has(wave);
}

// =============================================================================
// Conversion Helpers
// =============================================================================

/**
 * Convert a wave section entry to panel-friendly InscribingSectionData.
 */
function toSectionData(
  entry: SetWaveSectionEntry,
  wave: WaveNumber
): InscribingSectionData {
  const hasDetail = ['setup', 'developments', 'transitions'].includes(entry.sectionId);

  return {
    id: entry.sectionId,
    label: SECTION_LABELS[entry.sectionId] ?? entry.sectionId,
    content: entry.content,
    wave,
    hasDetail,
  };
}

// =============================================================================
// Tool Handlers
// =============================================================================

/**
 * Register all Inscribing stage tool handlers.
 */
export function registerInscribingTools(): void {
  registerToolHandler('update_section', handleUpdateSection);
  registerToolHandler('set_wave', handleSetWave);
  registerToolHandler('invalidate_wave3', handleInvalidateWave3);
  registerToolHandler('warn_balance', handleWarnBalance);
  registerToolHandler('set_entity_npcs', handleSetEntityNPCs);
  registerToolHandler('set_entity_adversaries', handleSetEntityAdversaries);
  registerToolHandler('set_entity_items', handleSetEntityItems);
  registerToolHandler('set_entity_portents', handleSetEntityPortents);
}

/**
 * Handle the update_section tool call.
 *
 * Updates a single section's content. Queues a panel:section event
 * for the frontend to update the specific accordion section.
 */
async function handleUpdateSection(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const sectionInput = input as unknown as UpdateSectionInput;

  if (!sectionInput.sceneArcId) {
    return {
      result: 'sceneArcId is required for update_section',
      isError: true,
    };
  }

  if (!sectionInput.sectionId) {
    return {
      result: 'sectionId is required for update_section',
      isError: true,
    };
  }

  if (sectionInput.content === undefined || sectionInput.content === null) {
    return {
      result: 'content is required for update_section',
      isError: true,
    };
  }

  pendingEvents.push({
    type: 'panel:section',
    data: {
      sceneArcId: sectionInput.sceneArcId,
      sectionId: sectionInput.sectionId,
      content: sectionInput.content,
      streaming: false,
    },
  });

  return {
    result: {
      status: 'section_updated',
      sceneArcId: sectionInput.sceneArcId,
      sectionId: sectionInput.sectionId,
    },
    isError: false,
  };
}

/**
 * Handle the set_wave tool call.
 *
 * Populates all sections for a given wave at once. Queues a
 * panel:sections event for the frontend to update the accordion.
 */
async function handleSetWave(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const waveInput = input as unknown as SetWaveInput;

  if (!waveInput.sceneArcId) {
    return {
      result: 'sceneArcId is required for set_wave',
      isError: true,
    };
  }

  if (!isValidWave(waveInput.wave)) {
    return {
      result: 'wave must be 1, 2, or 3 for set_wave',
      isError: true,
    };
  }

  if (!waveInput.sections || waveInput.sections.length === 0) {
    return {
      result: 'sections array must not be empty for set_wave',
      isError: true,
    };
  }

  const sectionData = waveInput.sections.map((entry) =>
    toSectionData(entry, waveInput.wave)
  );

  pendingEvents.push({
    type: 'panel:sections',
    data: {
      sceneArcId: waveInput.sceneArcId,
      wave: waveInput.wave,
      sections: sectionData,
    },
  });

  return {
    result: {
      status: 'wave_populated',
      sceneArcId: waveInput.sceneArcId,
      wave: waveInput.wave,
      sectionCount: sectionData.length,
    },
    isError: false,
  };
}

/**
 * Handle the invalidate_wave3 tool call.
 *
 * Marks Wave 3 sections for regeneration due to changes in
 * Waves 1 or 2. Queues a panel:wave3_invalidated event.
 */
async function handleInvalidateWave3(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const invalidateInput = input as unknown as InvalidateWave3Input;

  if (!invalidateInput.sceneArcId) {
    return {
      result: 'sceneArcId is required for invalidate_wave3',
      isError: true,
    };
  }

  if (!invalidateInput.reason) {
    return {
      result: 'reason is required for invalidate_wave3',
      isError: true,
    };
  }

  pendingEvents.push({
    type: 'panel:wave3_invalidated',
    data: {
      sceneArcId: invalidateInput.sceneArcId,
      reason: invalidateInput.reason,
    },
  });

  return {
    result: {
      status: 'wave3_invalidated',
      sceneArcId: invalidateInput.sceneArcId,
      reason: invalidateInput.reason,
    },
    isError: false,
  };
}

/**
 * Handle the warn_balance tool call.
 *
 * Emits a game balance warning for a specific scene. Shown as
 * a warning banner in the panel and optionally in the chat.
 */
async function handleWarnBalance(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const warningInput = input as unknown as WarnBalanceInput;

  if (!warningInput.sceneArcId) {
    return {
      result: 'sceneArcId is required for warn_balance',
      isError: true,
    };
  }

  if (!warningInput.message) {
    return {
      result: 'message is required for warn_balance',
      isError: true,
    };
  }

  pendingEvents.push({
    type: 'panel:balance_warning',
    data: {
      sceneArcId: warningInput.sceneArcId,
      message: warningInput.message,
      ...(warningInput.sectionId && { sectionId: warningInput.sectionId }),
    },
  });

  return {
    result: {
      status: 'balance_warning_sent',
      sceneArcId: warningInput.sceneArcId,
      message: warningInput.message,
    },
    isError: false,
  };
}

// =============================================================================
// Entity Tool Handlers
// =============================================================================

/**
 * Handle the set_entity_npcs tool call.
 *
 * Populates NPCs for the npcs_present section. Queues a
 * panel:entity_npcs event for the frontend entity card rendering.
 */
async function handleSetEntityNPCs(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const entityInput = input as unknown as SetEntityNPCsInput;

  if (!entityInput.sceneArcId) {
    return { result: 'sceneArcId is required for set_entity_npcs', isError: true };
  }

  if (!entityInput.npcs || !Array.isArray(entityInput.npcs)) {
    return { result: 'npcs array is required for set_entity_npcs', isError: true };
  }

  pendingEvents.push({
    type: 'panel:entity_npcs',
    data: {
      sceneArcId: entityInput.sceneArcId,
      npcs: entityInput.npcs,
    },
  });

  return {
    result: {
      status: 'entity_npcs_set',
      sceneArcId: entityInput.sceneArcId,
      count: entityInput.npcs.length,
    },
    isError: false,
  };
}

/**
 * Handle the set_entity_adversaries tool call.
 *
 * Populates adversaries for the adversaries section. Queues a
 * panel:entity_adversaries event for the frontend entity card rendering.
 */
async function handleSetEntityAdversaries(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const entityInput = input as unknown as SetEntityAdversariesInput;

  if (!entityInput.sceneArcId) {
    return { result: 'sceneArcId is required for set_entity_adversaries', isError: true };
  }

  if (!entityInput.adversaries || !Array.isArray(entityInput.adversaries)) {
    return { result: 'adversaries array is required for set_entity_adversaries', isError: true };
  }

  pendingEvents.push({
    type: 'panel:entity_adversaries',
    data: {
      sceneArcId: entityInput.sceneArcId,
      adversaries: entityInput.adversaries,
    },
  });

  return {
    result: {
      status: 'entity_adversaries_set',
      sceneArcId: entityInput.sceneArcId,
      count: entityInput.adversaries.length,
    },
    isError: false,
  };
}

/**
 * Handle the set_entity_items tool call.
 *
 * Populates items for the items section. Queues a
 * panel:entity_items event for the frontend entity card rendering.
 */
async function handleSetEntityItems(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const entityInput = input as unknown as SetEntityItemsInput;

  if (!entityInput.sceneArcId) {
    return { result: 'sceneArcId is required for set_entity_items', isError: true };
  }

  if (!entityInput.items || !Array.isArray(entityInput.items)) {
    return { result: 'items array is required for set_entity_items', isError: true };
  }

  pendingEvents.push({
    type: 'panel:entity_items',
    data: {
      sceneArcId: entityInput.sceneArcId,
      items: entityInput.items,
    },
  });

  return {
    result: {
      status: 'entity_items_set',
      sceneArcId: entityInput.sceneArcId,
      count: entityInput.items.length,
    },
    isError: false,
  };
}

/**
 * Handle the set_entity_portents tool call.
 *
 * Populates portent categories for the portents section. Queues a
 * panel:entity_portents event for the frontend entity card rendering.
 */
async function handleSetEntityPortents(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const entityInput = input as unknown as SetEntityPortentsInput;

  if (!entityInput.sceneArcId) {
    return { result: 'sceneArcId is required for set_entity_portents', isError: true };
  }

  if (!entityInput.categories || !Array.isArray(entityInput.categories)) {
    return { result: 'categories array is required for set_entity_portents', isError: true };
  }

  pendingEvents.push({
    type: 'panel:entity_portents',
    data: {
      sceneArcId: entityInput.sceneArcId,
      categories: entityInput.categories,
    },
  });

  return {
    result: {
      status: 'entity_portents_set',
      sceneArcId: entityInput.sceneArcId,
      count: entityInput.categories.length,
    },
    isError: false,
  };
}
