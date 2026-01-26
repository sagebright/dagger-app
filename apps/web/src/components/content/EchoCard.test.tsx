/**
 * Tests for EchoCard component (Phase 4.3)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Echo } from '@dagger-app/shared-types';
import { EchoCard } from './EchoCard';

// =============================================================================
// Test Data
// =============================================================================

const mockEcho: Echo = {
  id: 'echo-1',
  category: 'complications',
  title: 'The Bridge Collapses',
  content: 'The ancient bridge begins to crumble beneath the party\'s feet.',
  tags: ['environmental', 'dramatic'],
  isConfirmed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockConfirmedEcho: Echo = {
  id: 'echo-2',
  category: 'rumors',
  title: 'Whispers in the Tavern',
  content: 'The locals speak of a hidden treasure in the old mine.',
  isConfirmed: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

// =============================================================================
// Tests
// =============================================================================

describe('EchoCard', () => {
  const defaultProps = {
    echo: mockEcho,
    onConfirm: vi.fn(),
    onEdit: vi.fn(),
    onRegenerate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders echo title', () => {
      render(<EchoCard {...defaultProps} />);
      expect(screen.getByText('The Bridge Collapses')).toBeInTheDocument();
    });

    it('renders echo content', () => {
      render(<EchoCard {...defaultProps} />);
      expect(
        screen.getByText(/The ancient bridge begins to crumble/)
      ).toBeInTheDocument();
    });

    it('renders category badge', () => {
      render(<EchoCard {...defaultProps} />);
      expect(screen.getByText('complications')).toBeInTheDocument();
    });

    it('renders tags when provided', () => {
      render(<EchoCard {...defaultProps} />);
      expect(screen.getByText('environmental')).toBeInTheDocument();
      expect(screen.getByText('dramatic')).toBeInTheDocument();
    });

    it('does not render tags when not provided', () => {
      const echoWithoutTags = { ...mockEcho, tags: undefined };
      render(<EchoCard {...defaultProps} echo={echoWithoutTags} />);
      expect(screen.queryByText('environmental')).not.toBeInTheDocument();
    });

    it('shows confirmed state visually', () => {
      render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
      expect(screen.getByLabelText(/confirmed/i)).toBeInTheDocument();
    });

    it('shows pending state for unconfirmed echoes', () => {
      render(<EchoCard {...defaultProps} />);
      expect(screen.queryByLabelText(/confirmed/i)).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    describe('confirm', () => {
      it('renders confirm button for unconfirmed echoes', () => {
        render(<EchoCard {...defaultProps} />);
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      });

      it('calls onConfirm when confirm button clicked', () => {
        render(<EchoCard {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
        expect(defaultProps.onConfirm).toHaveBeenCalledWith('echo-1');
      });

      it('disables confirm button when already confirmed', () => {
        render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
        const button = screen.getByRole('button', { name: /confirm/i });
        expect(button).toBeDisabled();
      });
    });

    describe('edit', () => {
      it('renders edit button', () => {
        render(<EchoCard {...defaultProps} />);
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      it('calls onEdit when edit button clicked', () => {
        render(<EchoCard {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));
        expect(defaultProps.onEdit).toHaveBeenCalledWith('echo-1');
      });

      it('does not render edit button when disabled', () => {
        render(<EchoCard {...defaultProps} enableEdit={false} />);
        expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      });
    });

    describe('regenerate', () => {
      it('renders regenerate button', () => {
        render(<EchoCard {...defaultProps} />);
        expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
      });

      it('calls onRegenerate when regenerate button clicked', () => {
        render(<EchoCard {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /regenerate/i }));
        expect(defaultProps.onRegenerate).toHaveBeenCalledWith('echo-1');
      });

      it('does not render regenerate button when disabled', () => {
        render(<EchoCard {...defaultProps} enableRegenerate={false} />);
        expect(screen.queryByRole('button', { name: /regenerate/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('category styling', () => {
    it('applies complications category styling', () => {
      render(<EchoCard {...defaultProps} />);
      const badge = screen.getByText('complications');
      expect(badge).toHaveClass('bg-blood-100');
    });

    it('applies rumors category styling', () => {
      render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
      const badge = screen.getByText('rumors');
      expect(badge).toHaveClass('bg-gold-100');
    });

    it('applies discoveries category styling', () => {
      const discoveryEcho = { ...mockEcho, category: 'discoveries' as const };
      render(<EchoCard {...defaultProps} echo={discoveryEcho} />);
      const badge = screen.getByText('discoveries');
      expect(badge).toHaveClass('bg-parchment-100');
    });

    it('applies intrusions category styling', () => {
      const intrusionEcho = { ...mockEcho, category: 'intrusions' as const };
      render(<EchoCard {...defaultProps} echo={intrusionEcho} />);
      const badge = screen.getByText('intrusions');
      expect(badge).toHaveClass('bg-shadow-100');
    });

    it('applies wonders category styling', () => {
      const wondersEcho = { ...mockEcho, category: 'wonders' as const };
      render(<EchoCard {...defaultProps} echo={wondersEcho} />);
      const badge = screen.getByText('wonders');
      expect(badge).toHaveClass('bg-ink-100');
    });
  });

  describe('loading state', () => {
    it('disables all buttons when isLoading is true', () => {
      render(<EchoCard {...defaultProps} isLoading />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('shows loading indicator when isLoading', () => {
      render(<EchoCard {...defaultProps} isLoading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('renders in compact mode', () => {
      render(<EchoCard {...defaultProps} compact />);
      // In compact mode, content should be truncated
      const card = screen.getByTestId('echo-card');
      expect(card).toHaveClass('compact');
    });

    it('hides tags in compact mode', () => {
      render(<EchoCard {...defaultProps} compact />);
      expect(screen.queryByText('environmental')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      render(<EchoCard {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'The Bridge Collapses' })).toBeInTheDocument();
    });

    it('provides accessible labels for buttons', () => {
      render(<EchoCard {...defaultProps} />);
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
    });

    it('has proper article semantics', () => {
      render(<EchoCard {...defaultProps} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('animations', () => {
    describe('hover lift', () => {
      it('applies motion-safe hover lift to card', () => {
        render(<EchoCard {...defaultProps} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('motion-safe:hover:-translate-y-1');
      });
    });

    describe('confirmation glow', () => {
      it('applies selection glow animation when confirmed', () => {
        render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('motion-safe:animate-selection-glow');
      });

      it('does not apply selection glow animation when not confirmed', () => {
        render(<EchoCard {...defaultProps} />);
        const card = screen.getByTestId('echo-card');
        expect(card).not.toHaveClass('motion-safe:animate-selection-glow');
      });
    });

    describe('category-specific hover glow', () => {
      it('applies category-appropriate hover glow for complications', () => {
        render(<EchoCard {...defaultProps} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('motion-safe:hover:shadow-blood-glow');
      });

      it('applies category-appropriate hover glow for rumors', () => {
        render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('motion-safe:hover:shadow-gold-glow-subtle');
      });

      it('applies category-appropriate hover glow for discoveries', () => {
        const discoveryEcho = { ...mockEcho, category: 'discoveries' as const };
        render(<EchoCard {...defaultProps} echo={discoveryEcho} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('motion-safe:hover:shadow-gold-glow-subtle');
      });

      it('applies category-appropriate hover glow for intrusions', () => {
        const intrusionEcho = { ...mockEcho, category: 'intrusions' as const };
        render(<EchoCard {...defaultProps} echo={intrusionEcho} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('motion-safe:hover:shadow-fantasy');
      });

      it('applies category-appropriate hover glow for wonders', () => {
        const wondersEcho = { ...mockEcho, category: 'wonders' as const };
        render(<EchoCard {...defaultProps} echo={wondersEcho} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('motion-safe:hover:shadow-magic-glow');
      });
    });

    describe('focus rings', () => {
      it('applies focus ring to confirm button', () => {
        render(<EchoCard {...defaultProps} />);
        const button = screen.getByRole('button', { name: /confirm/i });
        expect(button).toHaveClass('focus:ring-2');
        expect(button).toHaveClass('focus:ring-gold-400');
        expect(button).toHaveClass('focus:outline-none');
      });

      it('applies focus ring to edit button', () => {
        render(<EchoCard {...defaultProps} />);
        const button = screen.getByRole('button', { name: /edit/i });
        expect(button).toHaveClass('focus:ring-2');
        expect(button).toHaveClass('focus:ring-gold-400');
        expect(button).toHaveClass('focus:outline-none');
      });

      it('applies focus ring to regenerate button', () => {
        render(<EchoCard {...defaultProps} />);
        const button = screen.getByRole('button', { name: /regenerate/i });
        expect(button).toHaveClass('focus:ring-2');
        expect(button).toHaveClass('focus:ring-gold-400');
        expect(button).toHaveClass('focus:outline-none');
      });

      it('applies focus ring offset for accessibility', () => {
        render(<EchoCard {...defaultProps} />);
        const button = screen.getByRole('button', { name: /confirm/i });
        expect(button).toHaveClass('focus:ring-offset-2');
      });
    });

    describe('smooth transitions', () => {
      it('applies transition-all to card', () => {
        render(<EchoCard {...defaultProps} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('transition-all');
      });

      it('applies transition duration to card', () => {
        render(<EchoCard {...defaultProps} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('duration-200');
      });
    });
  });

  describe('dark mode support', () => {
    it('applies dark mode background to card', () => {
      render(<EchoCard {...defaultProps} />);
      const card = screen.getByTestId('echo-card');
      expect(card).toHaveClass('dark:bg-shadow-800');
    });

    it('applies dark mode background to confirmed card', () => {
      render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
      const card = screen.getByTestId('echo-card');
      expect(card).toHaveClass('dark:bg-shadow-900');
    });

    it('applies dark mode ring to confirmed card', () => {
      render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
      const card = screen.getByTestId('echo-card');
      expect(card).toHaveClass('dark:ring-gold-500');
    });

    it('applies dark mode styles to loading overlay', () => {
      render(<EchoCard {...defaultProps} isLoading />);
      const loadingOverlay = screen.getByRole('status').parentElement;
      expect(loadingOverlay).toHaveClass('dark:bg-shadow-900/50');
    });

    it('applies dark mode text to title', () => {
      render(<EchoCard {...defaultProps} />);
      const title = screen.getByRole('heading', { name: 'The Bridge Collapses' });
      expect(title).toHaveClass('dark:text-parchment-100');
    });

    it('applies dark mode text to content', () => {
      render(<EchoCard {...defaultProps} />);
      const content = screen.getByText(/The ancient bridge begins to crumble/);
      expect(content).toHaveClass('dark:text-parchment-200');
    });

    it('applies dark mode styles to tag badges', () => {
      render(<EchoCard {...defaultProps} />);
      const tag = screen.getByText('environmental');
      expect(tag).toHaveClass('dark:bg-shadow-700');
      expect(tag).toHaveClass('dark:text-parchment-300');
    });

    it('applies dark mode styles to action border', () => {
      render(<EchoCard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toHaveClass('dark:border-shadow-600');
      expect(editButton).toHaveClass('dark:text-parchment-200');
    });

    it('applies dark mode hover to action buttons', () => {
      render(<EchoCard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toHaveClass('dark:hover:bg-shadow-700');
    });

    it('applies dark mode styles to confirm button text', () => {
      render(<EchoCard {...defaultProps} />);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('text-ink-900');
    });

    it('applies dark mode styles to disabled confirm button', () => {
      render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('dark:bg-shadow-700');
      expect(confirmButton).toHaveClass('dark:text-shadow-500');
    });

    it('applies dark mode border to action container', () => {
      render(<EchoCard {...defaultProps} />);
      // Find the action container by its border class
      const card = screen.getByTestId('echo-card');
      const actionContainer = card.querySelector('.border-t');
      expect(actionContainer).toHaveClass('dark:border-shadow-600');
    });

    describe('dark mode category styling', () => {
      it('applies dark mode complications category styling', () => {
        render(<EchoCard {...defaultProps} />);
        const badge = screen.getByText('complications');
        expect(badge).toHaveClass('dark:bg-blood-900');
        expect(badge).toHaveClass('dark:text-blood-200');
      });

      it('applies dark mode rumors category styling', () => {
        render(<EchoCard {...defaultProps} echo={mockConfirmedEcho} />);
        const badge = screen.getByText('rumors');
        expect(badge).toHaveClass('dark:bg-gold-900');
        expect(badge).toHaveClass('dark:text-gold-200');
      });

      it('applies dark mode discoveries category styling', () => {
        const discoveryEcho = { ...mockEcho, category: 'discoveries' as const };
        render(<EchoCard {...defaultProps} echo={discoveryEcho} />);
        const badge = screen.getByText('discoveries');
        expect(badge).toHaveClass('dark:bg-parchment-900');
        expect(badge).toHaveClass('dark:text-parchment-200');
      });

      it('applies dark mode intrusions category styling', () => {
        const intrusionEcho = { ...mockEcho, category: 'intrusions' as const };
        render(<EchoCard {...defaultProps} echo={intrusionEcho} />);
        const badge = screen.getByText('intrusions');
        expect(badge).toHaveClass('dark:bg-shadow-700');
        expect(badge).toHaveClass('dark:text-shadow-200');
      });

      it('applies dark mode wonders category styling', () => {
        const wondersEcho = { ...mockEcho, category: 'wonders' as const };
        render(<EchoCard {...defaultProps} echo={wondersEcho} />);
        const badge = screen.getByText('wonders');
        expect(badge).toHaveClass('dark:bg-ink-900');
        expect(badge).toHaveClass('dark:text-ink-200');
      });

      it('applies dark mode border to card for complications', () => {
        render(<EchoCard {...defaultProps} />);
        const card = screen.getByTestId('echo-card');
        expect(card).toHaveClass('dark:border-blood-700');
      });
    });
  });
});
