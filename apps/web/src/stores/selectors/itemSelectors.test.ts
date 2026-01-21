/**
 * Item Selectors Tests
 *
 * Tests for pure selector functions that derive item-related state
 * from the ContentState.
 */

import { describe, it, expect } from 'vitest';
import {
  selectAvailableItems,
  selectSelectedItems,
  selectConfirmedItemIds,
  selectFilteredItems,
  selectSelectedItemCount,
  selectConfirmedItemCount,
  selectAllItemsConfirmed,
  selectItemStatus,
  selectCanProceedToEchoes,
  selectItemSummary,
  selectAvailableItemCategories,
  selectItemFilters,
  selectIsItemSelected,
  selectSelectedItemByKey,
} from './itemSelectors';
import type { ContentState } from '../contentStore';
import type { UnifiedItem, SelectedItem, ItemCategory } from '@dagger-app/shared-types';

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

const createMockWeapon = (name: string, tier = 1): UnifiedItem => ({
  category: 'weapon',
  data: {
    id: `weapon-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    tier,
    weapon_category: 'melee',
    trait: 'Versatile',
    damage: '1d6',
    range: 'Melee',
    burden: null,
    feature: null,
    searchable_text: null,
    embedding: null,
    source_book: 'Core',
    created_at: new Date().toISOString(),
  },
});

const createMockArmor = (name: string, tier = 1): UnifiedItem => ({
  category: 'armor',
  data: {
    id: `armor-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    tier,
    base_thresholds: '3/6/9',
    base_score: 1,
    feature: null,
    searchable_text: null,
    embedding: null,
    source_book: 'Core',
    created_at: new Date().toISOString(),
  },
});

const createMockItem = (name: string, description = 'A useful item'): UnifiedItem => ({
  category: 'item',
  data: {
    id: `item-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    description,
    item_type: 'general',
    searchable_text: null,
    embedding: null,
    source_book: 'Core',
    created_at: new Date().toISOString(),
  },
});

const createMockConsumable = (name: string, description = 'A consumable'): UnifiedItem => ({
  category: 'consumable',
  data: {
    id: `consumable-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    description,
    uses: 1,
    searchable_text: null,
    embedding: null,
    source_book: 'Core',
    created_at: new Date().toISOString(),
  },
});

const createMockSelectedItem = (item: UnifiedItem, quantity = 1): SelectedItem => ({
  item,
  quantity,
});

// =============================================================================
// selectFilteredItems Tests
// =============================================================================

describe('selectFilteredItems', () => {
  const items = [
    createMockWeapon('Iron Sword', 1),
    createMockWeapon('Steel Sword', 2),
    createMockArmor('Leather Armor', 1),
    createMockItem('Health Potion', 'Restores health'),
    createMockConsumable('Fire Bomb', 'Explosive item'),
  ];

  it('returns all items when no filters applied', () => {
    const state = createMockContentState({
      availableItems: items,
      itemFilters: {},
    });
    expect(selectFilteredItems(state)).toHaveLength(5);
  });

  it('filters weapons and armor by tier', () => {
    const state = createMockContentState({
      availableItems: items,
      itemFilters: { tier: 1 },
    });
    const filtered = selectFilteredItems(state);

    // Should include tier 1 weapons/armor, plus all items/consumables (no tier)
    expect(filtered).toHaveLength(4);
    expect(filtered.map((i) => i.data.name)).toContain('Iron Sword');
    expect(filtered.map((i) => i.data.name)).toContain('Leather Armor');
    expect(filtered.map((i) => i.data.name)).toContain('Health Potion');
    expect(filtered.map((i) => i.data.name)).not.toContain('Steel Sword');
  });

  it('filters by category', () => {
    const state = createMockContentState({
      availableItems: items,
      itemFilters: { category: 'weapon' },
    });
    const filtered = selectFilteredItems(state);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((i) => i.data.name)).toContain('Iron Sword');
    expect(filtered.map((i) => i.data.name)).toContain('Steel Sword');
  });

  it('filters by search term in name', () => {
    const state = createMockContentState({
      availableItems: items,
      itemFilters: { searchTerm: 'sword' },
    });
    const filtered = selectFilteredItems(state);

    expect(filtered).toHaveLength(2);
  });

  it('filters by search term in description for items/consumables', () => {
    const state = createMockContentState({
      availableItems: items,
      itemFilters: { searchTerm: 'health' },
    });
    const filtered = selectFilteredItems(state);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].data.name).toBe('Health Potion');
  });

  it('combines multiple filters', () => {
    const state = createMockContentState({
      availableItems: items,
      itemFilters: { tier: 1, category: 'weapon' },
    });
    const filtered = selectFilteredItems(state);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].data.name).toBe('Iron Sword');
  });
});

