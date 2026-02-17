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
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={msg.isStreaming}
            />
          ))}
          {isThinking && <ThinkingIndicator />}
        </div>
      </div>

      {/* Pinned input area */}
      <ChatInput
        onSubmit={onSendMessage}
        isDisabled={isStreaming || isThinking}
        placeholder={inputPlaceholder}
      />
    </div>
  );
}
