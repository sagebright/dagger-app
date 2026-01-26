/**
 * SceneBriefCard Component Tests
 *
 * Tests for scene brief display card with animations
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SceneBriefCard } from './SceneBriefCard';
import type { SceneBrief } from '@dagger-app/shared-types';

const mockScene: SceneBrief = {
  id: 'scene-1',
  sceneNumber: 1,
  title: 'The Dark Entrance',
  description: 'The party approaches a mysterious cave entrance shrouded in mist',
  keyElements: ['mist', 'ancient runes', 'strange sounds', 'cold air'],
  location: 'Cave of Shadows',
  characters: ['Guardian Spirit', 'Cave Dweller'],
  sceneType: 'exploration',
};

const mockCombatScene: SceneBrief = {
  id: 'scene-2',
  sceneNumber: 2,
  title: 'Ambush!',
  description: 'Enemies emerge from the shadows',
  keyElements: ['surprise attack', 'tactical positioning'],
  sceneType: 'combat',
};

describe('SceneBriefCard', () => {
  const mockOnToggleExpand = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    mockOnToggleExpand.mockClear();
    mockOnEdit.mockClear();
  });

  describe('rendering', () => {
    it('renders scene title', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText('The Dark Entrance')).toBeInTheDocument();
    });

    it('renders scene number badge', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText(/Scene 1/)).toBeInTheDocument();
    });

    it('renders scene description', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText(/mysterious cave entrance/i)).toBeInTheDocument();
    });

    it('renders scene type label', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText('Exploration')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('key elements', () => {
    it('shows limited key elements when collapsed', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          expanded={false}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText('mist')).toBeInTheDocument();
      expect(screen.getByText('ancient runes')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('shows all key elements when expanded', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          expanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      // When expanded with >2 elements, they appear in both inline tags and detailed list
      // Use getAllByText to account for duplicates
      expect(screen.getAllByText('mist').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('ancient runes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('strange sounds').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('cold air').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('expanded view', () => {
    it('shows location when expanded', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          expanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText('Cave of Shadows')).toBeInTheDocument();
    });

    it('shows characters when expanded', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          expanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText('Guardian Spirit')).toBeInTheDocument();
      expect(screen.getByText('Cave Dweller')).toBeInTheDocument();
    });

    it('shows edit button when expanded and onEdit provided', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          expanded={true}
          onToggleExpand={mockOnToggleExpand}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByRole('button', { name: /edit scene brief/i })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onToggleExpand when clicked', async () => {
      const user = userEvent.setup();
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      await user.click(screen.getByRole('button', { name: /Scene 1/i }));

      expect(mockOnToggleExpand).toHaveBeenCalledWith('scene-1');
    });

    it('calls onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      render(
        <SceneBriefCard
          scene={mockScene}
          expanded={true}
          onToggleExpand={mockOnToggleExpand}
          onEdit={mockOnEdit}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit scene brief/i }));

      expect(mockOnEdit).toHaveBeenCalledWith('scene-1');
      // Should not trigger expand toggle
      expect(mockOnToggleExpand).not.toHaveBeenCalled();
    });
  });

  describe('keyboard accessibility', () => {
    it('expands with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockOnToggleExpand).toHaveBeenCalledWith('scene-1');
    });

    it('expands with Space key', async () => {
      const user = userEvent.setup();
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      card.focus();
      await user.keyboard(' ');

      expect(mockOnToggleExpand).toHaveBeenCalledWith('scene-1');
    });
  });

  describe('accessibility', () => {
    it('has aria-expanded attribute', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          expanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByRole('button', { name: /Scene 1/i })).toHaveAttribute('aria-expanded', 'true');
    });

    it('has accessible label', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAccessibleName();
    });

    it('has focus ring classes for keyboard navigation', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      expect(card).toHaveClass('focus:ring-2');
      expect(card).toHaveClass('focus:ring-gold-400');
      expect(card).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('animations', () => {
    it('has hover lift animation classes (motion-safe)', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      expect(card).toHaveClass('motion-safe:hover:-translate-y-0.5');
    });

    it('has selection glow animation when confirmed (motion-safe)', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          isConfirmed={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      expect(card).toHaveClass('motion-safe:animate-selection-glow');
    });

    it('does not have selection glow animation when not confirmed', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          isConfirmed={false}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      expect(card).not.toHaveClass('motion-safe:animate-selection-glow');
    });

    it('has smooth transition classes', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-200');
    });

    it('applies confirmed styling with gold glow', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          isConfirmed={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      expect(card).toHaveClass('shadow-gold-glow');
    });

    it('does not apply gold glow when not confirmed', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          isConfirmed={false}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      const card = screen.getByRole('button', { name: /Scene 1/i });
      expect(card).not.toHaveClass('shadow-gold-glow');
    });
  });

  describe('scene type styling', () => {
    it('applies combat styling for combat scenes', () => {
      render(
        <SceneBriefCard
          scene={mockCombatScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText('Combat')).toBeInTheDocument();
    });

    it('applies exploration styling for exploration scenes', () => {
      render(
        <SceneBriefCard
          scene={mockScene}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      expect(screen.getByText('Exploration')).toBeInTheDocument();
    });
  });
});
