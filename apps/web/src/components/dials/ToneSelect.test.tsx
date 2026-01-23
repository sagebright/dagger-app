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

  /** Helper to get tone option buttons (excluding regenerate buttons) */
  const getToneButton = (name: RegExp) => {
    // Tone buttons have aria-pressed attribute, regenerate buttons don't
    const buttons = screen.getAllByRole('button');
    return buttons.find(
      (btn) => btn.hasAttribute('aria-pressed') && btn.textContent?.match(name)
    );
  };

  describe('rendering', () => {
    it('renders all five tone options', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      expect(getToneButton(/Grim/)).toBeInTheDocument();
      expect(getToneButton(/Serious/)).toBeInTheDocument();
      expect(getToneButton(/Balanced/)).toBeInTheDocument();
      expect(getToneButton(/Lighthearted/)).toBeInTheDocument();
      expect(getToneButton(/Whimsical/)).toBeInTheDocument();
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

      const seriousButton = getToneButton(/Serious/);
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

      const grimButton = getToneButton(/Grim/);
      await user.click(grimButton!);

      expect(mockOnChange).toHaveBeenCalledWith('grim');
    });

    it('does not call onChange when same tone is clicked', async () => {
      const user = userEvent.setup();
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      const balancedButton = getToneButton(/Balanced/);
      await user.click(balancedButton!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('updates visual selection on value change', () => {
      const { rerender } = render(<ToneSelect value="grim" onChange={mockOnChange} />);

      expect(getToneButton(/Grim/)).toHaveAttribute('aria-pressed', 'true');

      rerender(<ToneSelect value="whimsical" onChange={mockOnChange} />);

      expect(getToneButton(/Grim/)).toHaveAttribute('aria-pressed', 'false');
      expect(getToneButton(/Whimsical/)).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables all tone buttons when disabled', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} disabled />);

      expect(getToneButton(/Grim/)).toBeDisabled();
      expect(getToneButton(/Serious/)).toBeDisabled();
      expect(getToneButton(/Balanced/)).toBeDisabled();
      expect(getToneButton(/Lighthearted/)).toBeDisabled();
      expect(getToneButton(/Whimsical/)).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<ToneSelect value="balanced" onChange={mockOnChange} disabled />);

      const grimButton = getToneButton(/Grim/);
      await user.click(grimButton!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper role group for buttons', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('tone buttons have aria-pressed state', () => {
      render(<ToneSelect value="serious" onChange={mockOnChange} />);

      expect(getToneButton(/Grim/)).toHaveAttribute('aria-pressed', 'false');
      expect(getToneButton(/Serious/)).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('AI example stubs', () => {
    it('displays pop culture example for each tone option', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      // Check that examples are displayed for each tone
      expect(screen.getByText(/like 'Game of Thrones'/i)).toBeInTheDocument();
      expect(screen.getByText(/like 'The Princess Bride'/i)).toBeInTheDocument();
      expect(screen.getByText(/like 'Monty Python/i)).toBeInTheDocument();
    });

    it('styles examples as secondary/muted text', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      const exampleText = screen.getByText(/like 'Game of Thrones'/i);
      expect(exampleText).toHaveClass('text-ink-400');
    });

    it('renders regenerate button for each tone option', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      expect(regenerateButtons).toHaveLength(5); // One for each tone option
    });

    it('regenerate button logs to console when clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const user = userEvent.setup();
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      await user.click(regenerateButtons[0]);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Regenerate example')
      );
      consoleSpy.mockRestore();
    });

    it('regenerate button does not trigger tone change', async () => {
      const user = userEvent.setup();
      render(<ToneSelect value="balanced" onChange={mockOnChange} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      await user.click(regenerateButtons[0]);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('regenerate button is visible within each option', () => {
      render(<ToneSelect value="grim" onChange={mockOnChange} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      regenerateButtons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it('disables regenerate buttons when component is disabled', () => {
      render(<ToneSelect value="balanced" onChange={mockOnChange} disabled />);

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      regenerateButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('AI example generation', () => {
    it('calls onRegenerateExample when regenerate button is clicked', async () => {
      const mockOnRegenerateExample = vi.fn();
      const user = userEvent.setup();
      render(
        <ToneSelect
          value="balanced"
          onChange={mockOnChange}
          onRegenerateExample={mockOnRegenerateExample}
        />
      );

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      await user.click(regenerateButtons[0]); // Grim

      expect(mockOnRegenerateExample).toHaveBeenCalledWith('grim');
    });

    it('shows loading spinner when generating example', () => {
      render(
        <ToneSelect
          value="balanced"
          onChange={mockOnChange}
          loadingOption="grim"
        />
      );

      // Find the Grim option's regenerate button - should have spinner
      const grimOption = screen.getByText(/Game of Thrones/i).parentElement;
      expect(grimOption).toContainHTML('animate-spin');
    });

    it('displays custom example when provided', () => {
      render(
        <ToneSelect
          value="balanced"
          onChange={mockOnChange}
          customExamples={{ grim: "Custom example like 'The Dark Knight'" }}
        />
      );

      expect(screen.getByText(/like 'The Dark Knight'/i)).toBeInTheDocument();
    });

    it('uses default example when no custom example is provided', () => {
      render(
        <ToneSelect
          value="balanced"
          onChange={mockOnChange}
          customExamples={{ serious: "Custom example for serious" }}
        />
      );

      // Grim should still show default
      expect(screen.getByText(/like 'Game of Thrones'/i)).toBeInTheDocument();
    });

    it('disables regenerate button while loading', () => {
      render(
        <ToneSelect
          value="balanced"
          onChange={mockOnChange}
          loadingOption="grim"
        />
      );

      const regenerateButtons = screen.getAllByRole('button', { name: /regenerate example/i });
      // First button (Grim) should be disabled during loading
      expect(regenerateButtons[0]).toBeDisabled();
    });

    it('shows error state for option with error', () => {
      render(
        <ToneSelect
          value="balanced"
          onChange={mockOnChange}
          errorOption="grim"
        />
      );

      // The Grim option should show an error indicator
      const grimOption = screen.getByText(/Game of Thrones/i).closest('div');
      expect(grimOption?.className).toContain('border-blood');
    });
  });
});
