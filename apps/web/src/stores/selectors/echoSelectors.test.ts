/**
 * Echo Selectors Tests
 *
 * Tests for pure selector functions that derive echo-related state
 * from the ContentState.
 */

import { describe, it, expect } from 'vitest';
import {
  selectEchoes,
  selectEchoesByCategory,
  selectConfirmedEchoIds,
  selectEchoById,
  selectConfirmedEchoCount,
  selectAllEchoesConfirmed,
  selectEchoStatus,
  selectEchoSummary,
  selectActiveEchoCategory,
  selectCanProceedToComplete,
} from './echoSelectors';
import type { ContentState } from '../contentStore';
import type { Echo, EchoCategory } from '@dagger-app/shared-types';

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

const createMockEcho = (
  id: string,
  category: EchoCategory = 'complications'
): Echo => ({
  id,
  category,
  title: `Echo ${id}`,
  content: `Content for echo ${id}`,
  isConfirmed: false,
  createdAt: new Date().toISOString(),
});

// =============================================================================
// selectEchoes Tests
// =============================================================================

describe('selectEchoes', () => {
  it('returns empty array when no echoes', () => {
    const state = createMockContentState();
    expect(selectEchoes(state)).toEqual([]);
  });

  it('returns all echoes', () => {
    const echoes = [createMockEcho('echo-1'), createMockEcho('echo-2')];
    const state = createMockContentState({ echoes });

    expect(selectEchoes(state)).toHaveLength(2);
    expect(selectEchoes(state)).toBe(echoes);
  });
});

// =============================================================================
// selectEchoesByCategory Tests
// =============================================================================

describe('selectEchoesByCategory', () => {
  it('returns empty array when no echoes match category', () => {
    const state = createMockContentState({
      echoes: [createMockEcho('echo-1', 'complications')],
    });
    expect(selectEchoesByCategory(state, 'rumors')).toEqual([]);
  });

  it('returns echoes matching category', () => {
    const state = createMockContentState({
      echoes: [
        createMockEcho('echo-1', 'complications'),
        createMockEcho('echo-2', 'rumors'),
        createMockEcho('echo-3', 'complications'),
        createMockEcho('echo-4', 'discoveries'),
      ],
    });
    const complications = selectEchoesByCategory(state, 'complications');

    expect(complications).toHaveLength(2);
    expect(complications.map((e) => e.id)).toEqual(['echo-1', 'echo-3']);
  });
});

// =============================================================================
// selectConfirmedEchoIds Tests
// =============================================================================

describe('selectConfirmedEchoIds', () => {
  it('returns empty Set when no confirmed echoes', () => {
    const state = createMockContentState();
    expect(selectConfirmedEchoIds(state).size).toBe(0);
  });

  it('returns Set of confirmed echo IDs', () => {
    const state = createMockContentState({
      confirmedEchoIds: new Set(['echo-1', 'echo-2']),
    });
    const ids = selectConfirmedEchoIds(state);

    expect(ids.has('echo-1')).toBe(true);
    expect(ids.has('echo-2')).toBe(true);
    expect(ids.size).toBe(2);
  });
});

// =============================================================================
// selectEchoById Tests
// =============================================================================

describe('selectEchoById', () => {
  it('returns undefined when echo not found', () => {
    const state = createMockContentState({
      echoes: [createMockEcho('echo-1')],
    });
    expect(selectEchoById(state, 'nonexistent')).toBeUndefined();
  });

  it('returns echo when found', () => {
    const echoes = [createMockEcho('echo-1'), createMockEcho('echo-2')];
    const state = createMockContentState({ echoes });

    const echo = selectEchoById(state, 'echo-2');
    expect(echo).toBeDefined();
    expect(echo?.id).toBe('echo-2');
  });
});

// =============================================================================
// selectConfirmedEchoCount Tests
// =============================================================================

describe('selectConfirmedEchoCount', () => {
  it('returns 0 when no confirmed echoes', () => {
    const state = createMockContentState();
    expect(selectConfirmedEchoCount(state)).toBe(0);
  });

  it('returns correct count', () => {
    const state = createMockContentState({
      confirmedEchoIds: new Set(['echo-1', 'echo-2', 'echo-3']),
    });
    expect(selectConfirmedEchoCount(state)).toBe(3);
  });
});

// =============================================================================
// selectAllEchoesConfirmed Tests
// =============================================================================

