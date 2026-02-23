/**
 * ChatPanel — Left-side chat container (65% of layout)
 *
 * Renders a scrollable message list with a pinned input area at the bottom.
 * Messages are displayed using MessageBubble components, with a
 * ThinkingIndicator when the assistant is processing.
 *
 * Shared across all stages — accepts messages and callbacks as props.
 * No stage-specific logic is embedded here.
 */

import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ChatInput } from './ChatInput';
import type { ChatMessage } from '@/stores/chatStore';

// =============================================================================
// Types
// =============================================================================

export interface ChatPanelProps {
  /** Messages to display in chronological order */
  messages: ChatMessage[];
  /** Whether the assistant is currently streaming */
  isStreaming: boolean;
  /** Whether the assistant is thinking (before streaming starts) */
  isThinking: boolean;
  /** Called when the user submits a message */
  onSendMessage: (message: string) => void;
  /** Placeholder text for the input */
  inputPlaceholder?: string;
  /** When true, hides the input and shows a read-only indicator */
  isReadOnly?: boolean;
  /** Label shown in the read-only indicator (e.g., "Invoking") */
  readOnlyStageLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ChatPanel({
  messages,
  isStreaming,
  isThinking,
  onSendMessage,
  inputPlaceholder,
  isReadOnly = false,
  readOnlyStageLabel,
}: ChatPanelProps) {
  const messageAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or content streams
  useEffect(() => {
    const area = messageAreaRef.current;
    if (!area) return;
    area.scrollTop = area.scrollHeight;
  }, [messages, isThinking]);

  return (
    <div className="chat-panel" role="region" aria-label="Chat conversation">
      {/* Scrollable message area */}
      <div
        ref={messageAreaRef}
        className="message-area scrollbar-thin"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="flex flex-col gap-[var(--message-gap)] message-stagger">
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={msg.isStreaming}
              isGreeting={index === 0 && msg.role === 'assistant'}
            />
          ))}
          {isThinking && <ThinkingIndicator />}
        </div>
      </div>

      {/* Pinned input area or read-only indicator */}
      {isReadOnly ? (
        <ReadOnlyIndicator stageLabel={readOnlyStageLabel} />
      ) : (
        <ChatInput
          onSubmit={onSendMessage}
          isDisabled={isStreaming || isThinking}
          placeholder={inputPlaceholder}
        />
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ReadOnlyIndicatorProps {
  stageLabel?: string;
}

function ReadOnlyIndicator({ stageLabel }: ReadOnlyIndicatorProps) {
  const label = stageLabel ? `Viewing ${stageLabel}` : 'Read-only';

  return (
    <div
      className="input-area flex items-center justify-center"
      role="status"
      aria-label={`${label} - read-only`}
    >
      <div
        className="flex items-center gap-2 text-[13px] py-3"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>{label}</span>
      </div>
    </div>
  );
}
