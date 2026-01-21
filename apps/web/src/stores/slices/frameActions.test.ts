/**
 * Frame Actions Slice Tests
 *
 * Tests for frame-related store actions.
 * Follows TDD approach - test written before bug fix.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { createFrameActions, type FrameActions } from './frameActions';
import type { DaggerheartFrame } from '@dagger-app/shared-types';

// =============================================================================
// Test Helpers
// =============================================================================

interface MockState {
  availableFrames: DaggerheartFrame[];
  selectedFrame: unknown;
  frameConfirmed: boolean;
  framesLoading: boolean;
  framesError: string | null;
}

const createInitialMockState = (): MockState => ({
  availableFrames: [],
  selectedFrame: null,
  frameConfirmed: false,
  framesLoading: false,
  framesError: null,
});

const createMockFrame = (id = 'frame-1', name = 'Test Frame'): DaggerheartFrame => ({
  id,
  name,
  description: 'A test frame',
  source_book: 'Core Rulebook',
  themes: ['mystery', 'adventure'],
  typical_adversaries: ['beasts'],
  lore: 'Test lore',
  embedding: null,
  created_at: '2024-01-01T00:00:00.000Z',
});

// =============================================================================
// Tests
// =============================================================================

describe('frameActions', () => {
  let mockState: MockState;
  let mockSet: Mock;
  let mockGet: Mock;
  let actions: FrameActions;

  beforeEach(() => {
    mockState = createInitialMockState();

    mockSet = vi.fn((updater) => {
      if (typeof updater === 'function') {
        Object.assign(mockState, updater(mockState));
      } else {
        Object.assign(mockState, updater);
      }
    });

    mockGet = vi.fn(() => mockState);

    actions = createFrameActions(mockSet, mockGet);
  });

  describe('setAvailableFrames', () => {
    it('sets availableFrames with provided frames', () => {
      const frames = [createMockFrame('frame-1', 'Frame One')];

      actions.setAvailableFrames(frames);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ availableFrames: frames }),
        false,
        'setAvailableFrames'
      );
    });

    it('clears framesError when setting frames', () => {
      actions.setAvailableFrames([createMockFrame()]);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ framesError: null }),
        false,
        'setAvailableFrames'
      );
    });

    /**
     * BUG FIX TEST: Issue #54
     *
     * This test verifies that setAvailableFrames resets framesLoading to false.
     * Without this fix, the loading spinner shows forever on the frame phase.
     */
    it('resets framesLoading to false when frames are set', () => {
      // Simulate loading state before frames arrive
      mockState.framesLoading = true;

      actions.setAvailableFrames([createMockFrame()]);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ framesLoading: false }),
        false,
        'setAvailableFrames'
      );
    });
  });

  describe('setFramesLoading', () => {
    it('sets framesLoading to true', () => {
      actions.setFramesLoading(true);

      expect(mockSet).toHaveBeenCalledWith(
        { framesLoading: true },
        false,
        'setFramesLoading'
      );
    });

    it('sets framesLoading to false', () => {
      actions.setFramesLoading(false);

      expect(mockSet).toHaveBeenCalledWith(
        { framesLoading: false },
        false,
        'setFramesLoading'
      );
    });
  });

  describe('setFramesError', () => {
    it('sets framesError and resets framesLoading', () => {
      actions.setFramesError('Failed to load frames');

      expect(mockSet).toHaveBeenCalledWith(
        { framesError: 'Failed to load frames', framesLoading: false },
        false,
        'setFramesError'
      );
    });

    it('clears framesError when passed null', () => {
      actions.setFramesError(null);

      expect(mockSet).toHaveBeenCalledWith(
        { framesError: null, framesLoading: false },
        false,
        'setFramesError'
      );
    });
  });

  describe('selectFrame', () => {
    it('sets selectedFrame and resets frameConfirmed', () => {
      const frame = createMockFrame();

      actions.selectFrame(frame);

      expect(mockSet).toHaveBeenCalledWith(
        { selectedFrame: frame, frameConfirmed: false },
        false,
        'selectFrame'
      );
    });
  });

  describe('confirmFrame', () => {
    it('sets frameConfirmed to true when a frame is selected', () => {
      mockState.selectedFrame = createMockFrame();

      actions.confirmFrame();

      expect(mockSet).toHaveBeenCalledWith(
        { frameConfirmed: true },
        false,
        'confirmFrame'
      );
    });

    it('does not set frameConfirmed when no frame is selected', () => {
      mockState.selectedFrame = null;

      actions.confirmFrame();

      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('clearFrame', () => {
    it('clears selectedFrame and resets frameConfirmed', () => {
      actions.clearFrame();

      expect(mockSet).toHaveBeenCalledWith(
        { selectedFrame: null, frameConfirmed: false },
        false,
        'clearFrame'
      );
    });
  });

  describe('setCustomFrameDraft', () => {
    it('creates a custom frame with generated id and isCustom flag', () => {
      const draft = {
        name: 'My Custom Frame',
        description: 'A custom adventure',
        themes: ['heroism'],
        typicalAdversaries: [],
        lore: 'Custom lore',
      };

      actions.setCustomFrameDraft(draft);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedFrame: expect.objectContaining({
            ...draft,
            id: expect.stringMatching(/^custom-\d+$/),
            isCustom: true,
          }),
          frameConfirmed: false,
        }),
        false,
        'setCustomFrameDraft'
      );
    });
  });
});
