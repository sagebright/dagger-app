/**
 * ConfirmCheckmark Component Tests
 *
 * TDD tests for a visual indicator showing dial confirmation state.
 * Displays a checkmark when a dial value has been confirmed by the user.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmCheckmark } from './ConfirmCheckmark';

describe('ConfirmCheckmark', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  describe('rendering', () => {
    it('renders as a button', () => {
      render(<ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders unchecked state when not confirmed', () => {
      render(<ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders checked state when confirmed', () => {
      render(<ConfirmCheckmark confirmed={true} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('displays checkmark icon when confirmed', () => {
      render(<ConfirmCheckmark confirmed={true} onToggle={mockOnToggle} />);

      // Check for visible checkmark (using test-id or checking for the SVG)
      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ConfirmCheckmark
          confirmed={false}
          onToggle={mockOnToggle}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('interaction', () => {
    it('calls onToggle when clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />);

      await user.click(screen.getByRole('button'));

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle when confirmed and clicked (to unconfirm)', async () => {
      const user = userEvent.setup();
      render(<ConfirmCheckmark confirmed={true} onToggle={mockOnToggle} />);

      await user.click(screen.getByRole('button'));

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(
        <ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} disabled />
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onToggle when disabled', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} disabled />
      );

      await user.click(screen.getByRole('button'));

      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe('keyboard accessibility', () => {
    it('is focusable', async () => {
      const user = userEvent.setup();
      render(<ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />);

      await user.tab();

      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('toggles with Enter key', async () => {
      const user = userEvent.setup();
      render(<ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('toggles with Space key', async () => {
      const user = userEvent.setup();
      render(<ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has accessible name', () => {
      render(<ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });

    it('has aria-pressed state reflecting confirmation', () => {
      const { rerender } = render(
        <ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

      rerender(<ConfirmCheckmark confirmed={true} onToggle={mockOnToggle} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('provides custom aria-label via label prop', () => {
      render(
        <ConfirmCheckmark
          confirmed={false}
          onToggle={mockOnToggle}
          label="Confirm party size"
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Confirm party size'
      );
    });
  });

  describe('visual styling', () => {
    it('has different visual state when confirmed', () => {
      const { rerender } = render(
        <ConfirmCheckmark confirmed={false} onToggle={mockOnToggle} />
      );

      const buttonUnconfirmed = screen.getByRole('button');
      const unconfirmedClasses = buttonUnconfirmed.className;

      rerender(<ConfirmCheckmark confirmed={true} onToggle={mockOnToggle} />);

      const buttonConfirmed = screen.getByRole('button');
      const confirmedClasses = buttonConfirmed.className;

      // Classes should be different between states
      expect(unconfirmedClasses).not.toBe(confirmedClasses);
    });
  });
});
