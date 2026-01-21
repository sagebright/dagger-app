/**
 * Content Store - Frame, Outline, Scene, and NPC state management
 *
 * Manages content generation state for Phase 3+ including:
 * - Frame selection/creation
 * - Outline generation with feedback loop
 * - (Future: Scene drafts)
 * - (Future: NPC compilation)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  DaggerheartFrame,
  SelectedFrame,
  FrameDraft,
  Outline,
  SceneBrief,
  Scene,
  SceneDraft,
  SceneStatus,
} from '@dagger-app/shared-types';
import { isCustomFrame, isOutlineComplete } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface ContentState {
  // Frame state
  /** All available frames from Supabase */
  availableFrames: DaggerheartFrame[];
  /** Currently selected or created frame */
  selectedFrame: SelectedFrame | null;
  /** Whether the selected frame has been confirmed */
  frameConfirmed: boolean;
  /** Loading state for frames */
  framesLoading: boolean;
  /** Error message if frame loading failed */
  framesError: string | null;

  // Outline state
  /** Current outline draft or confirmed outline */
  currentOutline: Outline | null;
  /** Loading state for outline generation */
  outlineLoading: boolean;
  /** Error message if outline generation failed */
  outlineError: string | null;
  /** Whether the outline has been confirmed */
  outlineConfirmed: boolean;

  // Scene state (Phase 3.3)
  /** All scenes from confirmed outline */
  scenes: Scene[];
  /** Currently active scene ID */
  currentSceneId: string | null;
  /** Loading state for scene generation */
  sceneLoading: boolean;
  /** Error message if scene generation failed */
  sceneError: string | null;
  /** Streaming content during generation */
  sceneStreamingContent: string | null;

  // Actions - Frame
  setAvailableFrames: (frames: DaggerheartFrame[]) => void;
  selectFrame: (frame: SelectedFrame) => void;
  setCustomFrameDraft: (draft: Omit<FrameDraft, 'id' | 'isCustom'>) => void;
  confirmFrame: () => void;
  clearFrame: () => void;
  setFramesLoading: (loading: boolean) => void;
  setFramesError: (error: string | null) => void;

  // Actions - Outline
  setOutline: (outline: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>) => void;
  updateOutline: (outline: Outline) => void;
  updateSceneBrief: (sceneId: string, updates: Partial<Omit<SceneBrief, 'id' | 'sceneNumber'>>) => void;
  confirmOutline: () => void;
  clearOutline: () => void;
  setOutlineLoading: (loading: boolean) => void;
  setOutlineError: (error: string | null) => void;

  // Actions - Scene (Phase 3.3)
  initializeScenesFromOutline: () => void;
  setCurrentScene: (sceneId: string) => void;
  setSceneStatus: (sceneId: string, status: SceneStatus) => void;
  setSceneDraft: (sceneId: string, draft: SceneDraft) => void;
  confirmScene: (sceneId: string) => void;
  setSceneLoading: (loading: boolean) => void;
  setSceneError: (error: string | null) => void;
  setSceneStreamingContent: (content: string | null) => void;
  appendSceneStreamingContent: (chunk: string) => void;
  navigateToNextScene: () => void;
  navigateToPreviousScene: () => void;
  clearScenes: () => void;

  // Reset
  resetContent: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialContentState = {
  availableFrames: [] as DaggerheartFrame[],
  selectedFrame: null as SelectedFrame | null,
  frameConfirmed: false,
  framesLoading: false,
  framesError: null as string | null,
  currentOutline: null as Outline | null,
  outlineLoading: false,
  outlineError: null as string | null,
  outlineConfirmed: false,
  // Scene state
  scenes: [] as Scene[],
  currentSceneId: null as string | null,
  sceneLoading: false,
  sceneError: null as string | null,
  sceneStreamingContent: null as string | null,
};

// =============================================================================
// Store
// =============================================================================

