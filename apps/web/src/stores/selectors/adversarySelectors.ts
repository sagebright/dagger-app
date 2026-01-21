/**
 * Adversary Selectors
 *
 * Pure selector functions for deriving adversary-related state from ContentState.
 * These selectors follow the pattern: (state: ContentState) => T
 */

import type { ContentState } from '../contentStore';
import type {
  DaggerheartAdversary,
  SelectedAdversary,
  AdversaryFilterOptions,
} from '@dagger-app/shared-types';

/**
 * Get all available adversaries
 */
export const selectAvailableAdversaries = (state: ContentState): DaggerheartAdversary[] =>
  state.availableAdversaries;

/**
 * Get selected adversaries
 */
export const selectSelectedAdversaries = (state: ContentState): SelectedAdversary[] =>
  state.selectedAdversaries;

/**
 * Get confirmed adversary IDs
 */
export const selectConfirmedAdversaryIds = (state: ContentState): Set<string> =>
  state.confirmedAdversaryIds;

/**
 * Get filtered adversaries based on current filters
 */
export const selectFilteredAdversaries = (state: ContentState): DaggerheartAdversary[] => {
  const { availableAdversaries, adversaryFilters } = state;
  let filteredAdversaries = availableAdversaries;

  // Filter by tier
  if (adversaryFilters.tier !== undefined) {
    filteredAdversaries = filteredAdversaries.filter((a) => a.tier === adversaryFilters.tier);
  }

  // Filter by type
  if (adversaryFilters.type) {
    filteredAdversaries = filteredAdversaries.filter(
      (a) => a.type?.toLowerCase() === adversaryFilters.type?.toLowerCase()
    );
  }

  // Filter by search term
  if (adversaryFilters.searchTerm) {
    const term = adversaryFilters.searchTerm.toLowerCase();
    filteredAdversaries = filteredAdversaries.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.type?.toLowerCase().includes(term)
    );
  }

  return filteredAdversaries;
};

/**
 * Get count of selected adversaries
 */
export const selectSelectedAdversaryCount = (state: ContentState): number =>
  state.selectedAdversaries.reduce((sum, sa) => sum + sa.quantity, 0);

/**
 * Get count of confirmed adversaries
 */
export const selectConfirmedAdversaryCount = (state: ContentState): number =>
  state.confirmedAdversaryIds.size;

/**
 * Check if all selected adversaries are confirmed
 */
export const selectAllAdversariesConfirmed = (state: ContentState): boolean =>
  state.selectedAdversaries.length > 0 &&
  state.confirmedAdversaryIds.size === state.selectedAdversaries.length;

/**
 * Get adversary loading/error status
 */
export const selectAdversaryStatus = (
  state: ContentState
): { loading: boolean; error: string | null } => ({
  loading: state.adversaryLoading,
  error: state.adversaryError,
});

/**
 * Check if user can proceed to items phase
 */
export const selectCanProceedToItems = (state: ContentState): boolean =>
  state.selectedAdversaries.length > 0 &&
  state.confirmedAdversaryIds.size === state.selectedAdversaries.length;

/**
 * Get adversary summary for display
 */
export const selectAdversarySummary = (
  state: ContentState
): { total: number; selected: number; confirmed: number; pending: number } => ({
  total: state.availableAdversaries.length,
  selected: state.selectedAdversaries.length,
  confirmed: state.confirmedAdversaryIds.size,
  pending: state.selectedAdversaries.length - state.confirmedAdversaryIds.size,
});

/**
 * Get available adversary types for filtering
 */
export const selectAvailableAdversaryTypes = (state: ContentState): string[] =>
  state.availableAdversaryTypes;

/**
 * Get current adversary filters
 */
export const selectAdversaryFilters = (state: ContentState): AdversaryFilterOptions =>
  state.adversaryFilters;

/**
 * Check if an adversary is selected
 */
export const selectIsAdversarySelected = (
  state: ContentState,
  adversaryName: string
): boolean => state.selectedAdversaries.some((sa) => sa.adversary.name === adversaryName);

/**
 * Get selected adversary by name
 */
export const selectSelectedAdversaryByName = (
  state: ContentState,
  adversaryName: string
): SelectedAdversary | undefined =>
  state.selectedAdversaries.find((sa) => sa.adversary.name === adversaryName);
