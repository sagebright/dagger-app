/**
 * MultiSelectChips Component Tests
 *
 * TDD tests for multi-select chips with max selection limit
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiSelectChips } from './MultiSelectChips';

const sampleOptions = [
  { id: 'redemption', label: 'Redemption' },
  { id: 'sacrifice', label: 'Sacrifice' },
  { id: 'identity', label: 'Identity' },
  { id: 'power-corruption', label: 'Power & Corruption' },
  { id: 'found-family', label: 'Found Family' },
];

describe('MultiSelectChips', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all option chips', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Redemption')).toBeInTheDocument();
      expect(screen.getByText('Sacrifice')).toBeInTheDocument();
      expect(screen.getByText('Identity')).toBeInTheDocument();
      expect(screen.getByText('Power & Corruption')).toBeInTheDocument();
      expect(screen.getByText('Found Family')).toBeInTheDocument();
    });

    it('renders chips as buttons', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(5);
    });

    it('highlights selected chips', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption', 'identity']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const redemptionChip = screen.getByText('Redemption').closest('button');
      const identityChip = screen.getByText('Identity').closest('button');
      const sacrificeChip = screen.getByText('Sacrifice').closest('button');

      expect(redemptionChip).toHaveAttribute('aria-pressed', 'true');
      expect(identityChip).toHaveAttribute('aria-pressed', 'true');
      expect(sacrificeChip).toHaveAttribute('aria-pressed', 'false');
    });

    it('applies custom className', () => {
      const { container } = render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders optional label', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
          label="Themes"
        />
      );

      expect(screen.getByText('Themes')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onChange with added item when unselected chip is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByText('Sacrifice'));

      expect(mockOnChange).toHaveBeenCalledWith(['redemption', 'sacrifice']);
    });

    it('calls onChange with removed item when selected chip is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption', 'sacrifice']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByText('Redemption'));

      expect(mockOnChange).toHaveBeenCalledWith(['sacrifice']);
    });

    it('allows selection up to maxSelections', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption', 'sacrifice']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByText('Identity'));

      expect(mockOnChange).toHaveBeenCalledWith([
        'redemption',
        'sacrifice',
        'identity',
      ]);
    });
  });

  describe('max selection limit', () => {
    it('prevents selection beyond maxSelections', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption', 'sacrifice', 'identity']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByText('Power & Corruption'));

      // Should not be called because max is reached
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('disables unselected chips when max is reached', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption', 'sacrifice', 'identity']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const powerChip = screen.getByText('Power & Corruption').closest('button');
      const foundFamilyChip = screen.getByText('Found Family').closest('button');

      expect(powerChip).toBeDisabled();
      expect(foundFamilyChip).toBeDisabled();
    });

    it('keeps selected chips enabled when max is reached (for deselection)', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption', 'sacrifice', 'identity']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const redemptionChip = screen.getByText('Redemption').closest('button');
      const sacrificeChip = screen.getByText('Sacrifice').closest('button');

      expect(redemptionChip).not.toBeDisabled();
      expect(sacrificeChip).not.toBeDisabled();
    });

    it('shows selection count indicator', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption', 'sacrifice']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/2.*\/.*3/)).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables all chips when disabled', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption']}
          maxSelections={3}
          onChange={mockOnChange}
          disabled
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
          disabled
        />
      );

      await user.click(screen.getByText('Redemption'));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('keyboard accessibility', () => {
    it('supports Tab navigation between chips', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      await user.tab();
      expect(screen.getByText('Redemption').closest('button')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Sacrifice').closest('button')).toHaveFocus();
    });

    it('selects chip with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const chip = screen.getByText('Identity').closest('button')!;
      chip.focus();
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith(['identity']);
    });

    it('selects chip with Space key', async () => {
      const user = userEvent.setup();
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const chip = screen.getByText('Found Family').closest('button')!;
      chip.focus();
      await user.keyboard(' ');

      expect(mockOnChange).toHaveBeenCalledWith(['found-family']);
    });
  });

  describe('accessibility', () => {
    it('has role group for chip container', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('has aria-pressed on all chips', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('has accessible names for all chips', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('unified button styling (issue #83)', () => {
    it('uses rounded-lg border radius to match other dial buttons', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const chip = screen.getByText('Redemption').closest('button');
      expect(chip).toHaveClass('rounded-lg');
    });

    it('uses border-2 width to match other dial buttons', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const chip = screen.getByText('Redemption').closest('button');
      expect(chip).toHaveClass('border-2');
    });

    it('uses px-4 py-2 padding to match other dial buttons', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const chip = screen.getByText('Redemption').closest('button');
      expect(chip).toHaveClass('px-4');
      expect(chip).toHaveClass('py-2');
    });

    it('selected chips use gold-500 border to match other dial buttons', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={['redemption']}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const selectedChip = screen.getByText('Redemption').closest('button');
      expect(selectedChip).toHaveClass('border-gold-500');
    });

    it('unselected chips use ink-300 border in light mode', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const chip = screen.getByText('Redemption').closest('button');
      expect(chip).toHaveClass('border-ink-300');
    });

    it('has focus ring styling matching other dial buttons', () => {
      render(
        <MultiSelectChips
          options={sampleOptions}
          selected={[]}
          maxSelections={3}
          onChange={mockOnChange}
        />
      );

      const chip = screen.getByText('Redemption').closest('button');
      expect(chip).toHaveClass('focus:ring-2');
      expect(chip).toHaveClass('focus:ring-gold-400');
    });
  });
});
