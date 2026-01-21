/**
 * SceneCountSelect Component Tests
 *
 * TDD tests for scene count selector (3-6 scenes)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SceneCountSelect } from './SceneCountSelect';

describe('SceneCountSelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all four scene count options', () => {
      render(<SceneCountSelect value={4} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /3/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /4/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /6/i })).toBeInTheDocument();
    });

    it('highlights selected scene count with aria-pressed', () => {
      render(<SceneCountSelect value={5} onChange={mockOnChange} />);

      const count5Button = screen.getByRole('button', { name: /5/i });
      expect(count5Button).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders optional label', () => {
      render(<SceneCountSelect value={4} onChange={mockOnChange} label="Scene Count" />);

      expect(screen.getByText('Scene Count')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SceneCountSelect value={4} onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('selection', () => {
    it('calls onChange when scene count is selected', async () => {
      const user = userEvent.setup();
      render(<SceneCountSelect value={4} onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /6/i }));

      expect(mockOnChange).toHaveBeenCalledWith(6);
    });

    it('does not call onChange when same count is clicked', async () => {
      const user = userEvent.setup();
      render(<SceneCountSelect value={4} onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /4/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(<SceneCountSelect value={3} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /3/i })).toHaveAttribute('aria-pressed', 'true');

      rerender(<SceneCountSelect value={6} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /3/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /6/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled', () => {
      render(<SceneCountSelect value={4} onChange={mockOnChange} disabled />);

      expect(screen.getByRole('button', { name: /3/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /4/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /5/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /6/i })).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<SceneCountSelect value={4} onChange={mockOnChange} disabled />);

      await user.click(screen.getByRole('button', { name: /3/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for buttons', () => {
      render(<SceneCountSelect value={4} onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('buttons have aria-pressed state', () => {
      render(<SceneCountSelect value={5} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /4/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /5/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
