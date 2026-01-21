/**
 * Scene Selectors Tests
 *
 * Tests for pure selector functions that derive scene-related state
 * from the ContentState.
 */

import { describe, it, expect } from 'vitest';
import {
  selectScenes,
  selectCurrentScene,
  selectCurrentSceneId,
  selectSceneById,
  selectConfirmedSceneCount,
  selectAllScenesConfirmed,
  selectSceneStatus,
  selectCanProceedToNPCs,
  selectSceneNavigation,
} from './sceneSelectors';
import type { ContentState } from '../contentStore';
import type { Scene, SceneStatus } from '@dagger-app/shared-types';

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

const createMockScene = (id: string, status: SceneStatus = 'pending'): Scene => ({
  brief: {
    id,
    sceneNumber: parseInt(id.replace('scene-', '')),
    title: `Scene ${id}`,
    description: 'Test description',
    keyElements: ['Element 1', 'Element 2'],
    location: 'Test location',
    characters: ['NPC 1'],
  },
  draft: null,
  status,
});

// =============================================================================
// selectScenes Tests
// =============================================================================

describe('selectScenes', () => {
  it('returns empty array when no scenes exist', () => {
    const state = createMockContentState();
    expect(selectScenes(state)).toEqual([]);
  });

  it('returns all scenes', () => {
    const scenes = [
      createMockScene('scene-1'),
      createMockScene('scene-2'),
      createMockScene('scene-3'),
    ];
    const state = createMockContentState({ scenes });

    expect(selectScenes(state)).toHaveLength(3);
    expect(selectScenes(state)).toBe(scenes);
  });
});

// =============================================================================
// selectCurrentScene Tests
// =============================================================================

describe('selectCurrentScene', () => {
  it('returns null when no current scene ID is set', () => {
    const state = createMockContentState({
      scenes: [createMockScene('scene-1')],
      currentSceneId: null,
    });
    expect(selectCurrentScene(state)).toBeNull();
  });

  it('returns null when current scene ID not found in scenes', () => {
    const state = createMockContentState({
      scenes: [createMockScene('scene-1')],
      currentSceneId: 'scene-999',
    });
    expect(selectCurrentScene(state)).toBeNull();
  });

  it('returns current scene when ID matches', () => {
    const scenes = [
      createMockScene('scene-1'),
      createMockScene('scene-2'),
      createMockScene('scene-3'),
    ];
    const state = createMockContentState({
      scenes,
      currentSceneId: 'scene-2',
    });

    const current = selectCurrentScene(state);
    expect(current).not.toBeNull();
    expect(current?.brief.id).toBe('scene-2');
  });
});

// =============================================================================
// selectCurrentSceneId Tests
// =============================================================================

describe('selectCurrentSceneId', () => {
  it('returns null when no current scene', () => {
    const state = createMockContentState();
    expect(selectCurrentSceneId(state)).toBeNull();
  });

  it('returns current scene ID', () => {
    const state = createMockContentState({ currentSceneId: 'scene-3' });
    expect(selectCurrentSceneId(state)).toBe('scene-3');
  });
});

// =============================================================================
// selectSceneById Tests
// =============================================================================

describe('selectSceneById', () => {
  it('returns undefined when scene not found', () => {
    const state = createMockContentState({
      scenes: [createMockScene('scene-1')],
    });
    expect(selectSceneById(state, 'nonexistent')).toBeUndefined();
  });

  it('returns scene when found', () => {
    const scenes = [
      createMockScene('scene-1'),
      createMockScene('scene-2'),
    ];
    const state = createMockContentState({ scenes });

    const scene = selectSceneById(state, 'scene-2');
    expect(scene).toBeDefined();
    expect(scene?.brief.id).toBe('scene-2');
  });
});

// =============================================================================
// selectConfirmedSceneCount Tests
// =============================================================================

describe('selectConfirmedSceneCount', () => {
  it('returns 0 when no scenes', () => {
    const state = createMockContentState();
    expect(selectConfirmedSceneCount(state)).toBe(0);
  });

  it('returns 0 when no confirmed scenes', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'pending'),
        createMockScene('scene-2', 'draft'),
      ],
    });
    expect(selectConfirmedSceneCount(state)).toBe(0);
  });

  it('returns correct count of confirmed scenes', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'confirmed'),
        createMockScene('scene-2', 'draft'),
        createMockScene('scene-3', 'confirmed'),
        createMockScene('scene-4', 'pending'),
      ],
    });
    expect(selectConfirmedSceneCount(state)).toBe(2);
  });
});

// =============================================================================
// selectAllScenesConfirmed Tests
// =============================================================================

