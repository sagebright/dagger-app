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
});
