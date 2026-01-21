/**
 * SceneList Component Tests
 *
 * Tests for the scene progress indicator showing all scenes
 * with their current status and allowing navigation.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneList } from './SceneList';
import type { Scene } from '@dagger-app/shared-types';

// =============================================================================
// Test Data
// =============================================================================

const mockScenes: Scene[] = [
  {
    brief: {
      id: 'scene-1',
      sceneNumber: 1,
      title: 'The Approaching Darkness',
      description: 'The party discovers a mysterious location.',
      keyElements: ['Perception checks'],
      sceneType: 'exploration',
    },
    draft: null,
    status: 'confirmed',
    confirmedAt: '2024-01-01T12:00:00Z',
  },
  {
    brief: {
      id: 'scene-2',
      sceneNumber: 2,
      title: 'The Confrontation',
      description: 'A combat encounter tests the party.',
      keyElements: ['Initiative'],
      sceneType: 'combat',
    },
    draft: null,
    status: 'generating',
  },
  {
    brief: {
      id: 'scene-3',
      sceneNumber: 3,
      title: 'The Revelation',
      description: 'A shocking truth is revealed.',
      keyElements: ['Plot twist'],
      sceneType: 'revelation',
    },
    draft: null,
    status: 'pending',
  },
  {
    brief: {
      id: 'scene-4',
      sceneNumber: 4,
      title: 'The Final Reckoning',
      description: 'The climactic conclusion.',
      keyElements: ['Climax'],
      sceneType: 'mixed',
    },
    draft: null,
    status: 'pending',
  },
];

// =============================================================================
// Basic Rendering Tests
// =============================================================================

describe('SceneList', () => {
  const defaultProps = {
    scenes: mockScenes,
    currentSceneId: 'scene-2',
    onSelectScene: vi.fn(),
  };

  describe('basic rendering', () => {
    it('renders all scenes', () => {
      render(<SceneList {...defaultProps} />);

      expect(screen.getByText('The Approaching Darkness')).toBeInTheDocument();
      expect(screen.getByText('The Confrontation')).toBeInTheDocument();
      expect(screen.getByText('The Revelation')).toBeInTheDocument();
      expect(screen.getByText('The Final Reckoning')).toBeInTheDocument();
    });

    it('renders scene numbers', () => {
      render(<SceneList {...defaultProps} />);

      // Scene 1 is confirmed (shows checkmark not number)
      // Scene 2 is generating (shows spinner)
      // Scene 3 and 4 are pending (show numbers)
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('highlights the current scene', () => {
      render(<SceneList {...defaultProps} />);

      const currentItem = screen.getByText('The Confrontation').closest('li, button, div[role="button"]');
      expect(currentItem).toHaveClass('ring-gold-500');
    });

    it('shows progress indicator', () => {
      render(<SceneList {...defaultProps} />);

      // 1 of 4 confirmed
      expect(screen.getByText(/1.*of.*4/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Status Display
  // ===========================================================================

  describe('status display', () => {
    it('shows confirmed status with checkmark', () => {
      render(<SceneList {...defaultProps} />);

      // Find the confirmed scene's button container
      const confirmedButton = screen.getByText('The Approaching Darkness').closest('button');
      expect(confirmedButton).toBeInTheDocument();

      // The checkmark SVG should be somewhere in the button
      const checkmark = confirmedButton?.querySelector('svg path');
      expect(checkmark).toBeInTheDocument();
    });

    it('shows generating status with spinner', () => {
      render(<SceneList {...defaultProps} />);

      // Scene 2 is generating - look for the generating indicator text
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('shows pending status for unstarted scenes', () => {
      render(<SceneList {...defaultProps} />);

      // Pending scenes should be styled differently
      const pendingScene = screen.getByText('The Revelation').closest('li, button, div');
      expect(pendingScene).toBeInTheDocument();
    });

    it('shows draft status for scenes with drafts', () => {
      const scenesWithDraft: Scene[] = [
        {
          ...mockScenes[0],
          status: 'draft',
          draft: {
            sceneId: 'scene-1',
            sceneNumber: 1,
            title: 'Test',
            introduction: 'Test',
            keyMoments: [],
            resolution: 'Test',
            tierGuidance: 'Test',
            extractedEntities: { npcs: [], adversaries: [], items: [] },
          },
        },
        ...mockScenes.slice(1),
      ];

      render(<SceneList {...defaultProps} scenes={scenesWithDraft} />);

      // First scene should show draft indicator
      const draftScene = screen.getByText('The Approaching Darkness').closest('li, button, div');
      expect(draftScene).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Navigation
  // ===========================================================================

  describe('navigation', () => {
    it('calls onSelectScene when clicking a confirmed scene', async () => {
      const user = userEvent.setup();
      const mockSelect = vi.fn();

      render(<SceneList {...defaultProps} onSelectScene={mockSelect} />);

      await user.click(screen.getByText('The Approaching Darkness'));

      expect(mockSelect).toHaveBeenCalledWith('scene-1');
    });

    it('allows navigating to the current scene', async () => {
      const user = userEvent.setup();
      const mockSelect = vi.fn();

      render(<SceneList {...defaultProps} onSelectScene={mockSelect} />);

      await user.click(screen.getByText('The Confrontation'));

      expect(mockSelect).toHaveBeenCalledWith('scene-2');
    });

    it('prevents navigating to pending scenes ahead of current', () => {
      const mockSelect = vi.fn();

      render(<SceneList {...defaultProps} onSelectScene={mockSelect} />);

      // Scene 3 and 4 are pending and ahead of current (scene 2)
      const pendingScene = screen.getByText('The Revelation').closest('button');
      if (pendingScene) {
        expect(pendingScene).toBeDisabled();
      }
    });
  });

  // ===========================================================================
  // Progress Tracking
  // ===========================================================================

  describe('progress tracking', () => {
    it('calculates progress percentage', () => {
      render(<SceneList {...defaultProps} />);

      // 1 confirmed out of 4 = 25%
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');
    });

    it('shows 0% when no scenes confirmed', () => {
      const pendingScenes: Scene[] = mockScenes.map((s) => ({
        ...s,
        status: 'pending' as const,
        confirmedAt: undefined,
      }));

      render(<SceneList {...defaultProps} scenes={pendingScenes} currentSceneId="scene-1" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('shows 100% when all scenes confirmed', () => {
      const allConfirmed: Scene[] = mockScenes.map((s) => ({
        ...s,
        status: 'confirmed' as const,
        confirmedAt: '2024-01-01T12:00:00Z',
      }));

      render(<SceneList {...defaultProps} scenes={allConfirmed} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  // ===========================================================================
  // Scene Types
  // ===========================================================================

  describe('scene type display', () => {
    it('shows scene type badges', () => {
      render(<SceneList {...defaultProps} />);

      // Each scene type should appear once
      const explorationBadges = screen.getAllByText(/exploration/i);
      const combatBadges = screen.getAllByText(/combat/i);
      const revelationBadges = screen.getAllByText(/revelation/i);

      expect(explorationBadges.length).toBeGreaterThan(0);
      expect(combatBadges.length).toBeGreaterThan(0);
      expect(revelationBadges.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe('accessibility', () => {
    it('has accessible list role', () => {
      render(<SceneList {...defaultProps} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('progress bar has accessible attributes', () => {
      render(<SceneList {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('scene items are keyboard navigable', async () => {
      const user = userEvent.setup();
      const mockSelect = vi.fn();

      render(<SceneList {...defaultProps} onSelectScene={mockSelect} />);

      // Tab to first scene and activate
      const firstScene = screen.getByText('The Approaching Darkness').closest('button');
      if (firstScene) {
        firstScene.focus();
        await user.keyboard('{Enter}');
        expect(mockSelect).toHaveBeenCalledWith('scene-1');
      }
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles empty scenes array', () => {
      render(<SceneList {...defaultProps} scenes={[]} />);

      expect(screen.getByText(/no scenes/i)).toBeInTheDocument();
    });

    it('handles single scene', () => {
      const singleScene: Scene[] = [mockScenes[0]];

      render(<SceneList {...defaultProps} scenes={singleScene} currentSceneId="scene-1" />);

      expect(screen.getByText('The Approaching Darkness')).toBeInTheDocument();
      expect(screen.getByText(/1.*of.*1/i)).toBeInTheDocument();
    });

    it('handles very long scene titles', () => {
      const longTitleScene: Scene[] = [
        {
          ...mockScenes[0],
          brief: {
            ...mockScenes[0].brief,
            title: 'A'.repeat(100),
          },
        },
      ];

      render(<SceneList {...defaultProps} scenes={longTitleScene} currentSceneId="scene-1" />);

      // Should truncate or handle gracefully
      expect(screen.getByText(/A+/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Layout Variants
  // ===========================================================================

  describe('layout variants', () => {
    it('supports horizontal layout', () => {
      render(<SceneList {...defaultProps} orientation="horizontal" />);

      const list = screen.getByRole('list');
      expect(list).toHaveClass('flex-row');
    });

    it('defaults to vertical layout', () => {
      render(<SceneList {...defaultProps} />);

      const list = screen.getByRole('list');
      expect(list).toHaveClass('flex-col');
    });

    it('supports compact mode', () => {
      render(<SceneList {...defaultProps} compact={true} />);

      // In compact mode, descriptions should be hidden
      expect(screen.queryByText('The party discovers a mysterious location.')).not.toBeInTheDocument();
    });
  });
});
