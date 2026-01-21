/**
 * Scene Selectors
 *
 * Pure selector functions for deriving scene-related state from ContentState.
 * These selectors follow the pattern: (state: ContentState) => T
 */

import type { ContentState } from '../contentStore';
import type { Scene } from '@dagger-app/shared-types';

/**
 * Get all scenes
 */
export const selectScenes = (state: ContentState): Scene[] => state.scenes;

/**
 * Get current scene
 */
export const selectCurrentScene = (state: ContentState): Scene | null =>
  state.scenes.find((s) => s.brief.id === state.currentSceneId) ?? null;

/**
 * Get current scene ID
 */
export const selectCurrentSceneId = (state: ContentState): string | null =>
  state.currentSceneId;

/**
 * Get scene by ID
 */
export const selectSceneById = (state: ContentState, sceneId: string): Scene | undefined =>
  state.scenes.find((s) => s.brief.id === sceneId);

/**
 * Get count of confirmed scenes
 */
export const selectConfirmedSceneCount = (state: ContentState): number =>
  state.scenes.filter((s) => s.status === 'confirmed').length;

/**
 * Check if all scenes are confirmed
 */
export const selectAllScenesConfirmed = (state: ContentState): boolean =>
  state.scenes.length > 0 && state.scenes.every((s) => s.status === 'confirmed');

/**
 * Get scene loading/error status
 */
export const selectSceneStatus = (
  state: ContentState
): { loading: boolean; error: string | null; streamingContent: string | null } => ({
  loading: state.sceneLoading,
  error: state.sceneError,
  streamingContent: state.sceneStreamingContent,
});

/**
 * Check if user can proceed to NPC phase
 */
export const selectCanProceedToNPCs = (state: ContentState): boolean =>
  state.scenes.length > 0 && state.scenes.every((s) => s.status === 'confirmed');

/**
 * Get navigation state for current scene
 */
export const selectSceneNavigation = (
  state: ContentState
): { canGoPrevious: boolean; canGoNext: boolean; currentIndex: number } => {
  const currentIndex = state.scenes.findIndex((s) => s.brief.id === state.currentSceneId);
  if (currentIndex === -1) {
    return { canGoPrevious: false, canGoNext: false, currentIndex: -1 };
  }

  const canGoPrevious = currentIndex > 0;
  const canGoNext =
    currentIndex < state.scenes.length - 1 &&
    (state.scenes[currentIndex].status === 'confirmed' ||
      state.scenes[currentIndex].status === 'draft');

  return { canGoPrevious, canGoNext, currentIndex };
};
