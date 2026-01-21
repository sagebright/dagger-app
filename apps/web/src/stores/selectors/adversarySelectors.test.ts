/**
 * Adversary Selectors Tests
 *
 * Tests for pure selector functions that derive adversary-related state
 * from the ContentState.
 */

import { describe, it, expect } from 'vitest';
import {
  selectAvailableAdversaries,
  selectSelectedAdversaries,
  selectConfirmedAdversaryIds,
  selectFilteredAdversaries,
  selectSelectedAdversaryCount,
  selectConfirmedAdversaryCount,
  selectAllAdversariesConfirmed,
  selectAdversaryStatus,
  selectCanProceedToItems,
  selectAdversarySummary,
  selectAvailableAdversaryTypes,
  selectAdversaryFilters,
  selectIsAdversarySelected,
  selectSelectedAdversaryByName,
} from './adversarySelectors';
import type { ContentState } from '../contentStore';
import type { DaggerheartAdversary, SelectedAdversary } from '@dagger-app/shared-types';

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

const createMockAdversary = (
  name: string,
  tier = 1,
  type = 'beast'
): DaggerheartAdversary => ({
  id: `adv-${name.toLowerCase().replace(/\s/g, '-')}`,
  name,
  tier,
  type,
  description: `A ${type} called ${name}`,
  motives_tactics: ['Test motive'],
  difficulty: tier,
  thresholds: `${tier}/${tier * 2}/${tier * 3}`,
  hp: 10 * tier,
  stress: 2 * tier,
  atk: `+${tier}`,
  weapon: 'Claws',
  range: 'Melee',
  dmg: `d8+${tier}`,
  experiences: null,
  features: [{ name: 'Feature 1', description: 'A feature' }],
  searchable_text: null,
  embedding: null,
  source_book: 'Core',
  created_at: new Date().toISOString(),
});

const createMockSelectedAdversary = (
  name: string,
  quantity = 1,
  tier = 1,
  type = 'beast'
): SelectedAdversary => ({
  adversary: createMockAdversary(name, tier, type),
  quantity,
});

// =============================================================================
// selectFilteredAdversaries Tests
// =============================================================================

describe('selectFilteredAdversaries', () => {
  const adversaries = [
    createMockAdversary('Fire Dragon', 3, 'beast'),
    createMockAdversary('Ice Golem', 2, 'elemental'),
    createMockAdversary('Shadow Assassin', 1, 'humanoid'),
    createMockAdversary('Fire Sprite', 1, 'elemental'),
  ];

  it('returns all adversaries when no filters applied', () => {
    const state = createMockContentState({
      availableAdversaries: adversaries,
      adversaryFilters: {},
    });
    expect(selectFilteredAdversaries(state)).toHaveLength(4);
  });

  it('filters by tier', () => {
    const state = createMockContentState({
      availableAdversaries: adversaries,
      adversaryFilters: { tier: 1 },
    });
    const filtered = selectFilteredAdversaries(state);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((a) => a.name)).toContain('Shadow Assassin');
    expect(filtered.map((a) => a.name)).toContain('Fire Sprite');
  });

  it('filters by type (case insensitive)', () => {
    const state = createMockContentState({
      availableAdversaries: adversaries,
      adversaryFilters: { type: 'ELEMENTAL' },
    });
    const filtered = selectFilteredAdversaries(state);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((a) => a.name)).toContain('Ice Golem');
    expect(filtered.map((a) => a.name)).toContain('Fire Sprite');
  });

  it('filters by search term in name', () => {
    const state = createMockContentState({
      availableAdversaries: adversaries,
      adversaryFilters: { searchTerm: 'fire' },
    });
    const filtered = selectFilteredAdversaries(state);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((a) => a.name)).toContain('Fire Dragon');
    expect(filtered.map((a) => a.name)).toContain('Fire Sprite');
  });

  it('filters by search term in description', () => {
    const state = createMockContentState({
      availableAdversaries: adversaries,
      adversaryFilters: { searchTerm: 'humanoid' },
    });
    const filtered = selectFilteredAdversaries(state);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Shadow Assassin');
  });

  it('combines multiple filters', () => {
    const state = createMockContentState({
      availableAdversaries: adversaries,
      adversaryFilters: { tier: 1, type: 'elemental' },
    });
    const filtered = selectFilteredAdversaries(state);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Fire Sprite');
  });
});

// =============================================================================
// selectSelectedAdversaryCount Tests
// =============================================================================

describe('selectSelectedAdversaryCount', () => {
  it('returns 0 when no selected adversaries', () => {
    const state = createMockContentState();
    expect(selectSelectedAdversaryCount(state)).toBe(0);
  });

  it('returns total quantity across all selections', () => {
    const state = createMockContentState({
      selectedAdversaries: [
        createMockSelectedAdversary('Dragon', 2),
        createMockSelectedAdversary('Goblin', 5),
        createMockSelectedAdversary('Troll', 1),
      ],
    });
    expect(selectSelectedAdversaryCount(state)).toBe(8);
  });
});

// =============================================================================
// selectAllAdversariesConfirmed Tests
// =============================================================================

describe('selectAllAdversariesConfirmed', () => {
  it('returns false when no selected adversaries', () => {
    const state = createMockContentState();
    expect(selectAllAdversariesConfirmed(state)).toBe(false);
  });

  it('returns false when not all confirmed', () => {
    const state = createMockContentState({
      selectedAdversaries: [
        createMockSelectedAdversary('Dragon'),
        createMockSelectedAdversary('Goblin'),
      ],
      confirmedAdversaryIds: new Set(['Dragon']),
    });
    expect(selectAllAdversariesConfirmed(state)).toBe(false);
  });

  it('returns true when all confirmed', () => {
    const state = createMockContentState({
      selectedAdversaries: [
        createMockSelectedAdversary('Dragon'),
        createMockSelectedAdversary('Goblin'),
      ],
      confirmedAdversaryIds: new Set(['Dragon', 'Goblin']),
    });
    expect(selectAllAdversariesConfirmed(state)).toBe(true);
  });
});