describe('selectAllScenesConfirmed', () => {
  it('returns false when no scenes', () => {
    const state = createMockContentState();
    expect(selectAllScenesConfirmed(state)).toBe(false);
  });

  it('returns false when some scenes not confirmed', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'confirmed'),
        createMockScene('scene-2', 'draft'),
        createMockScene('scene-3', 'confirmed'),
      ],
    });
    expect(selectAllScenesConfirmed(state)).toBe(false);
  });

  it('returns true when all scenes confirmed', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'confirmed'),
        createMockScene('scene-2', 'confirmed'),
        createMockScene('scene-3', 'confirmed'),
      ],
    });
    expect(selectAllScenesConfirmed(state)).toBe(true);
  });
});

// =============================================================================
// selectSceneStatus Tests
// =============================================================================

describe('selectSceneStatus', () => {
  it('returns correct status when loading', () => {
    const state = createMockContentState({
      sceneLoading: true,
      sceneError: null,
      sceneStreamingContent: null,
    });
    const status = selectSceneStatus(state);

    expect(status.loading).toBe(true);
    expect(status.error).toBeNull();
    expect(status.streamingContent).toBeNull();
  });

  it('returns correct status with error', () => {
    const state = createMockContentState({
      sceneLoading: false,
      sceneError: 'Generation failed',
      sceneStreamingContent: null,
    });
    const status = selectSceneStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBe('Generation failed');
  });

  it('returns streaming content', () => {
    const state = createMockContentState({
      sceneLoading: true,
      sceneError: null,
      sceneStreamingContent: 'Generating scene...',
    });
    const status = selectSceneStatus(state);

    expect(status.streamingContent).toBe('Generating scene...');
  });
});

// =============================================================================
// selectCanProceedToNPCs Tests
// =============================================================================

describe('selectCanProceedToNPCs', () => {
  it('returns false when no scenes', () => {
    const state = createMockContentState();
    expect(selectCanProceedToNPCs(state)).toBe(false);
  });

  it('returns false when not all scenes confirmed', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'confirmed'),
        createMockScene('scene-2', 'draft'),
      ],
    });
    expect(selectCanProceedToNPCs(state)).toBe(false);
  });

  it('returns true when all scenes confirmed', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'confirmed'),
        createMockScene('scene-2', 'confirmed'),
      ],
    });
    expect(selectCanProceedToNPCs(state)).toBe(true);
  });
});

// =============================================================================
// selectSceneNavigation Tests
// =============================================================================

describe('selectSceneNavigation', () => {
  it('returns no navigation when no current scene', () => {
    const state = createMockContentState({
      scenes: [createMockScene('scene-1')],
      currentSceneId: null,
    });
    const nav = selectSceneNavigation(state);

    expect(nav.canGoPrevious).toBe(false);
    expect(nav.canGoNext).toBe(false);
    expect(nav.currentIndex).toBe(-1);
  });

  it('returns no navigation when current scene not found', () => {
    const state = createMockContentState({
      scenes: [createMockScene('scene-1')],
      currentSceneId: 'nonexistent',
    });
    const nav = selectSceneNavigation(state);

    expect(nav.currentIndex).toBe(-1);
  });

  it('returns can go next but not previous for first scene', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'confirmed'),
        createMockScene('scene-2', 'pending'),
      ],
      currentSceneId: 'scene-1',
    });
    const nav = selectSceneNavigation(state);

    expect(nav.canGoPrevious).toBe(false);
    expect(nav.canGoNext).toBe(true);
    expect(nav.currentIndex).toBe(0);
  });

  it('returns can go previous but not next for last scene', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'confirmed'),
        createMockScene('scene-2', 'pending'),
      ],
      currentSceneId: 'scene-2',
    });
    const nav = selectSceneNavigation(state);

    expect(nav.canGoPrevious).toBe(true);
    expect(nav.canGoNext).toBe(false);
    expect(nav.currentIndex).toBe(1);
  });

  it('allows next navigation only when current scene is confirmed or draft', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'pending'),
        createMockScene('scene-2', 'pending'),
      ],
      currentSceneId: 'scene-1',
    });
    const nav = selectSceneNavigation(state);

    expect(nav.canGoNext).toBe(false);
  });

  it('returns both directions for middle scene', () => {
    const state = createMockContentState({
      scenes: [
        createMockScene('scene-1', 'confirmed'),
        createMockScene('scene-2', 'draft'),
        createMockScene('scene-3', 'pending'),
      ],
      currentSceneId: 'scene-2',
    });
    const nav = selectSceneNavigation(state);

    expect(nav.canGoPrevious).toBe(true);
    expect(nav.canGoNext).toBe(true);
    expect(nav.currentIndex).toBe(1);
  });
});
