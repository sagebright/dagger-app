/**
 * ErrorModal Component Tests
 *
 * Tests for the ErrorModal component that displays user-friendly error
 * messages with actionable instructions.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorModal } from './ErrorModal';
import type { StructuredErrorResponse } from '@dagger-app/shared-types';

const mockClaudeNotAvailableError: StructuredErrorResponse = {
  error: 'CLAUDE_NOT_AVAILABLE',
  title: 'Claude Code Not Available',
  message: 'Claude Code CLI is not installed or not authenticated.',
  instructions: [
    'Install Claude Code: curl -fsSL https://claude.ai/install.sh | bash',
    'Authenticate: Run "claude" in terminal and follow prompts',
    'Restart this application',
  ],
};

const mockGenerationFailedError: StructuredErrorResponse = {
  error: 'GENERATION_FAILED',
  title: 'Outline Generation Failed',
  message: 'An error occurred while generating the adventure outline.',
  instructions: [
    'Check your internet connection',
    'Try again in a few moments',
  ],
};

describe('ErrorModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays the error title prominently', () => {
      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('heading', { name: /claude code not available/i })).toBeInTheDocument();
    });

    it('displays the error message', () => {
      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/claude code cli is not installed/i)).toBeInTheDocument();
    });

    it('renders instructions as a numbered list', () => {
      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      // Check that instructions list exists
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      // Check all instructions are rendered
      expect(screen.getByText(/install claude code/i)).toBeInTheDocument();
      expect(screen.getByText(/authenticate.*run "claude"/i)).toBeInTheDocument();
      expect(screen.getByText(/restart this application/i)).toBeInTheDocument();
    });

    it('has a close button', () => {
      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /close|dismiss|ok/i })).toBeInTheDocument();
    });
  });

  describe('different error types', () => {
    it('displays GENERATION_FAILED error correctly', () => {
      render(
        <ErrorModal
          error={mockGenerationFailedError}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('heading', { name: /outline generation failed/i })).toBeInTheDocument();
      expect(screen.getByText(/error occurred while generating/i)).toBeInTheDocument();
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close|dismiss|ok/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has accessible modal role', () => {
      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-labelledby pointing to title', () => {
      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');

      // The title element should exist with the referenced id
      const titleId = dialog.getAttribute('aria-labelledby');
      const title = document.getElementById(titleId!);
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent(/claude code not available/i);
    });

    it('has aria-describedby pointing to message', () => {
      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby');

      // The message element should exist with the referenced id
      const descId = dialog.getAttribute('aria-describedby');
      const desc = document.getElementById(descId!);
      expect(desc).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('uses fantasy theme classes', () => {
      render(
        <ErrorModal
          error={mockClaudeNotAvailableError}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      // Check for fantasy theme - parchment background
      const modalContent = dialog.querySelector('[class*="parchment"]');
      expect(modalContent).toBeInTheDocument();
    });
  });
});
