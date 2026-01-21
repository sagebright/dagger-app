/**
 * SceneNavigation Component Tests
 *
 * Tests for the scene navigation controls (previous/next).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneNavigation } from './SceneNavigation';

// =============================================================================
// Basic Rendering Tests
// =============================================================================

describe('SceneNavigation', () => {
  const defaultProps = {
    currentSceneNumber: 2,
    totalScenes: 4,
    canGoPrevious: true,
    canGoNext: true,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
  };

  describe('basic rendering', () => {
    it('renders scene position indicator', () => {
      render(<SceneNavigation {...defaultProps} />);

      expect(screen.getByText(/scene 2 of 4/i)).toBeInTheDocument();
    });

    it('renders previous button', () => {
      render(<SceneNavigation {...defaultProps} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    });

    it('renders next button', () => {
      render(<SceneNavigation {...defaultProps} />);

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Button States
  // ===========================================================================

  describe('button states', () => {
    it('disables previous button when canGoPrevious is false', () => {
      render(<SceneNavigation {...defaultProps} canGoPrevious={false} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('enables previous button when canGoPrevious is true', () => {
      render(<SceneNavigation {...defaultProps} canGoPrevious={true} />);

      expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
    });

    it('disables next button when canGoNext is false', () => {
      render(<SceneNavigation {...defaultProps} canGoNext={false} />);

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('enables next button when canGoNext is true', () => {
      render(<SceneNavigation {...defaultProps} canGoNext={true} />);

      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
    });

    it('disables both buttons when on first unconfirmed scene', () => {
      render(
        <SceneNavigation
          {...defaultProps}
          currentSceneNumber={1}
          canGoPrevious={false}
          canGoNext={false}
        />
      );

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  // ===========================================================================
  // Navigation Actions
  // ===========================================================================

  describe('navigation actions', () => {
    it('calls onPrevious when previous clicked', async () => {
      const user = userEvent.setup();
      const mockPrevious = vi.fn();

      render(<SceneNavigation {...defaultProps} onPrevious={mockPrevious} />);

      await user.click(screen.getByRole('button', { name: /previous/i }));

      expect(mockPrevious).toHaveBeenCalled();
    });

    it('calls onNext when next clicked', async () => {
      const user = userEvent.setup();
      const mockNext = vi.fn();

      render(<SceneNavigation {...defaultProps} onNext={mockNext} />);

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(mockNext).toHaveBeenCalled();
    });

    it('does not call onPrevious when disabled', async () => {
      const user = userEvent.setup();
      const mockPrevious = vi.fn();

      render(
        <SceneNavigation {...defaultProps} canGoPrevious={false} onPrevious={mockPrevious} />
      );

      // Attempt to click disabled button
      const button = screen.getByRole('button', { name: /previous/i });
      await user.click(button);

      expect(mockPrevious).not.toHaveBeenCalled();
    });

    it('does not call onNext when disabled', async () => {
      const user = userEvent.setup();
      const mockNext = vi.fn();

      render(<SceneNavigation {...defaultProps} canGoNext={false} onNext={mockNext} />);

      // Attempt to click disabled button
      const button = screen.getByRole('button', { name: /next/i });
      await user.click(button);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Keyboard Navigation
  // ===========================================================================

  describe('keyboard navigation', () => {
    it('supports keyboard activation of previous', async () => {
      const user = userEvent.setup();
      const mockPrevious = vi.fn();

      render(<SceneNavigation {...defaultProps} onPrevious={mockPrevious} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      prevButton.focus();
      await user.keyboard('{Enter}');

      expect(mockPrevious).toHaveBeenCalled();
    });

    it('supports keyboard activation of next', async () => {
      const user = userEvent.setup();
      const mockNext = vi.fn();

      render(<SceneNavigation {...defaultProps} onNext={mockNext} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      nextButton.focus();
      await user.keyboard('{Enter}');

      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('handles first scene', () => {
      render(
        <SceneNavigation
          {...defaultProps}
          currentSceneNumber={1}
          canGoPrevious={false}
        />
      );

      expect(screen.getByText(/scene 1 of 4/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('handles last scene', () => {
      render(
        <SceneNavigation
          {...defaultProps}
          currentSceneNumber={4}
          canGoNext={false}
        />
      );

      expect(screen.getByText(/scene 4 of 4/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('handles single scene', () => {
      render(
        <SceneNavigation
          currentSceneNumber={1}
          totalScenes={1}
          canGoPrevious={false}
          canGoNext={false}
          onPrevious={vi.fn()}
          onNext={vi.fn()}
        />
      );

      expect(screen.getByText(/scene 1 of 1/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Loading State
  // ===========================================================================

  describe('loading state', () => {
    it('disables navigation when loading', () => {
      render(<SceneNavigation {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('shows loading indicator when loading', () => {
      render(<SceneNavigation {...defaultProps} isLoading={true} />);

      // Should have some loading indicator
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Continue Button
  // ===========================================================================

  describe('continue to next phase', () => {
    it('shows continue button when all scenes confirmed', () => {
      render(
        <SceneNavigation
          {...defaultProps}
          allScenesConfirmed={true}
          onContinueToNPCs={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('hides continue button when scenes remain', () => {
      render(
        <SceneNavigation
          {...defaultProps}
          allScenesConfirmed={false}
        />
      );

      expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    });

    it('calls onContinueToNPCs when continue clicked', async () => {
      const user = userEvent.setup();
      const mockContinue = vi.fn();

      render(
        <SceneNavigation
          {...defaultProps}
          allScenesConfirmed={true}
          onContinueToNPCs={mockContinue}
        />
      );

      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(mockContinue).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  describe('accessibility', () => {
    it('has accessible button labels', () => {
      render(<SceneNavigation {...defaultProps} />);

      expect(screen.getByRole('button', { name: /previous/i })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /next/i })).toHaveAccessibleName();
    });

    it('announces scene position', () => {
      render(<SceneNavigation {...defaultProps} />);

      const status = screen.getByText(/scene 2 of 4/i);
      expect(status).toBeInTheDocument();
    });
  });
});
