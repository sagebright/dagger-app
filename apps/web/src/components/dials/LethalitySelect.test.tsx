/**
 * LethalitySelect Component Tests
 *
 * TDD tests for lethality selector with descriptions
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LethalitySelect } from './LethalitySelect';

describe('LethalitySelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders all four lethality options', () => {
      render(<LethalitySelect value="standard" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /heroic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /standard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dangerous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /brutal/i })).toBeInTheDocument();
    });

    it('shows descriptions for each lethality option', () => {
      render(<LethalitySelect value="standard" onChange={mockOnChange} />);

      expect(screen.getByText(/death is rare/i)).toBeInTheDocument();
      expect(screen.getByText(/tactical challenge/i)).toBeInTheDocument();
      expect(screen.getByText(/mistakes hurt/i)).toBeInTheDocument();
      expect(screen.getByText(/expect casualties/i)).toBeInTheDocument();
    });

    it('highlights selected lethality with aria-pressed', () => {
      render(<LethalitySelect value="dangerous" onChange={mockOnChange} />);

      const dangerousButton = screen.getByRole('button', { name: /dangerous/i });
      expect(dangerousButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders optional label', () => {
      render(<LethalitySelect value="standard" onChange={mockOnChange} label="Lethality" />);

      expect(screen.getByText('Lethality')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <LethalitySelect value="standard" onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('selection', () => {
    it('calls onChange when lethality is selected', async () => {
      const user = userEvent.setup();
      render(<LethalitySelect value="standard" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /brutal/i }));

      expect(mockOnChange).toHaveBeenCalledWith('brutal');
    });

    it('does not call onChange when same lethality is clicked', async () => {
      const user = userEvent.setup();
      render(<LethalitySelect value="standard" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button', { name: /standard/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(<LethalitySelect value="heroic" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /heroic/i })).toHaveAttribute('aria-pressed', 'true');

      rerender(<LethalitySelect value="brutal" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /heroic/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /brutal/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when disabled', () => {
      render(<LethalitySelect value="standard" onChange={mockOnChange} disabled />);

      expect(screen.getByRole('button', { name: /heroic/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /standard/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /dangerous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /brutal/i })).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<LethalitySelect value="standard" onChange={mockOnChange} disabled />);

      await user.click(screen.getByRole('button', { name: /heroic/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for buttons', () => {
      render(<LethalitySelect value="standard" onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('buttons have aria-pressed state', () => {
      render(<LethalitySelect value="dangerous" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /standard/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /dangerous/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
