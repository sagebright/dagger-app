/**
 * NPC Selectors Tests
 *
 * Tests for pure selector functions that derive NPC-related state
 * from the ContentState.
 */

import { describe, it, expect } from 'vitest';
import {
  selectNPCs,
  selectConfirmedNPCIds,
  selectNPCById,
  selectConfirmedNPCCount,
  selectAllNPCsConfirmed,
  selectNPCStatus,
  selectCanProceedToAdversaries,
  selectNPCSummary,
  selectNPCsByRole,
  selectNPCsByScene,
} from './npcSelectors';
import type { ContentState } from '../contentStore';
import type { CompiledNPC } from '@dagger-app/shared-types';

// =============================================================================
// Test Helpers
// =============================================================================

const createMockContentState = (overrides: Partial<ContentState> = {}): ContentState => ({
  availableFrames: [],
  selectedFrame: null,
  frameConfirmed: false,
  framesLoading: false,
  framesError: null,
  currentOutline: null,
  outlineLoading: false,
  outlineError: null,
  outlineConfirmed: false,
  scenes: [],
  currentSceneId: null,
  sceneLoading: false,
  sceneError: null,
  sceneStreamingContent: null,
  npcs: [],
  confirmedNPCIds: new Set<string>(),
  npcLoading: false,
  npcError: null,
  npcStreamingContent: null,
  refiningNPCId: null,
  availableAdversaries: [],
  selectedAdversaries: [],
  confirmedAdversaryIds: new Set<string>(),
  adversaryLoading: false,
  adversaryError: null,
  availableAdversaryTypes: [],
  adversaryFilters: {},
  availableItems: [],
  selectedItems: [],
  confirmedItemIds: new Set<string>(),
  itemLoading: false,
  itemError: null,
  availableItemCategories: [],
  itemFilters: {},
  echoes: [],
  confirmedEchoIds: new Set<string>(),
  echoLoading: false,
  echoError: null,
  echoStreamingContent: null,
  activeEchoCategory: 'complications',
  setAvailableFrames: () => {},
  selectFrame: () => {},
  setCustomFrameDraft: () => {},
  confirmFrame: () => {},
  clearFrame: () => {},
  setFramesLoading: () => {},
  setFramesError: () => {},
  setOutline: () => {},
  updateOutline: () => {},
  updateSceneBrief: () => {},
  confirmOutline: () => {},
  clearOutline: () => {},
  setOutlineLoading: () => {},
  setOutlineError: () => {},
  initializeScenesFromOutline: () => {},
  setCurrentScene: () => {},
  setSceneStatus: () => {},
  setSceneDraft: () => {},
  confirmScene: () => {},
  setSceneLoading: () => {},
  setSceneError: () => {},
  setSceneStreamingContent: () => {},
  appendSceneStreamingContent: () => {},
  navigateToNextScene: () => {},
  navigateToPreviousScene: () => {},
  clearScenes: () => {},
  setNPCs: () => {},
  addNPC: () => {},
  updateNPC: () => {},
  confirmNPC: () => {},
  confirmAllNPCs: () => {},
  setNPCLoading: () => {},
  setNPCError: () => {},
  setNPCStreamingContent: () => {},
  appendNPCStreamingContent: () => {},
  setRefiningNPCId: () => {},
  clearNPCs: () => {},
  setAvailableAdversaries: () => {},
  selectAdversary: () => {},
  deselectAdversary: () => {},
  updateAdversaryQuantity: () => {},
  confirmAdversary: () => {},
  confirmAllAdversaries: () => {},
  setAdversaryFilters: () => {},
  setAdversaryLoading: () => {},
  setAdversaryError: () => {},
  clearAdversaries: () => {},
  setAvailableItems: () => {},
  selectItem: () => {},
  deselectItem: () => {},
  updateItemQuantity: () => {},
  confirmItem: () => {},
  confirmAllItems: () => {},
  setItemFilters: () => {},
  setItemLoading: () => {},
  setItemError: () => {},
  clearItems: () => {},
  setEchoes: () => {},
  addEcho: () => {},
  updateEcho: () => {},
  confirmEcho: () => {},
  confirmAllEchoes: () => {},
  setActiveEchoCategory: () => {},
  setEchoLoading: () => {},
  setEchoError: () => {},
  setEchoStreamingContent: () => {},
  appendEchoStreamingContent: () => {},
  clearEchoes: () => {},
  resetContent: () => {},
  ...overrides,
});