// =============================================================================
// selectSelectedItemCount Tests
// =============================================================================

describe('selectSelectedItemCount', () => {
  it('returns 0 when no selected items', () => {
    const state = createMockContentState();
    expect(selectSelectedItemCount(state)).toBe(0);
  });

  it('returns total quantity across all selections', () => {
    const state = createMockContentState({
      selectedItems: [
        createMockSelectedItem(createMockWeapon('Sword'), 2),
        createMockSelectedItem(createMockItem('Potion'), 5),
        createMockSelectedItem(createMockArmor('Armor'), 1),
      ],
    });
    expect(selectSelectedItemCount(state)).toBe(8);
  });
});

// =============================================================================
// selectAllItemsConfirmed Tests
// =============================================================================

describe('selectAllItemsConfirmed', () => {
  it('returns false when no selected items', () => {
    const state = createMockContentState();
    expect(selectAllItemsConfirmed(state)).toBe(false);
  });

  it('returns false when not all confirmed', () => {
    const state = createMockContentState({
      selectedItems: [
        createMockSelectedItem(createMockWeapon('Sword')),
        createMockSelectedItem(createMockItem('Potion')),
      ],
      confirmedItemIds: new Set(['weapon:Sword']),
    });
    expect(selectAllItemsConfirmed(state)).toBe(false);
  });

  it('returns true when all confirmed', () => {
    const state = createMockContentState({
      selectedItems: [
        createMockSelectedItem(createMockWeapon('Sword')),
        createMockSelectedItem(createMockItem('Potion')),
      ],
      confirmedItemIds: new Set(['weapon:Sword', 'item:Potion']),
    });
    expect(selectAllItemsConfirmed(state)).toBe(true);
  });
});

// =============================================================================
// selectItemStatus Tests
// =============================================================================

describe('selectItemStatus', () => {
  it('returns correct status when loading', () => {
    const state = createMockContentState({
      itemLoading: true,
      itemError: null,
    });
    const status = selectItemStatus(state);

    expect(status.loading).toBe(true);
    expect(status.error).toBeNull();
  });

  it('returns correct status with error', () => {
    const state = createMockContentState({
      itemLoading: false,
      itemError: 'Failed to load items',
    });
    const status = selectItemStatus(state);

    expect(status.loading).toBe(false);
    expect(status.error).toBe('Failed to load items');
  });
});

// =============================================================================
// selectCanProceedToEchoes Tests
// =============================================================================

describe('selectCanProceedToEchoes', () => {
  it('returns false when no selected items', () => {
    const state = createMockContentState();
    expect(selectCanProceedToEchoes(state)).toBe(false);
  });

  it('returns false when not all confirmed', () => {
    const state = createMockContentState({
      selectedItems: [createMockSelectedItem(createMockWeapon('Sword'))],
      confirmedItemIds: new Set(),
    });
    expect(selectCanProceedToEchoes(state)).toBe(false);
  });

  it('returns true when all confirmed', () => {
    const state = createMockContentState({
      selectedItems: [createMockSelectedItem(createMockWeapon('Sword'))],
      confirmedItemIds: new Set(['weapon:Sword']),
    });
    expect(selectCanProceedToEchoes(state)).toBe(true);
  });
});

// =============================================================================
// selectItemSummary Tests
// =============================================================================