describe('selectAllEchoesConfirmed', () => {
  it('returns false when no echoes', () => {
    const state = createMockContentState();
    expect(selectAllEchoesConfirmed(state)).toBe(false);
  });

  it('returns false when not all echoes confirmed', () => {
    const state = createMockContentState({
      echoes: [createMockEcho('echo-1'), createMockEcho('echo-2'), createMockEcho('echo-3')],
      confirmedEchoIds: new Set(['echo-1']),
    });
    expect(selectAllEchoesConfirmed(state)).toBe(false);
  });

  it('returns true when all echoes confirmed', () => {
    const state = createMockContentState({
      echoes: [createMockEcho('echo-1'), createMockEcho('echo-2')],
      confirmedEchoIds: new Set(['echo-1', 'echo-2']),
    });
    expect(selectAllEchoesConfirmed(state)).toBe(true);
  });
});

// =============================================================================
// selectEchoStatus Tests
// =============================================================================

describe('selectEchoStatus', () => {
  it('returns correct status when loading', () => {
    const state = createMockContentState({
      echoLoading: true,
      echoError: null,
      echoStreamingContent: 'Generating echoes...',
      activeEchoCategory: 'rumors',
    });
    const status = selectEchoStatus(state);

    expect(status.loading).toBe(true);
    expect(status.error).toBeNull();
    expect(status.streamingContent).toBe('Generating echoes...');
    expect(status.activeCategory).toBe('rumors');
  });

  it('returns correct status with error', () => {
    const state = createMockContentState({
      echoLoading: false,
      echoError: 'Generation failed',
      echoStreamingContent: null,
      activeEchoCategory: 'complications',
    });
    const status = selectEchoStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBe('Generation failed');
  });
});

// =============================================================================
// selectEchoSummary Tests
// =============================================================================

describe('selectEchoSummary', () => {
  it('returns correct summary with no echoes', () => {
    const state = createMockContentState();
    const summary = selectEchoSummary(state);

    expect(summary.total).toBe(0);
    expect(summary.confirmed).toBe(0);
    expect(summary.pending).toBe(0);
    expect(summary.byCategory.complications).toBe(0);
    expect(summary.byCategory.rumors).toBe(0);
    expect(summary.byCategory.discoveries).toBe(0);
    expect(summary.byCategory.intrusions).toBe(0);
    expect(summary.byCategory.wonders).toBe(0);
  });

  it('returns correct summary with echoes', () => {
    const state = createMockContentState({
      echoes: [
        createMockEcho('echo-1', 'complications'),
        createMockEcho('echo-2', 'complications'),
        createMockEcho('echo-3', 'rumors'),
        createMockEcho('echo-4', 'discoveries'),
        createMockEcho('echo-5', 'intrusions'),
      ],
      confirmedEchoIds: new Set(['echo-1', 'echo-3']),
    });
    const summary = selectEchoSummary(state);

    expect(summary.total).toBe(5);
    expect(summary.confirmed).toBe(2);
    expect(summary.pending).toBe(3);
    expect(summary.byCategory.complications).toBe(2);
    expect(summary.byCategory.rumors).toBe(1);
    expect(summary.byCategory.discoveries).toBe(1);
    expect(summary.byCategory.intrusions).toBe(1);
    expect(summary.byCategory.wonders).toBe(0);
  });
});

// =============================================================================
// selectActiveEchoCategory Tests
// =============================================================================

describe('selectActiveEchoCategory', () => {
  it('returns default category', () => {
    const state = createMockContentState();
    expect(selectActiveEchoCategory(state)).toBe('complications');
  });

  it('returns active category', () => {
    const state = createMockContentState({ activeEchoCategory: 'wonders' });
    expect(selectActiveEchoCategory(state)).toBe('wonders');
  });
});

// =============================================================================
// selectCanProceedToComplete Tests
// =============================================================================

describe('selectCanProceedToComplete', () => {
  it('returns false when no echoes', () => {
    const state = createMockContentState();
    expect(selectCanProceedToComplete(state)).toBe(false);
  });

  it('returns false when not all echoes confirmed', () => {
    const state = createMockContentState({
      echoes: [createMockEcho('echo-1'), createMockEcho('echo-2')],
      confirmedEchoIds: new Set(['echo-1']),
    });
    expect(selectCanProceedToComplete(state)).toBe(false);
  });

  it('returns true when all echoes confirmed', () => {
    const state = createMockContentState({
      echoes: [createMockEcho('echo-1'), createMockEcho('echo-2')],
      confirmedEchoIds: new Set(['echo-1', 'echo-2']),
    });
    expect(selectCanProceedToComplete(state)).toBe(true);
  });
});
