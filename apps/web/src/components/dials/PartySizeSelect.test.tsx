/**
 * PartySizeSelect Component Tests
 *
 * TDD tests for party size selector (2-5 players)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartySizeSelect } from './PartySizeSelect';

describe('PartySizeSelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all four party size options', () => {
      render(<PartySizeSelect value={4} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /2/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /3/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /4/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument();
    });

    it('highlights selected party size with aria-pressed', () => {
      render(<PartySizeSelect value={3} onChange={mockOnChange} />);

      const size3Button = screen.getByRole('button', { name: /3/i });
      expect(size3Button).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders optional label', () => {
      render(<PartySizeSelect value={4} onChange={mockOnChange} label="Party Size" />);

      expect(screen.getByText('Party Size')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <PartySizeSelect value={4} onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('selection', () => {
    it('calls onChange when party size is selected', async () => {
      const user = userEvent.setup();
      render(<PartySizeSelect value={4} onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /2/i }));

      expect(mockOnChange).toHaveBeenCalledWith(2);
    });

    it('does not call onChange when same size is clicked', async () => {
      const user = userEvent.setup();
      render(<PartySizeSelect value={4} onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /4/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(<PartySizeSelect value={2} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /2/i })).toHaveAttribute('aria-pressed', 'true');

      rerender(<PartySizeSelect value={5} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /2/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /5/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled', () => {
      render(<PartySizeSelect value={4} onChange={mockOnChange} disabled />);

      expect(screen.getByRole('button', { name: /2/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /3/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /4/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /5/i })).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<PartySizeSelect value={4} onChange={mockOnChange} disabled />);

      await user.click(screen.getByRole('button', { name: /2/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for buttons', () => {
      render(<PartySizeSelect value={4} onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('buttons have aria-pressed state', () => {
      render(<PartySizeSelect value={3} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /2/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /3/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
