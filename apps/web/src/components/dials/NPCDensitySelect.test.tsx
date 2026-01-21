/**
 * NPCDensitySelect Component Tests
 *
 * TDD tests for NPC density selector with descriptions
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NPCDensitySelect } from './NPCDensitySelect';

describe('NPCDensitySelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all three NPC density options', () => {
      render(<NPCDensitySelect value="moderate" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /sparse/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /moderate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rich/i })).toBeInTheDocument();
    });

    it('shows descriptions for each density option', () => {
      render(<NPCDensitySelect value="moderate" onChange={mockOnChange} />);

      expect(screen.getByText(/few named npcs/i)).toBeInTheDocument();
      expect(screen.getByText(/standard cast/i)).toBeInTheDocument();
      expect(screen.getByText(/ensemble cast/i)).toBeInTheDocument();
    });

    it('highlights selected density with aria-pressed', () => {
      render(<NPCDensitySelect value="rich" onChange={mockOnChange} />);

      const richButton = screen.getByRole('button', { name: /rich/i });
      expect(richButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders optional label', () => {
      render(<NPCDensitySelect value="moderate" onChange={mockOnChange} label="NPC Density" />);

      expect(screen.getByText('NPC Density')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <NPCDensitySelect value="moderate" onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('selection', () => {
    it('calls onChange when density is selected', async () => {
      const user = userEvent.setup();
      render(<NPCDensitySelect value="moderate" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /sparse/i }));

      expect(mockOnChange).toHaveBeenCalledWith('sparse');
    });

    it('does not call onChange when same density is clicked', async () => {
      const user = userEvent.setup();
      render(<NPCDensitySelect value="moderate" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /moderate/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(<NPCDensitySelect value="sparse" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /sparse/i })).toHaveAttribute('aria-pressed', 'true');

      rerender(<NPCDensitySelect value="rich" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /sparse/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /rich/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled', () => {
      render(<NPCDensitySelect value="moderate" onChange={mockOnChange} disabled />);

      expect(screen.getByRole('button', { name: /sparse/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /moderate/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /rich/i })).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<NPCDensitySelect value="moderate" onChange={mockOnChange} disabled />);

      await user.click(screen.getByRole('button', { name: /sparse/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for buttons', () => {
      render(<NPCDensitySelect value="moderate" onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('buttons have aria-pressed state', () => {
      render(<NPCDensitySelect value="rich" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /moderate/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /rich/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
