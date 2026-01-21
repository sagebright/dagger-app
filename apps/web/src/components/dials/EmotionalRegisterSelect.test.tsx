/**
 * EmotionalRegisterSelect Component Tests
 *
 * TDD tests for emotional register selector
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmotionalRegisterSelect } from './EmotionalRegisterSelect';

describe('EmotionalRegisterSelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all five emotional register options', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /thrilling/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tense/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /heartfelt/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bittersweet/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /epic/i })).toBeInTheDocument();
    });

    it('highlights selected register with aria-pressed', () => {
      render(<EmotionalRegisterSelect value="epic" onChange={mockOnChange} />);

      const epicButton = screen.getByRole('button', { name: /epic/i });
      expect(epicButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders optional label', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} label="Emotional Register" />);

      expect(screen.getByText('Emotional Register')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('selection', () => {
    it('calls onChange when register is selected', async () => {
      const user = userEvent.setup();
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /thrilling/i }));

      expect(mockOnChange).toHaveBeenCalledWith('thrilling');
    });

    it('does not call onChange when same register is clicked', async () => {
      const user = userEvent.setup();
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /heartfelt/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(<EmotionalRegisterSelect value="thrilling" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /thrilling/i })).toHaveAttribute('aria-pressed', 'true');

      rerender(<EmotionalRegisterSelect value="bittersweet" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /thrilling/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /bittersweet/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} disabled />);

      expect(screen.getByRole('button', { name: /thrilling/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /tense/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /heartfelt/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /bittersweet/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /epic/i })).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} disabled />);

      await user.click(screen.getByRole('button', { name: /thrilling/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for buttons', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('buttons have aria-pressed state', () => {
      render(<EmotionalRegisterSelect value="epic" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /tense/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /epic/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