export const useContentStore = create<ContentState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialContentState,

        /**
         * Set available frames from Supabase
         */
        setAvailableFrames: (frames: DaggerheartFrame[]) => {
          set({ availableFrames: frames, framesError: null }, false, 'setAvailableFrames');
        },

        /**
         * Select a frame (existing or custom)
         */
        selectFrame: (frame: SelectedFrame) => {
          set({ selectedFrame: frame, frameConfirmed: false }, false, 'selectFrame');
        },

        /**
         * Create a custom frame from a draft
         */
        setCustomFrameDraft: (draft: Omit<FrameDraft, 'id' | 'isCustom'>) => {
          const customFrame: FrameDraft = {
            ...draft,
            id: `custom-${Date.now()}`,
            isCustom: true,
          };
          set({ selectedFrame: customFrame, frameConfirmed: false }, false, 'setCustomFrameDraft');
        },

        /**
         * Confirm the selected frame
         */
        confirmFrame: () => {
          const { selectedFrame } = get();
          if (selectedFrame) {
            set({ frameConfirmed: true }, false, 'confirmFrame');
          }
        },

        /**
         * Clear the selected frame
         */
        clearFrame: () => {
          set({ selectedFrame: null, frameConfirmed: false }, false, 'clearFrame');
        },

        /**
         * Set frames loading state
         */
        setFramesLoading: (loading: boolean) => {
          set({ framesLoading: loading }, false, 'setFramesLoading');
        },

        /**
         * Set frames error state
         */
        setFramesError: (error: string | null) => {
          set({ framesError: error, framesLoading: false }, false, 'setFramesError');
        },

        // =====================================================================
        // Outline Actions
        // =====================================================================

        /**
         * Set a new outline from generated draft
         */
        setOutline: (outline: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>) => {
          const now = new Date().toISOString();
          const fullOutline: Outline = {
            ...outline,
            id: `outline-${Date.now()}`,
            isConfirmed: false,
            createdAt: now,
            updatedAt: now,
            scenes: outline.scenes.map((scene, index) => ({
              ...scene,
              id: scene.id || `scene-${Date.now()}-${index}`,
            })),
          };
          set(
            { currentOutline: fullOutline, outlineConfirmed: false, outlineError: null },
            false,
            'setOutline'
          );
        },

        /**
         * Update an existing outline
         */
        updateOutline: (outline: Outline) => {
          const updatedOutline: Outline = {
            ...outline,
            updatedAt: new Date().toISOString(),
          };
          set({ currentOutline: updatedOutline }, false, 'updateOutline');
        },

        /**
         * Update a specific scene brief
         */
        updateSceneBrief: (
          sceneId: string,
          updates: Partial<Omit<SceneBrief, 'id' | 'sceneNumber'>>
        ) => {
          const { currentOutline } = get();
          if (!currentOutline) return;

          const updatedScenes = currentOutline.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, ...updates } : scene
          );

          const updatedOutline: Outline = {
            ...currentOutline,
            scenes: updatedScenes,
            updatedAt: new Date().toISOString(),
          };

          set({ currentOutline: updatedOutline }, false, 'updateSceneBrief');
        },

        /**
         * Confirm the current outline
         */
        confirmOutline: () => {
          const { currentOutline } = get();
          if (currentOutline) {
            const confirmedOutline: Outline = {
              ...currentOutline,
              isConfirmed: true,
              updatedAt: new Date().toISOString(),
            };
            set(
              { currentOutline: confirmedOutline, outlineConfirmed: true },
              false,
              'confirmOutline'
            );
          }
        },

        /**
         * Clear the current outline
         */
        clearOutline: () => {
          set(
            { currentOutline: null, outlineConfirmed: false, outlineError: null },
            false,
            'clearOutline'
          );
        },

        /**
         * Set outline loading state
         */
        setOutlineLoading: (loading: boolean) => {
          set({ outlineLoading: loading }, false, 'setOutlineLoading');
        },

        /**
         * Set outline error state
         */
        setOutlineError: (error: string | null) => {
          set({ outlineError: error, outlineLoading: false }, false, 'setOutlineError');
        },

        // =====================================================================
        // Scene Actions (Phase 3.3)
        // =====================================================================

        /**
         * Initialize scenes from confirmed outline
         */
        initializeScenesFromOutline: () => {
          const { currentOutline } = get();
          if (!currentOutline) return;

          const scenes: Scene[] = currentOutline.scenes.map((brief) => ({
            brief,
            draft: null,
            status: 'pending' as SceneStatus,
          }));

          const firstSceneId = scenes[0]?.brief.id ?? null;

          set(
            {
              scenes,
              currentSceneId: firstSceneId,
              sceneError: null,
              sceneStreamingContent: null,
            },
            false,
            'initializeScenesFromOutline'
          );
        },

        /**
         * Set current active scene
         */
        setCurrentScene: (sceneId: string) => {
          set({ currentSceneId: sceneId, sceneError: null }, false, 'setCurrentScene');
        },

        /**
         * Set scene status
         */
        setSceneStatus: (sceneId: string, status: SceneStatus) => {
          const { scenes } = get();
          const updatedScenes = scenes.map((scene) =>
            scene.brief.id === sceneId ? { ...scene, status } : scene
          );
          set({ scenes: updatedScenes }, false, 'setSceneStatus');
        },

        /**
         * Set scene draft
         */
        setSceneDraft: (sceneId: string, draft: SceneDraft) => {
          const { scenes } = get();
          const updatedScenes = scenes.map((scene) =>
            scene.brief.id === sceneId
              ? { ...scene, draft, status: 'draft' as SceneStatus }
              : scene
          );
          set(
            { scenes: updatedScenes, sceneLoading: false, sceneStreamingContent: null },
            false,
            'setSceneDraft'
          );
        },

        /**
         * Confirm a scene
         */
        confirmScene: (sceneId: string) => {
          const { scenes } = get();
          const updatedScenes = scenes.map((scene) =>
            scene.brief.id === sceneId
              ? { ...scene, status: 'confirmed' as SceneStatus, confirmedAt: new Date().toISOString() }
              : scene
          );
          set({ scenes: updatedScenes }, false, 'confirmScene');
        },

        /**
         * Set scene loading state
         */
        setSceneLoading: (loading: boolean) => {
          set({ sceneLoading: loading }, false, 'setSceneLoading');
        },

        /**
         * Set scene error state
         */
        setSceneError: (error: string | null) => {
          set({ sceneError: error, sceneLoading: false }, false, 'setSceneError');
        },

        /**
         * Set scene streaming content
         */
        setSceneStreamingContent: (content: string | null) => {
          set({ sceneStreamingContent: content }, false, 'setSceneStreamingContent');
        },

        /**
         * Append to scene streaming content
         */
        appendSceneStreamingContent: (chunk: string) => {
          const { sceneStreamingContent } = get();
          set(
            { sceneStreamingContent: (sceneStreamingContent || '') + chunk },
            false,
            'appendSceneStreamingContent'
          );
        },

        /**
         * Navigate to next scene
         */
        navigateToNextScene: () => {
          const { scenes, currentSceneId } = get();
          const currentIndex = scenes.findIndex((s) => s.brief.id === currentSceneId);
          if (currentIndex < scenes.length - 1) {
            const nextScene = scenes[currentIndex + 1];
            set(
              { currentSceneId: nextScene.brief.id, sceneError: null, sceneStreamingContent: null },
              false,
              'navigateToNextScene'
            );
          }
        },

        /**
         * Navigate to previous scene
         */
        navigateToPreviousScene: () => {
          const { scenes, currentSceneId } = get();
          const currentIndex = scenes.findIndex((s) => s.brief.id === currentSceneId);
          if (currentIndex > 0) {
            const prevScene = scenes[currentIndex - 1];
            set(
              { currentSceneId: prevScene.brief.id, sceneError: null, sceneStreamingContent: null },
              false,
              'navigateToPreviousScene'
            );
          }
        },

        /**
         * Clear all scenes
         */
        clearScenes: () => {
          set(
            {
              scenes: [],
              currentSceneId: null,
              sceneLoading: false,
              sceneError: null,
              sceneStreamingContent: null,
            },
            false,
            'clearScenes'
          );
        },

        /**
         * Reset all content state
         */
        resetContent: () => {
          set(initialContentState, false, 'resetContent');
        },
      }),
      {
        name: 'dagger-content-storage',
        // Persist frame, outline, and scene state (not available frames from DB)
        partialize: (state) => ({
          selectedFrame: state.selectedFrame,
          frameConfirmed: state.frameConfirmed,
          currentOutline: state.currentOutline,
          outlineConfirmed: state.outlineConfirmed,
          scenes: state.scenes,
          currentSceneId: state.currentSceneId,
        }),
      }
    ),
    { name: 'ContentStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

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

// =============================================================================
// Outline Selectors
// =============================================================================

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
 * Get all scene briefs
 */
export const selectSceneBriefs = (state: ContentState): SceneBrief[] =>
  state.currentOutline?.scenes ?? [];

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

// =============================================================================
// Scene Selectors (Phase 3.3)
// =============================================================================

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
