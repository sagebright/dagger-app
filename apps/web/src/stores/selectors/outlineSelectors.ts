/**
 * Outline Selectors
 *
 * Pure selector functions for deriving outline-related state from ContentState.
 * These selectors follow the pattern: (state: ContentState) => T
 */

import type { ContentState } from '../contentStore';
import type { SceneBrief } from '@dagger-app/shared-types';
import { isOutlineComplete } from '@dagger-app/shared-types';

/**
 * Check if an outline exists
 */
export const selectHasOutline = (state: ContentState): boolean =>
  state.currentOutline !== null;

/**
 * Check if the outline is confirmed
 */
export const selectIsOutlineConfirmed = (state: ContentState): boolean =>
  state.outlineConfirmed;

/**
 * Get outline title (or null)
 */
export const selectOutlineTitle = (state: ContentState): string | null =>
  state.currentOutline?.title ?? null;

/**
 * Get scene count from outline
 */
export const selectSceneCount = (state: ContentState): number =>
  state.currentOutline?.scenes.length ?? 0;

/**
 * Empty array constant to avoid creating new references
 */
const EMPTY_SCENE_BRIEFS: SceneBrief[] = [];

/**
 * Get all scene briefs
 */
export const selectSceneBriefs = (state: ContentState): SceneBrief[] =>
  state.currentOutline?.scenes ?? EMPTY_SCENE_BRIEFS;

/**
 * Get a specific scene brief by ID
 */
export const selectSceneBriefById = (
  state: ContentState,
  sceneId: string
): SceneBrief | undefined =>
  state.currentOutline?.scenes.find((s) => s.id === sceneId);

/**
 * Check if outline is complete (has all expected scenes)
 */
export const selectIsOutlineComplete = (
  state: ContentState,
  expectedSceneCount: number
): boolean =>
  state.currentOutline !== null && isOutlineComplete(state.currentOutline, expectedSceneCount);

/**
 * Check if user can proceed to scene editor
 */
export const selectCanProceedToScenes = (state: ContentState): boolean =>
  state.currentOutline !== null && state.outlineConfirmed;

/**
 * Get outline loading status
 */
export const selectOutlineStatus = (
  state: ContentState
): { loading: boolean; error: string | null; hasOutline: boolean } => ({
  loading: state.outlineLoading,
  error: state.outlineError,
  hasOutline: state.currentOutline !== null,
});

/**
 * Get outline summary for display
 */
export const selectOutlineSummary = (
  state: ContentState
): { title: string; sceneCount: number; isConfirmed: boolean } | null => {
  if (!state.currentOutline) return null;
  return {
    title: state.currentOutline.title,
    sceneCount: state.currentOutline.scenes.length,
    isConfirmed: state.outlineConfirmed,
  };
};