const createMockNPC = (
  id: string,
  role: CompiledNPC['role'] = 'ally',
  sceneAppearances: string[] = []
): CompiledNPC => ({
  id,
  name: `NPC ${id}`,
  role,
  description: `Description for ${id}`,
  appearance: `Appearance for ${id}`,
  personality: `Personality for ${id}`,
  motivations: [`Motivation for ${id}`],
  connections: [],
  sceneAppearances,
  isConfirmed: false,
  extractedFrom: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// =============================================================================
// selectNPCs Tests
// =============================================================================

describe('selectNPCs', () => {
  it('returns empty array when no NPCs', () => {
    const state = createMockContentState();
    expect(selectNPCs(state)).toEqual([]);
  });

  it('returns all NPCs', () => {
    const npcs = [createMockNPC('npc-1'), createMockNPC('npc-2')];
    const state = createMockContentState({ npcs });

    expect(selectNPCs(state)).toHaveLength(2);
    expect(selectNPCs(state)).toBe(npcs);
  });
});

// =============================================================================
// selectConfirmedNPCIds Tests
// =============================================================================

describe('selectConfirmedNPCIds', () => {
  it('returns empty Set when no confirmed NPCs', () => {
    const state = createMockContentState();
    expect(selectConfirmedNPCIds(state).size).toBe(0);
  });

  it('returns Set of confirmed NPC IDs', () => {
    const state = createMockContentState({
      confirmedNPCIds: new Set(['npc-1', 'npc-2']),
    });
    const ids = selectConfirmedNPCIds(state);

    expect(ids.has('npc-1')).toBe(true);
    expect(ids.has('npc-2')).toBe(true);
    expect(ids.size).toBe(2);
  });
});

// =============================================================================
// selectNPCById Tests
// =============================================================================

describe('selectNPCById', () => {
  it('returns undefined when NPC not found', () => {
    const state = createMockContentState({
      npcs: [createMockNPC('npc-1')],
    });
    expect(selectNPCById(state, 'nonexistent')).toBeUndefined();
  });

  it('returns NPC when found', () => {
    const npcs = [createMockNPC('npc-1'), createMockNPC('npc-2')];
    const state = createMockContentState({ npcs });

    const npc = selectNPCById(state, 'npc-2');
    expect(npc).toBeDefined();
    expect(npc?.id).toBe('npc-2');
  });
});

// =============================================================================
// selectConfirmedNPCCount Tests
// =============================================================================

describe('selectConfirmedNPCCount', () => {
  it('returns 0 when no confirmed NPCs', () => {
    const state = createMockContentState();
    expect(selectConfirmedNPCCount(state)).toBe(0);
  });

  it('returns correct count', () => {
    const state = createMockContentState({
      confirmedNPCIds: new Set(['npc-1', 'npc-2', 'npc-3']),
    });
    expect(selectConfirmedNPCCount(state)).toBe(3);
  });
});

// =============================================================================
// selectAllNPCsConfirmed Tests
// =============================================================================

describe('selectAllNPCsConfirmed', () => {
  it('returns false when no NPCs', () => {
    const state = createMockContentState();
    expect(selectAllNPCsConfirmed(state)).toBe(false);
  });

  it('returns false when not all NPCs confirmed', () => {
    const state = createMockContentState({
      npcs: [createMockNPC('npc-1'), createMockNPC('npc-2'), createMockNPC('npc-3')],
      confirmedNPCIds: new Set(['npc-1']),
    });
    expect(selectAllNPCsConfirmed(state)).toBe(false);
  });

  it('returns true when all NPCs confirmed', () => {
    const state = createMockContentState({
      npcs: [createMockNPC('npc-1'), createMockNPC('npc-2')],
      confirmedNPCIds: new Set(['npc-1', 'npc-2']),
    });
    expect(selectAllNPCsConfirmed(state)).toBe(true);
  });
});

// =============================================================================
// selectNPCStatus Tests
// =============================================================================

describe('selectNPCStatus', () => {
  it('returns correct status when loading', () => {
    const state = createMockContentState({
      npcLoading: true,
      npcError: null,
      npcStreamingContent: 'Compiling NPCs...',
      refiningNPCId: null,
    });
    const status = selectNPCStatus(state);

    expect(status.loading).toBe(true);
    expect(status.error).toBeNull();
    expect(status.streamingContent).toBe('Compiling NPCs...');
    expect(status.refiningNPCId).toBeNull();
  });

  it('returns correct status with error', () => {
    const state = createMockContentState({
      npcLoading: false,
      npcError: 'Compilation failed',
      npcStreamingContent: null,
      refiningNPCId: null,
    });
    const status = selectNPCStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBe('Compilation failed');
  });

  it('returns refining NPC ID', () => {
    const state = createMockContentState({
      npcLoading: true,
      refiningNPCId: 'npc-2',
    });
    const status = selectNPCStatus(state);

    expect(status.refiningNPCId).toBe('npc-2');
  });
});

// =============================================================================
// selectCanProceedToAdversaries Tests
// =============================================================================

describe('selectCanProceedToAdversaries', () => {
  it('returns false when no NPCs', () => {
    const state = createMockContentState();
    expect(selectCanProceedToAdversaries(state)).toBe(false);
  });

  it('returns false when not all NPCs confirmed', () => {
    const state = createMockContentState({
      npcs: [createMockNPC('npc-1'), createMockNPC('npc-2')],
      confirmedNPCIds: new Set(['npc-1']),
    });
    expect(selectCanProceedToAdversaries(state)).toBe(false);
  });

  it('returns true when all NPCs confirmed', () => {
    const state = createMockContentState({
      npcs: [createMockNPC('npc-1'), createMockNPC('npc-2')],
      confirmedNPCIds: new Set(['npc-1', 'npc-2']),
    });
    expect(selectCanProceedToAdversaries(state)).toBe(true);
  });
});

// =============================================================================
// selectNPCSummary Tests
// =============================================================================

describe('selectNPCSummary', () => {
  it('returns correct summary with no NPCs', () => {
    const state = createMockContentState();
    const summary = selectNPCSummary(state);

    expect(summary.total).toBe(0);
    expect(summary.confirmed).toBe(0);
    expect(summary.pending).toBe(0);
  });

  it('returns correct summary with some confirmed', () => {
    const state = createMockContentState({
      npcs: [
        createMockNPC('npc-1'),
        createMockNPC('npc-2'),
        createMockNPC('npc-3'),
        createMockNPC('npc-4'),
      ],
      confirmedNPCIds: new Set(['npc-1', 'npc-3']),
    });
    const summary = selectNPCSummary(state);

    expect(summary.total).toBe(4);
    expect(summary.confirmed).toBe(2);
    expect(summary.pending).toBe(2);
  });
});

// =============================================================================
// selectNPCsByRole Tests
// =============================================================================

describe('selectNPCsByRole', () => {
  it('returns empty array when no NPCs match role', () => {
    const state = createMockContentState({
      npcs: [createMockNPC('npc-1', 'ally')],
    });
    expect(selectNPCsByRole(state, 'antagonist')).toEqual([]);
  });

  it('returns NPCs matching role', () => {
    const state = createMockContentState({
      npcs: [
        createMockNPC('npc-1', 'ally'),
        createMockNPC('npc-2', 'antagonist'),
        createMockNPC('npc-3', 'ally'),
        createMockNPC('npc-4', 'neutral'),
      ],
    });
    const allies = selectNPCsByRole(state, 'ally');

    expect(allies).toHaveLength(2);
    expect(allies.map((n) => n.id)).toEqual(['npc-1', 'npc-3']);
  });
});

// =============================================================================
// selectNPCsByScene Tests
// =============================================================================

describe('selectNPCsByScene', () => {
  it('returns empty array when no NPCs in scene', () => {
    const state = createMockContentState({
      npcs: [createMockNPC('npc-1', 'ally', ['scene-1'])],
    });
    expect(selectNPCsByScene(state, 'scene-2')).toEqual([]);
  });

  it('returns NPCs appearing in specified scene', () => {
    const state = createMockContentState({
      npcs: [
        createMockNPC('npc-1', 'ally', ['scene-1', 'scene-2']),
        createMockNPC('npc-2', 'antagonist', ['scene-2', 'scene-3']),
        createMockNPC('npc-3', 'neutral', ['scene-1']),
        createMockNPC('npc-4', 'ally', ['scene-3']),
      ],
    });
    const npcsInScene2 = selectNPCsByScene(state, 'scene-2');

    expect(npcsInScene2).toHaveLength(2);
    expect(npcsInScene2.map((n) => n.id)).toEqual(['npc-1', 'npc-2']);
  });
});
