/**
 * Echo Selectors
 *
 * Pure selector functions for deriving echo-related state from ContentState.
 * These selectors follow the pattern: (state: ContentState) => T
 */

import type { ContentState } from '../contentStore';
import type { Echo, EchoCategory } from '@dagger-app/shared-types';

/**
 * Get all echoes
 */
export const selectEchoes = (state: ContentState): Echo[] => state.echoes;

/**
 * Get echoes by category
 */
export const selectEchoesByCategory = (
  state: ContentState,
  category: EchoCategory
): Echo[] => state.echoes.filter((e) => e.category === category);

/**
 * Get confirmed echo IDs
 */
export const selectConfirmedEchoIds = (state: ContentState): Set<string> =>
  state.confirmedEchoIds;

/**
 * Get echo by ID
 */
export const selectEchoById = (state: ContentState, echoId: string): Echo | undefined =>
  state.echoes.find((e) => e.id === echoId);

/**
 * Get count of confirmed echoes
 */
export const selectConfirmedEchoCount = (state: ContentState): number =>
  state.confirmedEchoIds.size;

/**
 * Check if all echoes are confirmed
 */
export const selectAllEchoesConfirmed = (state: ContentState): boolean =>
  state.echoes.length > 0 && state.confirmedEchoIds.size === state.echoes.length;

/**
 * Get echo loading/error status
 */
export const selectEchoStatus = (
  state: ContentState
): {
  loading: boolean;
  error: string | null;
  streamingContent: string | null;
  activeCategory: EchoCategory;
} => ({
  loading: state.echoLoading,
  error: state.echoError,
  streamingContent: state.echoStreamingContent,
  activeCategory: state.activeEchoCategory,
});

/**
 * Get echo summary for display
 */
export const selectEchoSummary = (
  state: ContentState
): { total: number; confirmed: number; pending: number; byCategory: Record<EchoCategory, number> } => {
  const byCategory: Record<EchoCategory, number> = {
    complications: 0,
    rumors: 0,
    discoveries: 0,
    intrusions: 0,
    wonders: 0,
  };

  state.echoes.forEach((echo) => {
    byCategory[echo.category]++;
  });

  return {
    total: state.echoes.length,
    confirmed: state.confirmedEchoIds.size,
    pending: state.echoes.length - state.confirmedEchoIds.size,
    byCategory,
  };
};

/**
 * Get active echo category
 */
export const selectActiveEchoCategory = (state: ContentState): EchoCategory =>
  state.activeEchoCategory;

/**
 * Check if user can proceed to complete phase
 */
export const selectCanProceedToComplete = (state: ContentState): boolean =>
  state.echoes.length > 0 && state.confirmedEchoIds.size === state.echoes.length;
