/**
 * Frame Actions Slice Creator
 *
 * Creates frame-related actions for the content store.
 * Handles frame selection, custom frame creation, and confirmation.
 */

import type { DaggerheartFrame, SelectedFrame, FrameDraft } from '@dagger-app/shared-types';
import type { SetState, GetState } from './types';

export interface FrameActions {
  setAvailableFrames: (frames: DaggerheartFrame[]) => void;
  selectFrame: (frame: SelectedFrame) => void;
  setCustomFrameDraft: (draft: Omit<FrameDraft, 'id' | 'isCustom'>) => void;
  confirmFrame: () => void;
  clearFrame: () => void;
  setFramesLoading: (loading: boolean) => void;
  setFramesError: (error: string | null) => void;
}

/**
 * Creates frame-related actions for the content store.
 */
export function createFrameActions(set: SetState, get: GetState): FrameActions {
  return {
    setAvailableFrames: (frames: DaggerheartFrame[]) => {
      set({ availableFrames: frames, framesError: null, framesLoading: false }, false, 'setAvailableFrames');
    },

    selectFrame: (frame: SelectedFrame) => {
      set({ selectedFrame: frame, frameConfirmed: false }, false, 'selectFrame');
    },

    setCustomFrameDraft: (draft: Omit<FrameDraft, 'id' | 'isCustom'>) => {
      const customFrame: FrameDraft = {
        ...draft,
        id: `custom-${Date.now()}`,
        isCustom: true,
      };
      set({ selectedFrame: customFrame, frameConfirmed: false }, false, 'setCustomFrameDraft');
    },

    confirmFrame: () => {
      const { selectedFrame } = get();
      if (selectedFrame) {
        set({ frameConfirmed: true }, false, 'confirmFrame');
      }
    },

    clearFrame: () => {
      set({ selectedFrame: null, frameConfirmed: false }, false, 'clearFrame');
    },

    setFramesLoading: (loading: boolean) => {
      set({ framesLoading: loading }, false, 'setFramesLoading');
    },

    setFramesError: (error: string | null) => {
      set({ framesError: error, framesLoading: false }, false, 'setFramesError');
    },
  };
}
