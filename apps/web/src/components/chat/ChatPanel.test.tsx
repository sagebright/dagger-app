/**
 * Tests for ChatPanel component
 *
 * Validates read-only mode behavior: input hidden, indicator shown.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';
import type { ChatMessage } from '@/stores/chatStore';

// =============================================================================
// Helpers
// =============================================================================

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello Sage',
    timestamp: '2026-02-20T00:00:00Z',
    isStreaming: false,
    toolCalls: [],
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Welcome, storyteller.',
    timestamp: '2026-02-20T00:00:01Z',
    isStreaming: false,
    toolCalls: [],
  },
];

function renderChatPanel(props: Partial<React.ComponentProps<typeof ChatPanel>> = {}) {
  const defaultProps = {
    messages: MOCK_MESSAGES,
    isStreaming: false,
    isThinking: false,
    onSendMessage: vi.fn(),
  };

  return render(<ChatPanel {...defaultProps} {...props} />);
}

// =============================================================================
// Tests
// =============================================================================

describe('ChatPanel', () => {
  it('renders messages', () => {
    renderChatPanel();

    expect(screen.getByText('Hello Sage')).toBeInTheDocument();
    expect(screen.getByText('Welcome, storyteller.')).toBeInTheDocument();
  });

  it('shows chat input in normal mode', () => {
    renderChatPanel();

    expect(screen.getByRole('textbox', { name: /chat message input/i })).toBeInTheDocument();
  });

  describe('read-only mode', () => {
    it('hides the chat input when isReadOnly is true', () => {
      renderChatPanel({ isReadOnly: true });

      expect(screen.queryByRole('textbox', { name: /chat message input/i })).not.toBeInTheDocument();
    });

    it('shows a read-only indicator with default label', () => {
      renderChatPanel({ isReadOnly: true });

      expect(screen.getByText('Read-only')).toBeInTheDocument();
    });

    it('shows a read-only indicator with stage label', () => {
      renderChatPanel({ isReadOnly: true, readOnlyStageLabel: 'Invoking' });

      expect(screen.getByText('Viewing Invoking')).toBeInTheDocument();
    });

    it('has an accessible status role on the indicator', () => {
      renderChatPanel({ isReadOnly: true, readOnlyStageLabel: 'Attuning' });

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Viewing Attuning - read-only');
    });

    it('still renders messages in read-only mode', () => {
      renderChatPanel({ isReadOnly: true });

      expect(screen.getByText('Hello Sage')).toBeInTheDocument();
      expect(screen.getByText('Welcome, storyteller.')).toBeInTheDocument();
    });
  });
});
