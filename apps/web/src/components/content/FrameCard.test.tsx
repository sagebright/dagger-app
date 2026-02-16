/**
 * FrameCard Component Tests
 *
 * Tests for compact frame card with three visual states:
 * default, exploring, active
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrameCard } from './FrameCard';
import type { DaggerheartFrame, FrameDraft } from '@dagger-app/shared-types';

const mockDbFrame: DaggerheartFrame = {
  id: 'frame-1',
  name: 'The Dark Forest',
  description: 'A mysterious forest full of danger and ancient secrets',
  themes: ['mystery', 'horror', 'nature', 'survival'],
  typical_adversaries: ['beasts', 'undead', 'fey'],
  lore: 'Ancient evil lurks beneath the trees, waiting for unwary travelers',
  source_book: 'Core Rulebook',
  embedding: null,
  created_at: '2024-01-01T00:00:00.000Z',
};

const mockCustomFrame: FrameDraft = {
  id: 'custom-1',
  name: 'Haunted Manor',
  description: 'A crumbling mansion with dark secrets',
  themes: ['horror', 'mystery'],
  typicalAdversaries: ['undead', 'constructs'],
  lore: 'The manor was once home to a powerful necromancer',
  isCustom: true,
};

describe('FrameCard', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('rendering', () => {
    it('renders frame name', () => {
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      expect(screen.getByText('The Dark Forest')).toBeInTheDocument();
    });

    it('renders frame description as pitch', () => {
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      expect(screen.getByText(/mysterious forest/i)).toBeInTheDocument();
    });

    it('renders as button', () => {
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <FrameCard
          frame={mockDbFrame}
          onSelect={mockOnSelect}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('custom frames', () => {
    it('displays Custom badge for custom frames', () => {
      render(
        <FrameCard frame={mockCustomFrame} onSelect={mockOnSelect} />
      );

      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('does not display Custom badge for DB frames', () => {
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      expect(screen.queryByText('Custom')).not.toBeInTheDocument();
    });
  });

  describe('card states', () => {
    it('has aria-pressed=true when active', () => {
      render(
        <FrameCard frame={mockDbFrame} state="active" onSelect={mockOnSelect} />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('has aria-pressed=false when default', () => {
      render(
        <FrameCard frame={mockDbFrame} state="default" onSelect={mockOnSelect} />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('has aria-pressed=false when exploring', () => {
      render(
        <FrameCard frame={mockDbFrame} state="exploring" onSelect={mockOnSelect} />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('applies gold text to frame name when active', () => {
      render(
        <FrameCard frame={mockDbFrame} state="active" onSelect={mockOnSelect} />
      );

      const name = screen.getByText('The Dark Forest');
      expect(name).toHaveClass('text-gold-600');
    });
  });

  describe('selection', () => {
    it('calls onSelect when clicked', async () => {
      const user = userEvent.setup();
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      await user.click(screen.getByRole('button'));

      expect(mockOnSelect).toHaveBeenCalledWith(mockDbFrame);
    });
  });

  describe('keyboard accessibility', () => {
    it('selects with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalledWith(mockDbFrame);
    });

    it('selects with Space key', async () => {
      const user = userEvent.setup();
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(mockOnSelect).toHaveBeenCalledWith(mockDbFrame);
    });
  });

  describe('accessibility', () => {
    it('has accessible label', () => {
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });

    it('has focus ring classes for keyboard navigation', () => {
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-gold-400');
      expect(button).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('transitions', () => {
    it('has smooth transition classes', () => {
      render(
        <FrameCard frame={mockDbFrame} onSelect={mockOnSelect} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-150');
    });
  });
});
