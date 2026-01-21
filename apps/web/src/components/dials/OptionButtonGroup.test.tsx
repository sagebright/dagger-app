/**
 * OptionButtonGroup Component Tests
 *
 * TDD tests for a reusable component that renders discrete string options
 * as a horizontal button group with aria-pressed state.
 *
 * Follows TierSelect patterns for accessibility.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OptionButtonGroup } from './OptionButtonGroup';

describe('OptionButtonGroup', () => {
  const mockOnChange = vi.fn();
  const defaultOptions = [
    { value: 'sparse', label: 'Sparse' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'rich', label: 'Rich' },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all options as buttons', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('button', { name: /sparse/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /moderate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rich/i })).toBeInTheDocument();
    });

    it('highlights selected option', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
        />
      );

      const moderateButton = screen.getByRole('button', { name: /moderate/i });
      expect(moderateButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders optional label', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
          label="NPC Density"
        />
      );

      expect(screen.getByText('NPC Density')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with null value (no selection)', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value={null}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('selection', () => {
    it('calls onChange when option is selected', async () => {
      const user = userEvent.setup();
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="sparse"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /rich/i }));

      expect(mockOnChange).toHaveBeenCalledWith('rich');
    });

    it('does not call onChange when same option is clicked', async () => {
      const user = userEvent.setup();
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /moderate/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(
        <OptionButtonGroup
          options={defaultOptions}
          value="sparse"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('button', { name: /sparse/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      );

      rerender(
        <OptionButtonGroup
          options={defaultOptions}
          value="rich"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('button', { name: /sparse/i })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(screen.getByRole('button', { name: /rich/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
          disabled
        />
      );

      expect(screen.getByRole('button', { name: /sparse/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /moderate/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /rich/i })).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="sparse"
          onChange={mockOnChange}
          disabled
        />
      );

      await user.click(screen.getByRole('button', { name: /moderate/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('keyboard accessibility', () => {
    it('supports Tab navigation between options', async () => {
      const user = userEvent.setup();
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
        />
      );

      await user.tab();
      expect(screen.getByRole('button', { name: /sparse/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /moderate/i })).toHaveFocus();
    });

    it('selects option with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="sparse"
          onChange={mockOnChange}
        />
      );

      const richButton = screen.getByRole('button', { name: /rich/i });
      richButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith('rich');
    });

    it('selects option with Space key', async () => {
      const user = userEvent.setup();
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="sparse"
          onChange={mockOnChange}
        />
      );

      const moderateButton = screen.getByRole('button', { name: /moderate/i });
      moderateButton.focus();
      await user.keyboard(' ');

      expect(mockOnChange).toHaveBeenCalledWith('moderate');
    });
  });

  describe('accessibility', () => {
    it('has proper role group for option buttons', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('buttons have aria-pressed state', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="sparse"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('button', { name: /sparse/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: /moderate/i })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('has accessible name for each button', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('associates label with group using aria-labelledby', () => {
      render(
        <OptionButtonGroup
          options={defaultOptions}
          value="moderate"
          onChange={mockOnChange}
          label="NPC Density"
        />
      );

      const group = screen.getByRole('group');
      expect(group).toHaveAccessibleName('NPC Density');
    });
  });

  describe('with descriptions', () => {
    const optionsWithDescriptions = [
      { value: 'heroic', label: 'Heroic', description: 'Characters rarely fall' },
      { value: 'standard', label: 'Standard', description: 'Balanced challenge' },
      { value: 'brutal', label: 'Brutal', description: 'Expect casualties' },
    ];

    it('renders descriptions when provided', () => {
      render(
        <OptionButtonGroup
          options={optionsWithDescriptions}
          value="standard"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Characters rarely fall')).toBeInTheDocument();
      expect(screen.getByText('Balanced challenge')).toBeInTheDocument();
      expect(screen.getByText('Expect casualties')).toBeInTheDocument();
    });
  });
});
