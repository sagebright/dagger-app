/**
 * Frame Selectors Tests
 *
 * Tests for pure selector functions that derive frame-related state
 * from the ContentState.
 */

import { describe, it, expect } from 'vitest';
import {
  selectHasSelectedFrame,
  selectIsFrameConfirmed,
  selectIsCustomFrame,
  selectFrameName,
  selectFrameThemes,
  selectCanProceedToOutline,
  selectFramesStatus,
} from './frameSelectors';
import type { ContentState } from '../contentStore';

// =============================================================================
// Test Helpers
// =============================================================================

const createMockContentState = (overrides: Partial<ContentState> = {}): ContentState => ({
  // Frame state
  availableFrames: [],
  selectedFrame: null,
  frameConfirmed: false,
  framesLoading: false,
  framesError: null,

  // Outline state
  currentOutline: null,
  outlineLoading: false,
  outlineError: null,
  outlineConfirmed: false,

  // Scene state
  scenes: [],
  currentSceneId: null,
  sceneLoading: false,
  sceneError: null,
  sceneStreamingContent: null,

  // NPC state
  npcs: [],
  confirmedNPCIds: new Set<string>(),
  npcLoading: false,
  npcError: null,
  npcStreamingContent: null,
  refiningNPCId: null,

  // Adversary state
  availableAdversaries: [],
  selectedAdversaries: [],
  confirmedAdversaryIds: new Set<string>(),
  adversaryLoading: false,
  adversaryError: null,
  availableAdversaryTypes: [],
  adversaryFilters: {},

  // Item state
  availableItems: [],
  selectedItems: [],
  confirmedItemIds: new Set<string>(),
  itemLoading: false,
  itemError: null,
  availableItemCategories: [],
  itemFilters: {},

  // Echo state
  echoes: [],
  confirmedEchoIds: new Set<string>(),
  echoLoading: false,
  echoError: null,
  echoStreamingContent: null,
  activeEchoCategory: 'complications',

  // Actions (stubs for testing)
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

const createMockDaggerheartFrame = (name = 'Test Frame') => ({
  id: 'frame-1',
  name,
  description: 'A test frame',
  source_book: 'Custom',
  themes: ['redemption', 'sacrifice'],
  typical_adversaries: null,
  lore: null,
  embedding: null,
  created_at: new Date().toISOString(),
});

const createMockCustomFrame = (name = 'Custom Frame') => ({
  id: `custom-${Date.now()}`,
  name,
  description: 'A custom frame',
  themes: ['mystery'],
  typicalAdversaries: [],
  lore: '',
  isCustom: true as const,
});

// =============================================================================
// selectHasSelectedFrame Tests
// =============================================================================

describe('selectHasSelectedFrame', () => {
  it('returns false when no frame is selected', () => {
    const state = createMockContentState();
    expect(selectHasSelectedFrame(state)).toBe(false);
  });

  it('returns true when a frame is selected', () => {
    const state = createMockContentState({
      selectedFrame: createMockDaggerheartFrame(),
    });
    expect(selectHasSelectedFrame(state)).toBe(true);
  });

  it('returns true when a custom frame is selected', () => {
    const state = createMockContentState({
      selectedFrame: createMockCustomFrame(),
    });
    expect(selectHasSelectedFrame(state)).toBe(true);
  });
});

// =============================================================================
// selectIsFrameConfirmed Tests
// =============================================================================

describe('selectIsFrameConfirmed', () => {
  it('returns false when frame is not confirmed', () => {
    const state = createMockContentState({ frameConfirmed: false });
    expect(selectIsFrameConfirmed(state)).toBe(false);
  });

  it('returns true when frame is confirmed', () => {
    const state = createMockContentState({ frameConfirmed: true });
    expect(selectIsFrameConfirmed(state)).toBe(true);
  });
});

// =============================================================================
// selectIsCustomFrame Tests
// =============================================================================

describe('selectIsCustomFrame', () => {
  it('returns false when no frame is selected', () => {
    const state = createMockContentState();
    expect(selectIsCustomFrame(state)).toBe(false);
  });

  it('returns false when a DB frame is selected', () => {
    const state = createMockContentState({
      selectedFrame: createMockDaggerheartFrame(),
    });
    expect(selectIsCustomFrame(state)).toBe(false);
  });

  it('returns true when a custom frame is selected', () => {
    const state = createMockContentState({
      selectedFrame: createMockCustomFrame(),
    });
    expect(selectIsCustomFrame(state)).toBe(true);
  });
});

// =============================================================================
// selectFrameName Tests
// =============================================================================

describe('selectFrameName', () => {
  it('returns null when no frame is selected', () => {
    const state = createMockContentState();
    expect(selectFrameName(state)).toBeNull();
  });

  it('returns frame name when a DB frame is selected', () => {
    const state = createMockContentState({
      selectedFrame: createMockDaggerheartFrame('Dragon Keep'),
    });
    expect(selectFrameName(state)).toBe('Dragon Keep');
  });

  it('returns frame name when a custom frame is selected', () => {
    const state = createMockContentState({
      selectedFrame: createMockCustomFrame('My Custom Frame'),
    });
    expect(selectFrameName(state)).toBe('My Custom Frame');
  });
});

// =============================================================================
// selectFrameThemes Tests
// =============================================================================

describe('selectFrameThemes', () => {
  it('returns empty array when no frame is selected', () => {
    const state = createMockContentState();
    expect(selectFrameThemes(state)).toEqual([]);
  });

  it('returns themes from a DB frame', () => {
    const state = createMockContentState({
      selectedFrame: createMockDaggerheartFrame(),
    });
    expect(selectFrameThemes(state)).toEqual(['redemption', 'sacrifice']);
  });

  it('returns themes from a custom frame', () => {
    const state = createMockContentState({
      selectedFrame: createMockCustomFrame(),
    });
    expect(selectFrameThemes(state)).toEqual(['mystery']);
  });

  it('handles frame without themes', () => {
    const state = createMockContentState({
      selectedFrame: {
        ...createMockDaggerheartFrame(),
        themes: null as unknown as string[],
      },
    });
    // Should handle null gracefully
    expect(selectFrameThemes(state)).toEqual([]);
  });
});

// =============================================================================
// selectCanProceedToOutline Tests
// =============================================================================

describe('selectCanProceedToOutline', () => {
  it('returns false when no frame is selected', () => {
    const state = createMockContentState();
    expect(selectCanProceedToOutline(state)).toBe(false);
  });

  it('returns false when frame is selected but not confirmed', () => {
    const state = createMockContentState({
      selectedFrame: createMockDaggerheartFrame(),
      frameConfirmed: false,
    });
    expect(selectCanProceedToOutline(state)).toBe(false);
  });

  it('returns true when frame is selected and confirmed', () => {
    const state = createMockContentState({
      selectedFrame: createMockDaggerheartFrame(),
      frameConfirmed: true,
    });
    expect(selectCanProceedToOutline(state)).toBe(true);
  });
});

// =============================================================================
// selectFramesStatus Tests
// =============================================================================

describe('selectFramesStatus', () => {
  it('returns correct status when loading', () => {
    const state = createMockContentState({
      framesLoading: true,
      framesError: null,
      availableFrames: [],
    });
    const status = selectFramesStatus(state);

    expect(status.loading).toBe(true);
    expect(status.error).toBeNull();
    expect(status.hasFrames).toBe(false);
  });

  it('returns correct status with error', () => {
    const state = createMockContentState({
      framesLoading: false,
      framesError: 'Failed to load frames',
      availableFrames: [],
    });
    const status = selectFramesStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBe('Failed to load frames');
    expect(status.hasFrames).toBe(false);
  });

  it('returns correct status when frames are loaded', () => {
    const state = createMockContentState({
      framesLoading: false,
      framesError: null,
      availableFrames: [createMockDaggerheartFrame()],
    });
    const status = selectFramesStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBeNull();
    expect(status.hasFrames).toBe(true);
  });
});
