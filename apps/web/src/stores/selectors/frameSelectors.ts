/**
 * Frame Selectors
 *
 * Pure selector functions for deriving frame-related state from ContentState.
 * These selectors follow the pattern: (state: ContentState) => T
 */

import type { ContentState } from '../contentStore';
import { isCustomFrame } from '@dagger-app/shared-types';

/**
 * Check if a frame is selected
 */
export const selectHasSelectedFrame = (state: ContentState): boolean =>
  state.selectedFrame !== null;

/**
 * Check if the selected frame is confirmed
 */
export const selectIsFrameConfirmed = (state: ContentState): boolean => state.frameConfirmed;

/**
 * Check if the selected frame is a custom frame
 */
export const selectIsCustomFrame = (state: ContentState): boolean =>
  state.selectedFrame !== null && isCustomFrame(state.selectedFrame);

/**
 * Get the selected frame name (or null)
 */
export const selectFrameName = (state: ContentState): string | null =>
  state.selectedFrame?.name ?? null;

/**
 * Get frame themes (handles both DB frames and custom frames)
 */
export const selectFrameThemes = (state: ContentState): string[] => {
  if (!state.selectedFrame) return [];
  return state.selectedFrame.themes ?? [];
};

/**
 * Check if user can proceed to outline phase
 */
export const selectCanProceedToOutline = (state: ContentState): boolean =>
  state.selectedFrame !== null && state.frameConfirmed;

/**
 * Get frame loading status
 */
export const selectFramesStatus = (
  state: ContentState
): { loading: boolean; error: string | null; hasFrames: boolean } => ({
  loading: state.framesLoading,
  error: state.framesError,
  hasFrames: state.availableFrames.length > 0,
});
