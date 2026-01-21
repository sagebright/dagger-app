/**
 * OutlinePanel Component Tests
 *
 * Tests for outline generation and display panel
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutlinePanel } from './OutlinePanel';
import { useContentStore } from '../../stores/contentStore';
import type { Outline, SceneBrief } from '@dagger-app/shared-types';

// Mock the store with named selector objects for identification
vi.mock('../../stores/contentStore', () => {
  // Create selector identifiers inside the factory
  const selectHasOutline = { __selector: 'hasOutline' };
  const selectIsOutlineConfirmed = { __selector: 'isOutlineConfirmed' };
  const selectCanProceedToScenes = { __selector: 'canProceedToScenes' };
  const selectSceneBriefs = { __selector: 'sceneBriefs' };
  const selectOutlineTitle = { __selector: 'outlineTitle' };
  const selectOutlineStatus = { __selector: 'outlineStatus' };

  return {
    useContentStore: vi.fn(),
    selectHasOutline,
    selectIsOutlineConfirmed,
    selectCanProceedToScenes,
    selectSceneBriefs,
    selectOutlineTitle,
    selectOutlineStatus,
  };
});

const mockScenes: SceneBrief[] = [
  {
    id: 'scene-1',
    sceneNumber: 1,
    title: 'The Dark Discovery',
    description: 'The party discovers a hidden entrance',
    keyElements: ['Perception check', 'Hidden door'],
    location: 'Ancient ruins',
    characters: ['Local guide'],
    sceneType: 'exploration',
  },
  {
    id: 'scene-2',
    sceneNumber: 2,
    title: 'Confrontation at Dawn',
    description: 'A battle breaks out with cultists',
    keyElements: ['Initiative check', 'Tactical positioning'],
    location: 'Temple courtyard',
    characters: ['Cultist leader', 'Acolytes'],
    sceneType: 'combat',
  },
  {
    id: 'scene-3',
    sceneNumber: 3,
    title: 'The Final Revelation',
    description: 'The truth is finally revealed',
    keyElements: ['Plot twist', 'Emotional moment'],
    location: 'Inner sanctum',
    characters: ['Hidden ally'],
    sceneType: 'revelation',
  },
];

const mockOutline: Outline = {
  id: 'outline-1',
  title: 'The Shadow Keep',
  summary: 'An adventure for 4 experienced heroes set in the haunted castle.',
  scenes: mockScenes,
  isConfirmed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('OutlinePanel', () => {
  const mockOnGenerateOutline = vi.fn();
  const mockOnContinueToScenes = vi.fn();
  const mockOnBackToFrame = vi.fn();
  const mockConfirmOutline = vi.fn();
  const mockClearOutline = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMock = (overrides: {
    currentOutline?: Outline | null;
    outlineConfirmed?: boolean;
    outlineLoading?: boolean;
    outlineError?: string | null;
  } = {}) => {
    const currentOutline = overrides.currentOutline ?? null;
    const outlineConfirmed = overrides.outlineConfirmed ?? false;
    const outlineLoading = overrides.outlineLoading ?? false;
    const outlineError = overrides.outlineError ?? null;

    // Build complete state for inline selectors
    const state = {
      // Frame state
      availableFrames: [],
      selectedFrame: null,
      frameConfirmed: false,
      framesLoading: false,
      framesError: null,
      // Outline state
      currentOutline,
      outlineLoading,
      outlineError,
      outlineConfirmed,
      // Actions
      setAvailableFrames: vi.fn(),
      selectFrame: vi.fn(),
      setCustomFrameDraft: vi.fn(),
      confirmFrame: vi.fn(),
      clearFrame: vi.fn(),
      setFramesLoading: vi.fn(),
      setFramesError: vi.fn(),
      setOutline: vi.fn(),
      updateOutline: vi.fn(),
      updateSceneBrief: vi.fn(),
      confirmOutline: mockConfirmOutline,
      clearOutline: mockClearOutline,
      setOutlineLoading: vi.fn(),
      setOutlineError: vi.fn(),
      resetContent: vi.fn(),
    };

    vi.mocked(useContentStore).mockImplementation((selector: unknown) => {
      // Check for selector identifier objects
      if (selector && typeof selector === 'object' && '__selector' in selector) {
        const selectorName = (selector as { __selector: string }).__selector;
        switch (selectorName) {
          case 'hasOutline':
            return currentOutline !== null;
          case 'isOutlineConfirmed':
            return outlineConfirmed;
          case 'canProceedToScenes':
            return currentOutline !== null && outlineConfirmed;
          case 'sceneBriefs':
            return currentOutline?.scenes ?? [];
          case 'outlineTitle':
            return currentOutline?.title ?? null;
          case 'outlineStatus':
            return {
              loading: outlineLoading,
              error: outlineError,
              hasOutline: currentOutline !== null,
            };
        }
      }

      // For inline selectors like (state) => state.currentOutline
      if (typeof selector === 'function') {
        return (selector as (s: typeof state) => unknown)(state);
      }

      return undefined;
    });
  };

  describe('empty state', () => {
    beforeEach(() => {
      setupMock();
    });

    it('renders empty state with generate button', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      // Header and button both have "Generate Outline" text, so check for heading specifically
      expect(screen.getByRole('heading', { name: /generate outline/i })).toBeInTheDocument();
      expect(screen.getByText('Ready to Create Your Outline')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate outline/i })).toBeInTheDocument();
    });

    it('shows frame name in context when provided', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
          frameName="The Haunted Forest"
        />
      );

      expect(screen.getByText('The Haunted Forest')).toBeInTheDocument();
    });

    it('shows expected scene count', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
          expectedSceneCount={5}
        />
      );

      expect(screen.getByText(/5 scene briefs/i)).toBeInTheDocument();
    });

    it('calls onGenerateOutline when generate button clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /generate outline/i }));

      expect(mockOnGenerateOutline).toHaveBeenCalledWith();
    });

    it('calls onBackToFrame when back button clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByText(/back to frame/i));

      expect(mockOnBackToFrame).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      setupMock({ outlineLoading: true });
    });

    it('shows loading spinner when generating', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByText('Generating outline...')).toBeInTheDocument();
    });

    it('shows frame name context while loading', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
          frameName="The Dark Temple"
        />
      );

      expect(screen.getByText('The Dark Temple')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    beforeEach(() => {
      setupMock({ outlineError: 'Failed to generate outline' });
    });

    it('shows error message', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByText('Failed to generate outline')).toBeInTheDocument();
    });

    it('shows retry button', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls onGenerateOutline when retry clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(mockOnGenerateOutline).toHaveBeenCalled();
    });
  });

  describe('with outline (unconfirmed)', () => {
    beforeEach(() => {
      setupMock({
        currentOutline: mockOutline,
        outlineConfirmed: false,
      });
    });

    it('renders outline title', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByText('The Shadow Keep')).toBeInTheDocument();
    });

    it('renders scene count', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByText(/3 scenes/i)).toBeInTheDocument();
    });

    it('renders all scene brief cards', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByText('The Dark Discovery')).toBeInTheDocument();
      expect(screen.getByText('Confrontation at Dawn')).toBeInTheDocument();
      expect(screen.getByText('The Final Revelation')).toBeInTheDocument();
    });

    it('shows confirm button', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByRole('button', { name: /confirm outline/i })).toBeInTheDocument();
    });

    it('calls confirmOutline when confirm clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /confirm outline/i }));

      expect(mockConfirmOutline).toHaveBeenCalled();
    });
  });

  describe('feedback flow', () => {
    beforeEach(() => {
      setupMock({
        currentOutline: mockOutline,
        outlineConfirmed: false,
      });
    });

    it('shows feedback input when regenerate clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /regenerate/i }));

      expect(screen.getByPlaceholderText(/more combat/i)).toBeInTheDocument();
    });

    it('submits feedback when regenerate with feedback clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /regenerate/i }));
      await user.type(screen.getByPlaceholderText(/more combat/i), 'Add more puzzles');
      await user.click(screen.getByRole('button', { name: /regenerate with feedback/i }));

      expect(mockOnGenerateOutline).toHaveBeenCalledWith('Add more puzzles');
    });

    it('hides feedback input when cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /regenerate/i }));
      expect(screen.getByPlaceholderText(/more combat/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByPlaceholderText(/more combat/i)).not.toBeInTheDocument();
    });

    it('disables submit when feedback is empty', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /regenerate/i }));

      const submitButton = screen.getByRole('button', { name: /regenerate with feedback/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('with outline (confirmed)', () => {
    beforeEach(() => {
      setupMock({
        currentOutline: { ...mockOutline, isConfirmed: true },
        outlineConfirmed: true,
      });
    });

    it('shows outline confirmed indicator', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByText(/outline confirmed/i)).toBeInTheDocument();
    });

    it('shows continue to scenes button', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByRole('button', { name: /continue to scene writing/i })).toBeInTheDocument();
    });

    it('hides regenerate button when confirmed', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.queryByRole('button', { name: /^regenerate$/i })).not.toBeInTheDocument();
    });

    it('shows change button', () => {
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    });

    it('calls clearOutline when change clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /change/i }));

      expect(mockClearOutline).toHaveBeenCalled();
    });

    it('calls onContinueToScenes when continue clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      await user.click(screen.getByRole('button', { name: /continue to scene writing/i }));

      expect(mockOnContinueToScenes).toHaveBeenCalled();
    });
  });

  describe('scene card interactions', () => {
    beforeEach(() => {
      setupMock({
        currentOutline: mockOutline,
        outlineConfirmed: false,
      });
    });

    it('expands scene card when clicked', async () => {
      const user = userEvent.setup();
      render(
        <OutlinePanel
          onGenerateOutline={mockOnGenerateOutline}
          onContinueToScenes={mockOnContinueToScenes}
          onBackToFrame={mockOnBackToFrame}
        />
      );

      // Click on the first scene card
      const firstSceneCard = screen.getByLabelText(/scene 1: the dark discovery/i);
      await user.click(firstSceneCard);

      // Should show expanded content - location should be visible
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Ancient ruins')).toBeInTheDocument();
    });
  });
});
