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

  /** Helper to get register option buttons (excluding regenerate buttons) */
  const getRegisterButton = (name: RegExp) => {
    // Register buttons have aria-pressed attribute, regenerate buttons don't
    const buttons = screen.getAllByRole('button');
    return buttons.find(
      (btn) => btn.hasAttribute('aria-pressed') && btn.textContent?.match(name)
    );
  };

  describe('rendering', () => {
    it('renders all five emotional register options', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      expect(getRegisterButton(/Thrilling/)).toBeInTheDocument();
      expect(getRegisterButton(/Tense/)).toBeInTheDocument();
      expect(getRegisterButton(/Heartfelt/)).toBeInTheDocument();
      expect(getRegisterButton(/Bittersweet/)).toBeInTheDocument();
      expect(getRegisterButton(/Epic/)).toBeInTheDocument();
    });

    it('highlights selected register with aria-pressed', () => {
      render(<EmotionalRegisterSelect value="epic" onChange={mockOnChange} />);

      const epicButton = getRegisterButton(/Epic/);
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

      const thrillingButton = getRegisterButton(/Thrilling/);
      await user.click(thrillingButton!);

      expect(mockOnChange).toHaveBeenCalledWith('thrilling');
    });

    it('does not call onChange when same register is clicked', async () => {
      const user = userEvent.setup();
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      const heartfeltButton = getRegisterButton(/Heartfelt/);
      await user.click(heartfeltButton!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(<EmotionalRegisterSelect value="thrilling" onChange={mockOnChange} />);

      expect(getRegisterButton(/Thrilling/)).toHaveAttribute('aria-pressed', 'true');

      rerender(<EmotionalRegisterSelect value="bittersweet" onChange={mockOnChange} />);

      expect(getRegisterButton(/Thrilling/)).toHaveAttribute('aria-pressed', 'false');
      expect(getRegisterButton(/Bittersweet/)).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all register buttons when disabled', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} disabled />);

      expect(getRegisterButton(/Thrilling/)).toBeDisabled();
      expect(getRegisterButton(/Tense/)).toBeDisabled();
      expect(getRegisterButton(/Heartfelt/)).toBeDisabled();
      expect(getRegisterButton(/Bittersweet/)).toBeDisabled();
      expect(getRegisterButton(/Epic/)).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} disabled />);

      const thrillingButton = getRegisterButton(/Thrilling/);
      await user.click(thrillingButton!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for buttons', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('register buttons have aria-pressed state', () => {
      render(<EmotionalRegisterSelect value="epic" onChange={mockOnChange} />);

      expect(getRegisterButton(/Tense/)).toHaveAttribute('aria-pressed', 'false');
      expect(getRegisterButton(/Epic/)).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('AI example stubs', () => {
    it('displays pop culture example for each emotional register option', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      // Check that examples are displayed for each register
      expect(screen.getByText(/like 'Braveheart'/i)).toBeInTheDocument();
      expect(screen.getByText(/like 'Manchester by the Sea'/i)).toBeInTheDocument();
      expect(screen.getByText(/like 'Up'/i)).toBeInTheDocument();
      expect(screen.getByText(/like 'No Country for Old Men'/i)).toBeInTheDocument();
    });

    it('styles examples as secondary/muted text', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      const exampleText = screen.getByText(/like 'Braveheart'/i);
      expect(exampleText).toHaveClass('text-ink-400');
    });

    it('renders regenerate button for each emotional register option', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      expect(regenerateButtons).toHaveLength(5); // One for each register option
    });

    it('regenerate button logs to console when clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const user = userEvent.setup();
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      await user.click(regenerateButtons[0]);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Regenerate example')
      );
      consoleSpy.mockRestore();
    });

    it('regenerate button does not trigger register change', async () => {
      const user = userEvent.setup();
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      await user.click(regenerateButtons[0]);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('regenerate button is visible within each option', () => {
      render(<EmotionalRegisterSelect value="thrilling" onChange={mockOnChange} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      regenerateButtons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it('disables regenerate buttons when component is disabled', () => {
      render(<EmotionalRegisterSelect value="heartfelt" onChange={mockOnChange} disabled />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      regenerateButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });
});