describe('selectItemSummary', () => {
  it('returns correct summary', () => {
    const state = createMockContentState({
      availableItems: [
        createMockWeapon('Sword'),
        createMockWeapon('Axe'),
        createMockItem('Potion'),
      ],
      selectedItems: [
        createMockSelectedItem(createMockWeapon('Sword')),
        createMockSelectedItem(createMockItem('Potion')),
      ],
      confirmedItemIds: new Set(['weapon:Sword']),
    });
    const summary = selectItemSummary(state);

    expect(summary.total).toBe(3);
    expect(summary.selected).toBe(2);
    expect(summary.confirmed).toBe(1);
    expect(summary.pending).toBe(1);
  });
});

// =============================================================================
// selectIsItemSelected / selectSelectedItemByKey Tests
// =============================================================================

describe('selectIsItemSelected', () => {
  it('returns false when item not selected', () => {
    const state = createMockContentState({
      selectedItems: [createMockSelectedItem(createMockWeapon('Sword'))],
    });
    expect(selectIsItemSelected(state, 'Axe', 'weapon')).toBe(false);
  });

  it('returns true when item is selected', () => {
    const state = createMockContentState({
      selectedItems: [createMockSelectedItem(createMockWeapon('Sword'))],
    });
    expect(selectIsItemSelected(state, 'Sword', 'weapon')).toBe(true);
  });

  it('distinguishes items by category', () => {
    const state = createMockContentState({
      selectedItems: [createMockSelectedItem(createMockWeapon('Magic Blade'))],
    });
    expect(selectIsItemSelected(state, 'Magic Blade', 'weapon')).toBe(true);
    expect(selectIsItemSelected(state, 'Magic Blade', 'item')).toBe(false);
  });
});

describe('selectSelectedItemByKey', () => {
  it('returns undefined when not found', () => {
    const state = createMockContentState({
      selectedItems: [createMockSelectedItem(createMockWeapon('Sword'))],
    });
    expect(selectSelectedItemByKey(state, 'Axe', 'weapon')).toBeUndefined();
  });

  it('returns selected item when found', () => {
    const state = createMockContentState({
      selectedItems: [
        createMockSelectedItem(createMockWeapon('Sword'), 3),
        createMockSelectedItem(createMockItem('Potion'), 5),
      ],
    });
    const selected = selectSelectedItemByKey(state, 'Potion', 'item');

    expect(selected).toBeDefined();
    expect(selected?.quantity).toBe(5);
  });
});

// =============================================================================
// Basic Selector Tests
// =============================================================================

describe('basic item selectors', () => {
  it('selectAvailableItems returns available items', () => {
    const items = [createMockWeapon('Sword')];
    const state = createMockContentState({ availableItems: items });

    expect(selectAvailableItems(state)).toBe(items);
  });

  it('selectSelectedItems returns selected items', () => {
    const selected = [createMockSelectedItem(createMockWeapon('Sword'))];
    const state = createMockContentState({ selectedItems: selected });

    expect(selectSelectedItems(state)).toBe(selected);
  });

  it('selectConfirmedItemIds returns confirmed IDs', () => {
    const state = createMockContentState({
      confirmedItemIds: new Set(['weapon:Sword', 'item:Potion']),
    });
    const ids = selectConfirmedItemIds(state);

    expect(ids.has('weapon:Sword')).toBe(true);
    expect(ids.has('item:Potion')).toBe(true);
  });

  it('selectConfirmedItemCount returns count', () => {
    const state = createMockContentState({
      confirmedItemIds: new Set(['a', 'b', 'c']),
    });
    expect(selectConfirmedItemCount(state)).toBe(3);
  });

  it('selectAvailableItemCategories returns categories', () => {
    const categories: ItemCategory[] = ['weapon', 'armor', 'item', 'consumable'];
    const state = createMockContentState({ availableItemCategories: categories });

    expect(selectAvailableItemCategories(state)).toEqual(categories);
  });

  it('selectItemFilters returns filters', () => {
    const filters = { tier: 2, category: 'weapon' as ItemCategory };
    const state = createMockContentState({ itemFilters: filters });

    expect(selectItemFilters(state)).toEqual(filters);
  });
});
