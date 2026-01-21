/**
 * ConfirmDefaultsDialog Component Tests
 *
 * Tests for the confirmation dialog that appears when the user
 * continues with unset optional dials, showing default values.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDefaultsDialog } from './ConfirmDefaultsDialog';

describe('ConfirmDefaultsDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockUnsetDials = [
    { label: 'Tone', defaultValue: 'Balanced' },
    { label: 'NPC Density', defaultValue: 'Moderate' },
    { label: 'Lethality', defaultValue: 'Standard' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal with dialog role', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays title indicating default values will be used', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading', { name: /default/i })).toBeInTheDocument();
    });

    it('displays description text about unset dials', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/haven't been set/i)).toBeInTheDocument();
    });

    it('lists each unset dial with its default value', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Check each dial is displayed with its default value
      expect(screen.getByText(/Tone/)).toBeInTheDocument();
      expect(screen.getByText(/Balanced/)).toBeInTheDocument();
      expect(screen.getByText(/NPC Density/)).toBeInTheDocument();
      expect(screen.getByText(/Moderate/)).toBeInTheDocument();
      expect(screen.getByText(/Lethality/)).toBeInTheDocument();
      expect(screen.getByText(/Standard/)).toBeInTheDocument();
    });

    it('displays Go Back button', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    it('displays Continue Anyway button', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /continue anyway/i })).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('calls onCancel when Go Back button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: /go back/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Continue Anyway button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: /continue anyway/i }));

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has aria-labelledby pointing to title', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('has aria-describedby pointing to description', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('closes dialog when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('traps focus within the dialog', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Get buttons
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      const continueButton = screen.getByRole('button', { name: /continue anyway/i });

      // Initial focus should be on Go Back button
      await waitFor(() => {
        expect(goBackButton).toHaveFocus();
      });

      // Tab moves to Continue Anyway
      await user.tab();
      expect(continueButton).toHaveFocus();

      // Tab again should cycle back to first focusable element
      await user.tab();
      expect(goBackButton).toHaveFocus();
    });

    it('sets initial focus to Go Back button on open', async () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={mockUnsetDials}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /go back/i })).toHaveFocus();
      });
    });
  });

  describe('empty state', () => {
    it('handles empty unsetDials array gracefully', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={[]}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Should still render the dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('single dial', () => {
    it('displays correctly with a single unset dial', () => {
      render(
        <ConfirmDefaultsDialog
          unsetDials={[{ label: 'Tone', defaultValue: 'Balanced' }]}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Tone/)).toBeInTheDocument();
      expect(screen.getByText(/Balanced/)).toBeInTheDocument();
    });
  });
});
