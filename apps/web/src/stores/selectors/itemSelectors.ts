/**
 * Item Selectors
 *
 * Pure selector functions for deriving item-related state from ContentState.
 * These selectors follow the pattern: (state: ContentState) => T
 */

import type { ContentState } from '../contentStore';
import type {
  UnifiedItem,
  SelectedItem,
  ItemFilterOptions,
  ItemCategory,
} from '@dagger-app/shared-types';

/**
 * Get all available items
 */
export const selectAvailableItems = (state: ContentState): UnifiedItem[] =>
  state.availableItems;

/**
 * Get selected items
 */
export const selectSelectedItems = (state: ContentState): SelectedItem[] =>
  state.selectedItems;

/**
 * Get confirmed item IDs
 */
export const selectConfirmedItemIds = (state: ContentState): Set<string> =>
  state.confirmedItemIds;

/**
 * Get filtered items based on current filters
 */
export const selectFilteredItems = (state: ContentState): UnifiedItem[] => {
  const { availableItems, itemFilters } = state;
  let filteredItems = availableItems;

  // Filter by tier (only for weapons/armor)
  if (itemFilters.tier !== undefined) {
    filteredItems = filteredItems.filter((item) => {
      if (item.category === 'weapon') {
        return item.data.tier === itemFilters.tier;
      }
      if (item.category === 'armor') {
        return item.data.tier === itemFilters.tier;
      }
      // Items and consumables don't have tiers, include them all
      return true;
    });
  }

  // Filter by category
  if (itemFilters.category) {
    filteredItems = filteredItems.filter((item) => item.category === itemFilters.category);
  }

  // Filter by search term
  if (itemFilters.searchTerm) {
    const term = itemFilters.searchTerm.toLowerCase();
    filteredItems = filteredItems.filter((item) => {
      if (item.data.name.toLowerCase().includes(term)) return true;
      // Check description for items and consumables
      if ((item.category === 'item' || item.category === 'consumable') &&
          item.data.description?.toLowerCase().includes(term)) {
        return true;
      }
      // Check weapon category for weapons
      if (item.category === 'weapon' &&
          item.data.weapon_category?.toLowerCase().includes(term)) {
        return true;
      }
      return false;
    });
  }

  return filteredItems;
};

/**
 * Get count of selected items
 */
export const selectSelectedItemCount = (state: ContentState): number =>
  state.selectedItems.reduce((sum, si) => sum + si.quantity, 0);

/**
 * Get count of confirmed items
 */
export const selectConfirmedItemCount = (state: ContentState): number =>
  state.confirmedItemIds.size;

/**
 * Check if all selected items are confirmed
 */
export const selectAllItemsConfirmed = (state: ContentState): boolean =>
  state.selectedItems.length > 0 &&
  state.confirmedItemIds.size === state.selectedItems.length;

/**
 * Get item loading/error status
 */
export const selectItemStatus = (
  state: ContentState
): { loading: boolean; error: string | null } => ({
  loading: state.itemLoading,
  error: state.itemError,
});

/**
 * Check if user can proceed to echoes phase
 */
export const selectCanProceedToEchoes = (state: ContentState): boolean =>
  state.selectedItems.length > 0 &&
  state.confirmedItemIds.size === state.selectedItems.length;

/**
 * Get item summary for display
 */
export const selectItemSummary = (
  state: ContentState
): { total: number; selected: number; confirmed: number; pending: number } => ({
  total: state.availableItems.length,
  selected: state.selectedItems.length,
  confirmed: state.confirmedItemIds.size,
  pending: state.selectedItems.length - state.confirmedItemIds.size,
});

/**
 * Get available item categories for filtering
 */
export const selectAvailableItemCategories = (state: ContentState): ItemCategory[] =>
  state.availableItemCategories;

/**
 * Get current item filters
 */
export const selectItemFilters = (state: ContentState): ItemFilterOptions =>
  state.itemFilters;

/**
 * Check if an item is selected
 */
export const selectIsItemSelected = (
  state: ContentState,
  itemName: string,
  category: ItemCategory
): boolean =>
  state.selectedItems.some(
    (si) => si.item.data.name === itemName && si.item.category === category
  );

/**
 * Get selected item by name and category
 */
export const selectSelectedItemByKey = (
  state: ContentState,
  itemName: string,
  category: ItemCategory
): SelectedItem | undefined =>
  state.selectedItems.find(
    (si) => si.item.data.name === itemName && si.item.category === category
  );
