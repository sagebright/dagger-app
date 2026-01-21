/**
 * Outline Selectors Tests
 *
 * Tests for pure selector functions that derive outline-related state
 * from the ContentState.
 */

import { describe, it, expect } from 'vitest';
import {
  selectHasOutline,
  selectIsOutlineConfirmed,
  selectOutlineTitle,
  selectSceneCount,
  selectSceneBriefs,
  selectSceneBriefById,
  selectIsOutlineComplete,
  selectCanProceedToScenes,
  selectOutlineStatus,
  selectOutlineSummary,
} from './outlineSelectors';
import type { ContentState } from '../contentStore';
import type { Outline, SceneBrief } from '@dagger-app/shared-types';

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

const createMockSceneBrief = (sceneNumber: number, title = `Scene ${sceneNumber}`): SceneBrief => ({
  id: `scene-${sceneNumber}`,
  sceneNumber,
  title,
  description: `Description for ${title}`,
  keyElements: ['Element 1', 'Element 2'],
  location: `Location ${sceneNumber}`,
  characters: ['NPC 1'],
});

const createMockOutline = (sceneCount = 4): Outline => ({
  id: 'outline-1',
  title: 'Test Adventure Outline',
  summary: 'A test adventure summary',
  scenes: Array.from({ length: sceneCount }, (_, i) => createMockSceneBrief(i + 1)),
  isConfirmed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// =============================================================================
// selectHasOutline Tests
// =============================================================================

describe('selectHasOutline', () => {
  it('returns false when no outline exists', () => {
    const state = createMockContentState();
    expect(selectHasOutline(state)).toBe(false);
  });

  it('returns true when an outline exists', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(),
    });
    expect(selectHasOutline(state)).toBe(true);
  });
});

// =============================================================================
// selectIsOutlineConfirmed Tests
// =============================================================================

describe('selectIsOutlineConfirmed', () => {
  it('returns false when outline is not confirmed', () => {
    const state = createMockContentState({ outlineConfirmed: false });
    expect(selectIsOutlineConfirmed(state)).toBe(false);
  });

  it('returns true when outline is confirmed', () => {
    const state = createMockContentState({ outlineConfirmed: true });
    expect(selectIsOutlineConfirmed(state)).toBe(true);
  });
});

// =============================================================================
// selectOutlineTitle Tests
// =============================================================================

describe('selectOutlineTitle', () => {
  it('returns null when no outline exists', () => {
    const state = createMockContentState();
    expect(selectOutlineTitle(state)).toBeNull();
  });

  it('returns outline title when outline exists', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(),
    });
    expect(selectOutlineTitle(state)).toBe('Test Adventure Outline');
  });
});

// =============================================================================
// selectSceneCount Tests
// =============================================================================

describe('selectSceneCount', () => {
  it('returns 0 when no outline exists', () => {
    const state = createMockContentState();
    expect(selectSceneCount(state)).toBe(0);
  });

  it('returns correct scene count', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(5),
    });
    expect(selectSceneCount(state)).toBe(5);
  });
});

// =============================================================================
// selectSceneBriefs Tests
// =============================================================================

describe('selectSceneBriefs', () => {
  it('returns empty array when no outline exists', () => {
    const state = createMockContentState();
    expect(selectSceneBriefs(state)).toEqual([]);
  });

  it('returns all scene briefs', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(3),
    });
    const briefs = selectSceneBriefs(state);

    expect(briefs).toHaveLength(3);
    expect(briefs[0].sceneNumber).toBe(1);
    expect(briefs[1].sceneNumber).toBe(2);
    expect(briefs[2].sceneNumber).toBe(3);
  });
});

// =============================================================================
// selectSceneBriefById Tests
// =============================================================================

describe('selectSceneBriefById', () => {
  it('returns undefined when no outline exists', () => {
    const state = createMockContentState();
    expect(selectSceneBriefById(state, 'scene-1')).toBeUndefined();
  });

  it('returns undefined when scene not found', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(3),
    });
    expect(selectSceneBriefById(state, 'nonexistent')).toBeUndefined();
  });

  it('returns correct scene brief by ID', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(4),
    });
    const brief = selectSceneBriefById(state, 'scene-2');

    expect(brief).toBeDefined();
    expect(brief?.sceneNumber).toBe(2);
  });
});

// =============================================================================
// selectIsOutlineComplete Tests
// =============================================================================

describe('selectIsOutlineComplete', () => {
  it('returns false when no outline exists', () => {
    const state = createMockContentState();
    expect(selectIsOutlineComplete(state, 4)).toBe(false);
  });

  it('returns false when scene count is below expected', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(3),
    });
    expect(selectIsOutlineComplete(state, 5)).toBe(false);
  });

  it('returns true when scene count matches expected exactly', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(5),
    });
    expect(selectIsOutlineComplete(state, 5)).toBe(true);
  });

  it('returns false when scene count exceeds expected', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(5),
    });
    // isOutlineComplete requires exact match
    expect(selectIsOutlineComplete(state, 4)).toBe(false);
  });
});

// =============================================================================
// selectCanProceedToScenes Tests
// =============================================================================

describe('selectCanProceedToScenes', () => {
  it('returns false when no outline exists', () => {
    const state = createMockContentState();
    expect(selectCanProceedToScenes(state)).toBe(false);
  });

  it('returns false when outline exists but not confirmed', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(),
      outlineConfirmed: false,
    });
    expect(selectCanProceedToScenes(state)).toBe(false);
  });

  it('returns true when outline exists and is confirmed', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(),
      outlineConfirmed: true,
    });
    expect(selectCanProceedToScenes(state)).toBe(true);
  });
});

// =============================================================================
// selectOutlineStatus Tests
// =============================================================================

describe('selectOutlineStatus', () => {
  it('returns correct status when loading', () => {
    const state = createMockContentState({
      outlineLoading: true,
      outlineError: null,
      currentOutline: null,
    });
    const status = selectOutlineStatus(state);

    expect(status.loading).toBe(true);
    expect(status.error).toBeNull();
    expect(status.hasOutline).toBe(false);
  });

  it('returns correct status with error', () => {
    const state = createMockContentState({
      outlineLoading: false,
      outlineError: 'Generation failed',
      currentOutline: null,
    });
    const status = selectOutlineStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBe('Generation failed');
    expect(status.hasOutline).toBe(false);
  });

  it('returns correct status when outline exists', () => {
    const state = createMockContentState({
      outlineLoading: false,
      outlineError: null,
      currentOutline: createMockOutline(),
    });
    const status = selectOutlineStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBeNull();
    expect(status.hasOutline).toBe(true);
  });
});

// =============================================================================
// selectOutlineSummary Tests
// =============================================================================

describe('selectOutlineSummary', () => {
  it('returns null when no outline exists', () => {
    const state = createMockContentState();
    expect(selectOutlineSummary(state)).toBeNull();
  });

  it('returns summary with correct data', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(5),
      outlineConfirmed: true,
    });
    const summary = selectOutlineSummary(state);

    expect(summary).not.toBeNull();
    expect(summary?.title).toBe('Test Adventure Outline');
    expect(summary?.sceneCount).toBe(5);
    expect(summary?.isConfirmed).toBe(true);
  });

  it('returns unconfirmed status correctly', () => {
    const state = createMockContentState({
      currentOutline: createMockOutline(3),
      outlineConfirmed: false,
    });
    const summary = selectOutlineSummary(state);

    expect(summary?.isConfirmed).toBe(false);
  });
});
