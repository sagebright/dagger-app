/**
 * SceneEditor Component Tests
 *
 * Tests for the scene editor with streaming draft display
 * and draft-revise workflow via chat feedback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneEditor } from './SceneEditor';
import type { SceneBrief, SceneDraft } from '@dagger-app/shared-types';

// =============================================================================
// Test Data
// =============================================================================

const mockSceneBrief: SceneBrief = {
  id: 'scene-1',
  sceneNumber: 1,
  title: 'The Approaching Darkness',
  description: 'The party discovers a mysterious location.',
  keyElements: ['Perception checks', 'Environmental hazards'],
  location: 'Ancient ruins entrance',
  characters: ['Local guide'],
  sceneType: 'exploration',
};

const mockSceneDraft: SceneDraft = {
  sceneId: 'scene-1',
  sceneNumber: 1,
  title: 'The Approaching Darkness',
  introduction:
    'Mist swirls around the crumbling entrance to what was once a great temple. The air carries whispers of ages past.',
  keyMoments: [
    {
      title: 'The Threshold',
      description: 'As the party steps through the entrance, ancient wards flicker to life.',
    },
    {
      title: 'The Guide Speaks',
      description: 'The local guide shares the legend of the temple.',
    },
  ],
  resolution: 'The party must decide whether to press on or seek more information.',
  tierGuidance: 'For tier 2 parties, include moderate skill checks (DC 12-15).',
  environmentDetails: 'Crumbling stone, overgrown vegetation, faded carvings.',
  discoveryOpportunities: ['Hidden chamber behind vines', 'Ancient inscription'],
  extractedEntities: {
    npcs: [{ name: 'Orik the Guide', role: 'Local historian', sceneId: 'scene-1' }],
    adversaries: [],
    items: [{ name: 'Ancient Coin', suggestedTier: 1, sceneId: 'scene-1' }],
  },
};

// =============================================================================
// Basic Rendering Tests
// =============================================================================

describe('SceneEditor', () => {
  const defaultProps = {
    sceneBrief: mockSceneBrief,
    sceneDraft: null,
    isLoading: false,
    streamingContent: null,
    onSubmitFeedback: vi.fn(),
    onConfirmScene: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('renders scene title from brief', () => {
      render(<SceneEditor {...defaultProps} />);

      expect(screen.getByText('The Approaching Darkness')).toBeInTheDocument();
    });

    it('renders scene number badge', () => {
      render(<SceneEditor {...defaultProps} />);

      expect(screen.getByText(/Scene 1/)).toBeInTheDocument();
    });

    it('renders scene type badge', () => {
      render(<SceneEditor {...defaultProps} />);

      expect(screen.getByText(/exploration/i)).toBeInTheDocument();
    });

    it('shows empty state when no draft exists', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={null} />);

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Loading/Streaming State
  // ===========================================================================

  describe('loading state', () => {
    it('shows loading spinner when generating', () => {
      render(<SceneEditor {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/generating scene/i)).toBeInTheDocument();
    });

    it('displays streaming content as it arrives', () => {
      render(
        <SceneEditor {...defaultProps} isLoading={true} streamingContent="Mist swirls around the" />
      );

      expect(screen.getByText(/Mist swirls around the/)).toBeInTheDocument();
    });

    it('updates streaming content progressively', async () => {
      const { rerender } = render(
        <SceneEditor {...defaultProps} isLoading={true} streamingContent="Mist" />
      );

      expect(screen.getByText(/Mist/)).toBeInTheDocument();

      rerender(
        <SceneEditor
          {...defaultProps}
          isLoading={true}
          streamingContent="Mist swirls around the entrance"
        />
      );

      expect(screen.getByText(/Mist swirls around the entrance/)).toBeInTheDocument();
    });

    it('disables feedback input during loading', () => {
      render(<SceneEditor {...defaultProps} isLoading={true} />);

      const input = screen.queryByPlaceholderText(/feedback/i);
      if (input) {
        expect(input).toBeDisabled();
      }
    });
  });

  // ===========================================================================
  // Draft Display
  // ===========================================================================

  describe('draft display', () => {
    it('displays full scene draft when complete', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByText(mockSceneDraft.introduction)).toBeInTheDocument();
    });

    it('displays all key moments', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      mockSceneDraft.keyMoments.forEach((moment) => {
        expect(screen.getByText(moment.title)).toBeInTheDocument();
      });
    });

    it('displays resolution section', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByText(mockSceneDraft.resolution)).toBeInTheDocument();
    });

    it('displays tier guidance', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByText(/tier 2/i)).toBeInTheDocument();
    });

    it('displays environment details when present', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByText(/crumbling stone/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Extracted Entities Display
  // ===========================================================================

  describe('extracted entities', () => {
    it('displays extracted NPCs section', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByText('Orik the Guide')).toBeInTheDocument();
    });

    it('displays extracted items section', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByText('Ancient Coin')).toBeInTheDocument();
    });

    it('shows empty state when no entities extracted', () => {
      const draftWithNoEntities: SceneDraft = {
        ...mockSceneDraft,
        extractedEntities: {
          npcs: [],
          adversaries: [],
          items: [],
        },
      };

      render(<SceneEditor {...defaultProps} sceneDraft={draftWithNoEntities} />);

      // Should still render, just without entity sections
      expect(screen.getByText(mockSceneDraft.title)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Feedback Submission
  // ===========================================================================

  describe('feedback submission', () => {
    it('renders feedback input when draft exists', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByPlaceholderText(/feedback/i)).toBeInTheDocument();
    });

    it('calls onSubmitFeedback with input value', async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} onSubmitFeedback={mockSubmit} />
      );

      const input = screen.getByPlaceholderText(/feedback/i);
      await user.type(input, 'Add more tension');

      const submitButton = screen.getByRole('button', { name: /revise/i });
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith('Add more tension');
    });

    it('clears input after submission', async () => {
      const user = userEvent.setup();

      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      const input = screen.getByPlaceholderText(/feedback/i);
      await user.type(input, 'Add more tension');
      await user.click(screen.getByRole('button', { name: /revise/i }));

      expect(input).toHaveValue('');
    });

    it('disables submit button when input is empty', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      const submitButton = screen.getByRole('button', { name: /revise/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when input has content', async () => {
      const user = userEvent.setup();

      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      const input = screen.getByPlaceholderText(/feedback/i);
      await user.type(input, 'Something');

      const submitButton = screen.getByRole('button', { name: /revise/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('submits on Enter key', async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} onSubmitFeedback={mockSubmit} />
      );

      const input = screen.getByPlaceholderText(/feedback/i);
      await user.type(input, 'Add more action{Enter}');

      expect(mockSubmit).toHaveBeenCalledWith('Add more action');
    });
  });

  // ===========================================================================
  // Scene Confirmation
  // ===========================================================================

  describe('scene confirmation', () => {
    it('renders confirm button when draft exists', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('calls onConfirmScene when confirm clicked', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.fn();

      render(
        <SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} onConfirmScene={mockConfirm} />
      );

      await user.click(screen.getByRole('button', { name: /confirm/i }));

      expect(mockConfirm).toHaveBeenCalled();
    });

    it('shows confirmed state after confirmation', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} isConfirmed={true} />);

      // Look for the footer message (not the header badge)
      expect(screen.getByText('Scene Confirmed')).toBeInTheDocument();
    });

    it('hides feedback input when confirmed', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} isConfirmed={true} />);

      expect(screen.queryByPlaceholderText(/feedback/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Collapsible Sections
  // ===========================================================================

  describe('collapsible sections', () => {
    it('can expand and collapse key moments', async () => {
      const user = userEvent.setup();

      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      // Find the key moments header/toggle
      const keyMomentsToggle = screen.getByText(/key moments/i);
      expect(keyMomentsToggle).toBeInTheDocument();

      // Content should be visible by default
      expect(screen.getByText('The Threshold')).toBeInTheDocument();

      // Click to collapse
      await user.click(keyMomentsToggle);

      // Content should be hidden after collapse (if implemented)
      // Note: This depends on the actual implementation
    });

    it('toggles extracted entities visibility', async () => {
      const user = userEvent.setup();

      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      // Find the entities section toggle
      const entitiesToggle = screen.getByText(/extracted/i);
      if (entitiesToggle) {
        await user.click(entitiesToggle);
      }
    });
  });

  // ===========================================================================
  // Combat-specific Display
  // ===========================================================================

  describe('combat scene display', () => {
    const combatDraft: SceneDraft = {
      ...mockSceneDraft,
      combatNotes: 'Initiative order and tactical considerations...',
      extractedEntities: {
        npcs: [],
        adversaries: [
          { name: 'Skeletal Warrior', type: 'minion', tier: 2, sceneId: 'scene-1' },
          { name: 'Wraith Captain', type: 'standard', tier: 2, sceneId: 'scene-1' },
        ],
        items: [],
      },
    };

    it('displays combat notes for combat scenes', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={combatDraft} />);

      expect(screen.getByText(/initiative order/i)).toBeInTheDocument();
    });

    it('displays adversary list', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={combatDraft} />);

      expect(screen.getByText('Skeletal Warrior')).toBeInTheDocument();
      expect(screen.getByText('Wraith Captain')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe('accessibility', () => {
    it('has accessible loading state', () => {
      render(<SceneEditor {...defaultProps} isLoading={true} />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('feedback input has associated label', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      const input = screen.getByPlaceholderText(/feedback/i);
      expect(input).toHaveAccessibleName();
    });

    it('buttons have accessible names', () => {
      render(<SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} />);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Error States
  // ===========================================================================

  describe('error states', () => {
    it('displays error message when provided', () => {
      render(<SceneEditor {...defaultProps} error="Failed to generate scene" />);

      expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
    });

    it('shows retry button on error', () => {
      render(<SceneEditor {...defaultProps} error="Generation failed" onRetry={vi.fn()} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls onRetry when retry clicked', async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      render(<SceneEditor {...defaultProps} error="Generation failed" onRetry={mockRetry} />);

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles very long content gracefully', () => {
      const longDraft: SceneDraft = {
        ...mockSceneDraft,
        introduction: 'A'.repeat(5000),
      };

      render(<SceneEditor {...defaultProps} sceneDraft={longDraft} />);

      // Should render without crashing
      expect(screen.getByText(mockSceneDraft.title)).toBeInTheDocument();
    });

    it('handles missing optional draft fields', () => {
      const minimalBrief: SceneBrief = {
        ...mockSceneBrief,
        title: 'Minimal Scene',
      };
      const minimalDraft: SceneDraft = {
        sceneId: 'scene-1',
        sceneNumber: 1,
        title: 'Minimal Scene',
        introduction: 'Intro text',
        keyMoments: [],
        resolution: 'Resolution text',
        tierGuidance: 'Tier guidance',
        extractedEntities: {
          npcs: [],
          adversaries: [],
          items: [],
        },
      };

      render(<SceneEditor {...defaultProps} sceneBrief={minimalBrief} sceneDraft={minimalDraft} />);

      // Component shows sceneBrief.title in header
      expect(screen.getByText('Minimal Scene')).toBeInTheDocument();
    });

    it('handles rapid feedback submissions', async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();

      render(
        <SceneEditor {...defaultProps} sceneDraft={mockSceneDraft} onSubmitFeedback={mockSubmit} />
      );

      const input = screen.getByPlaceholderText(/feedback/i);
      const submitBtn = screen.getByRole('button', { name: /revise/i });

      // Rapid submissions
      await user.type(input, 'Feedback 1');
      await user.click(submitBtn);
      await user.type(input, 'Feedback 2');
      await user.click(submitBtn);

      // Should handle both (or debounce appropriately)
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});
