/**
 * ToneSelect Component Tests
 *
 * TDD tests for tone selector with descriptions
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToneSelect } from './ToneSelect';

describe('ToneSelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all five tone options', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /grim/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /serious/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /balanced/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /lighthearted/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /whimsical/i })).toBeInTheDocument();
    });

    it('shows descriptions for each tone option', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      expect(screen.getByText(/morally complex/i)).toBeInTheDocument();
      expect(screen.getByText(/dramatic stakes/i)).toBeInTheDocument();
      expect(screen.getByText(/mix of drama/i)).toBeInTheDocument();
      expect(screen.getByText(/upbeat with heroic/i)).toBeInTheDocument();
      expect(screen.getByText(/playful, comedic/i)).toBeInTheDocument();
    });

    it('highlights selected tone with aria-pressed', () => {
      render(<ToneSelect value="serious" onChange={mockOnChange} />);

      const seriousButton = screen.getByRole('button', { name: /serious/i });
      expect(seriousButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders optional label', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} label="Adventure Tone" />);

      expect(screen.getByText('Adventure Tone')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ToneSelect value="balanced" onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('selection', () => {
    it('calls onChange when tone is selected', async () => {
      const user = userEvent.setup();
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /grim/i }));

      expect(mockOnChange).toHaveBeenCalledWith('grim');
    });

    it('does not call onChange when same tone is clicked', async () => {
      const user = userEvent.setup();
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /balanced/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(<ToneSelect value="grim" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /grim/i })).toHaveAttribute('aria-pressed', 'true');

      rerender(<ToneSelect value="whimsical" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /grim/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /whimsical/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} disabled />);

      expect(screen.getByRole('button', { name: /grim/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /serious/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /balanced/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /lighthearted/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /whimsical/i })).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<ToneSelect value="balanced" onChange={mockOnChange} disabled />);

      await user.click(screen.getByRole('button', { name: /grim/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for buttons', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('buttons have aria-pressed state', () => {
      render(<ToneSelect value="serious" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /grim/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /serious/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