// =============================================================================
// selectAdversaryStatus Tests
// =============================================================================

describe('selectAdversaryStatus', () => {
  it('returns correct status when loading', () => {
    const state = createMockContentState({
      adversaryLoading: true,
      adversaryError: null,
    });
    const status = selectAdversaryStatus(state);

    expect(status.loading).toBe(true);
    expect(status.error).toBeNull();
  });

  it('returns correct status with error', () => {
    const state = createMockContentState({
      adversaryLoading: false,
      adversaryError: 'Failed to load adversaries',
    });
    const status = selectAdversaryStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBe('Failed to load adversaries');
  });
});

// =============================================================================
// selectCanProceedToItems Tests
// =============================================================================

describe('selectCanProceedToItems', () => {
  it('returns false when no selected adversaries', () => {
    const state = createMockContentState();
    expect(selectCanProceedToItems(state)).toBe(false);
  });

  it('returns false when not all confirmed', () => {
    const state = createMockContentState({
      selectedAdversaries: [createMockSelectedAdversary('Dragon')],
      confirmedAdversaryIds: new Set(),
    });
    expect(selectCanProceedToItems(state)).toBe(false);
  });

  it('returns true when all confirmed', () => {
    const state = createMockContentState({
      selectedAdversaries: [createMockSelectedAdversary('Dragon')],
      confirmedAdversaryIds: new Set(['Dragon']),
    });
    expect(selectCanProceedToItems(state)).toBe(true);
  });
});

// =============================================================================
// selectAdversarySummary Tests
// =============================================================================

describe('selectAdversarySummary', () => {
  it('returns correct summary', () => {
    const state = createMockContentState({
      availableAdversaries: [
        createMockAdversary('Dragon'),
        createMockAdversary('Goblin'),
        createMockAdversary('Troll'),
      ],
      selectedAdversaries: [
        createMockSelectedAdversary('Dragon'),
        createMockSelectedAdversary('Goblin'),
      ],
      confirmedAdversaryIds: new Set(['Dragon']),
    });
    const summary = selectAdversarySummary(state);

    expect(summary.total).toBe(3);
    expect(summary.selected).toBe(2);
    expect(summary.confirmed).toBe(1);
    expect(summary.pending).toBe(1);
  });
});

// =============================================================================
// selectIsAdversarySelected / selectSelectedAdversaryByName Tests
// =============================================================================

describe('selectIsAdversarySelected', () => {
  it('returns false when adversary not selected', () => {
    const state = createMockContentState({
      selectedAdversaries: [createMockSelectedAdversary('Dragon')],
    });
    expect(selectIsAdversarySelected(state, 'Goblin')).toBe(false);
  });

  it('returns true when adversary is selected', () => {
    const state = createMockContentState({
      selectedAdversaries: [createMockSelectedAdversary('Dragon')],
    });
    expect(selectIsAdversarySelected(state, 'Dragon')).toBe(true);
  });
});

describe('selectSelectedAdversaryByName', () => {
  it('returns undefined when not found', () => {
    const state = createMockContentState({
      selectedAdversaries: [createMockSelectedAdversary('Dragon')],
    });
    expect(selectSelectedAdversaryByName(state, 'Goblin')).toBeUndefined();
  });

  it('returns selected adversary when found', () => {
    const state = createMockContentState({
      selectedAdversaries: [
        createMockSelectedAdversary('Dragon', 3),
        createMockSelectedAdversary('Goblin', 5),
      ],
    });
    const selected = selectSelectedAdversaryByName(state, 'Goblin');

    expect(selected).toBeDefined();
    expect(selected?.quantity).toBe(5);
  });
});

// =============================================================================
// Basic Selector Tests
// =============================================================================

describe('basic adversary selectors', () => {
  it('selectAvailableAdversaries returns available adversaries', () => {
    const adversaries = [createMockAdversary('Dragon')];
    const state = createMockContentState({ availableAdversaries: adversaries });

    expect(selectAvailableAdversaries(state)).toBe(adversaries);
  });

  it('selectSelectedAdversaries returns selected adversaries', () => {
    const selected = [createMockSelectedAdversary('Dragon')];
    const state = createMockContentState({ selectedAdversaries: selected });

    expect(selectSelectedAdversaries(state)).toBe(selected);
  });

  it('selectConfirmedAdversaryIds returns confirmed IDs', () => {
    const state = createMockContentState({
      confirmedAdversaryIds: new Set(['adv-1', 'adv-2']),
    });
    const ids = selectConfirmedAdversaryIds(state);

    expect(ids.has('adv-1')).toBe(true);
    expect(ids.has('adv-2')).toBe(true);
  });

  it('selectConfirmedAdversaryCount returns count', () => {
    const state = createMockContentState({
      confirmedAdversaryIds: new Set(['adv-1', 'adv-2', 'adv-3']),
    });
    expect(selectConfirmedAdversaryCount(state)).toBe(3);
  });

  it('selectAvailableAdversaryTypes returns types', () => {
    const state = createMockContentState({
      availableAdversaryTypes: ['beast', 'elemental', 'humanoid'],
    });
    expect(selectAvailableAdversaryTypes(state)).toEqual(['beast', 'elemental', 'humanoid']);
  });

  it('selectAdversaryFilters returns filters', () => {
    const filters = { tier: 2, type: 'beast' };
    const state = createMockContentState({ adversaryFilters: filters });

    expect(selectAdversaryFilters(state)).toEqual(filters);
  });
});
