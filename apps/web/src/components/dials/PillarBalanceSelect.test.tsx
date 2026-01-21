/**
 * PillarBalanceSelect Component Tests
 *
 * TDD tests for pillar balance priority ranking UI
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PillarBalanceSelect } from './PillarBalanceSelect';
import type { PillarBalance } from '@dagger-app/shared-types';

describe('PillarBalanceSelect', () => {
  const mockOnChange = vi.fn();

  const defaultValue: PillarBalance = {
    primary: 'combat',
    secondary: 'exploration',
    tertiary: 'social',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders three priority slots labeled 1st, 2nd, 3rd', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      // Each label appears twice: once in header, once in button
      expect(screen.getAllByText('1st')).toHaveLength(2);
      expect(screen.getAllByText('2nd')).toHaveLength(2);
      expect(screen.getAllByText('3rd')).toHaveLength(2);
    });

    it('renders all three pillar options', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      expect(screen.getByText('Combat')).toBeInTheDocument();
      expect(screen.getByText('Exploration')).toBeInTheDocument();
      expect(screen.getByText('Social')).toBeInTheDocument();
    });

    it('shows current assignments in slots', () => {
      const value: PillarBalance = {
        primary: 'social',
        secondary: 'combat',
        tertiary: 'exploration',
      };
      render(<PillarBalanceSelect value={value} onChange={mockOnChange} />);

      // The pillars should be displayed in their assigned slots
      const slots = screen.getAllByRole('listitem');
      expect(slots).toHaveLength(3);
    });

    it('renders optional label', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} label="Pillar Balance" />);

      expect(screen.getByText('Pillar Balance')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <PillarBalanceSelect value={defaultValue} onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('click-to-assign interaction', () => {
    it('allows clicking a pillar to cycle it to primary position', async () => {
      const user = userEvent.setup();
      const value: PillarBalance = {
        primary: 'combat',
        secondary: 'exploration',
        tertiary: 'social',
      };
      render(<PillarBalanceSelect value={value} onChange={mockOnChange} />);

      // Click on Social (currently tertiary) to make it primary
      await user.click(screen.getByRole('button', { name: /social/i }));

      // Should swap social to primary, and shift others
      expect(mockOnChange).toHaveBeenCalledWith({
        primary: 'social',
        secondary: 'combat',
        tertiary: 'exploration',
      });
    });

    it('does not call onChange when clicking already-primary pillar', async () => {
      const user = userEvent.setup();
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /combat/i }));

      // Primary is already combat, so no change
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('clicking secondary promotes it to primary and demotes current primary', async () => {
      const user = userEvent.setup();
      const value: PillarBalance = {
        primary: 'combat',
        secondary: 'exploration',
        tertiary: 'social',
      };
      render(<PillarBalanceSelect value={value} onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /exploration/i }));

      expect(mockOnChange).toHaveBeenCalledWith({
        primary: 'exploration',
        secondary: 'combat',
        tertiary: 'social',
      });
    });
  });

  describe('validation', () => {
    it('always has all three pillars assigned', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      // All three pillars should be visible
      expect(screen.getByText('Combat')).toBeInTheDocument();
      expect(screen.getByText('Exploration')).toBeInTheDocument();
      expect(screen.getByText('Social')).toBeInTheDocument();
    });

    it('enforces unique pillar assignments (no duplicates)', async () => {
      const user = userEvent.setup();
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      // After any interaction, all three pillars should still be unique
      await user.click(screen.getByRole('button', { name: /social/i }));

      const calledWith = mockOnChange.mock.calls[0][0] as PillarBalance;
      const pillars = [calledWith.primary, calledWith.secondary, calledWith.tertiary];
      const uniquePillars = new Set(pillars);
      expect(uniquePillars.size).toBe(3);
    });
  });

  describe('disabled state', () => {
    it('disables all pillar buttons when disabled', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} disabled />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} disabled />);

      await user.click(screen.getByRole('button', { name: /social/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('visual indicators', () => {
    it('highlights primary pillar with gold styling', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      const combatButton = screen.getByRole('button', { name: /combat/i });
      // Primary button should have the gold/selected styling class
      expect(combatButton.className).toMatch(/gold/);
    });

    it('shows position indicator on each pillar', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      // Each pillar button should show its position
      const combatButton = screen.getByRole('button', { name: /combat/i });
      const explorationButton = screen.getByRole('button', { name: /exploration/i });
      const socialButton = screen.getByRole('button', { name: /social/i });

      expect(within(combatButton).getByText('1st')).toBeInTheDocument();
      expect(within(explorationButton).getByText('2nd')).toBeInTheDocument();
      expect(within(socialButton).getByText('3rd')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for pillar buttons', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('buttons have accessible names', () => {
      render(<PillarBalanceSelect value={defaultValue} onChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });
});
