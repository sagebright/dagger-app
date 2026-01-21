/**
 * ChatContainer Component
 *
 * Main chat interface that orchestrates message display and input.
 * Manages auto-scroll behavior and shows connection/typing states.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';

/** Distance from bottom (in pixels) within which auto-scroll activates */
const SCROLL_BOTTOM_THRESHOLD = 100;

export interface ChatContainerProps {
  /** Session ID for this chat session */
  sessionId: string;
  /** Callback when a dial value is updated (for inline widgets) */
  onDialUpdate?: (dialId: string, value: unknown) => void;
  /** Additional CSS classes */
  className?: string;
}

export function ChatContainer({
  sessionId,
  // onDialUpdate will be used for inline dial widgets (future implementation)
  onDialUpdate: _onDialUpdate,
  className = '',
}: ChatContainerProps) {
  const { messages, isStreaming, connectionStatus, sendMessage } = useChat({
    sessionId,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Determine if we should show typing indicator
  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
    lastMessage?.role === 'user' && !isStreaming && connectionStatus === 'connected';

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_BOTTOM_THRESHOLD;

    setUserScrolledUp(!isNearBottom);
  }, []);

  // Auto-scroll to bottom on new messages (unless user scrolled up)
  useEffect(() => {
    if (!userScrolledUp && scrollContainerRef.current?.scrollTo) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isStreaming, userScrolledUp]);

  // Jump to bottom handler
  const handleJumpToBottom = useCallback(() => {
    setUserScrolledUp(false);
    if (scrollContainerRef.current?.scrollTo) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Render connection status indicator
  const renderConnectionStatus = () => {
    if (connectionStatus === 'reconnecting') {
      return (
        <div className="text-center py-2 text-sm text-gold dark:text-gold-400 bg-gold-100/50 dark:bg-gold-900/20">
          Reconnecting...
        </div>
      );
    }
    if (connectionStatus === 'disconnected') {
      return (
        <div className="text-center py-2 text-sm text-blood dark:text-blood-400 bg-blood-100/50 dark:bg-blood-900/20">
          Disconnected
        </div>
      );
    }
    return null;
  };

  return (
    <div
      data-testid="chat-container"
      className={`flex flex-col h-full bg-parchment-50 dark:bg-shadow-900 ${className}`}
    >
      {/* Connection status banner */}
      {renderConnectionStatus()}

      {/* Message list */}
      <div
        ref={scrollContainerRef}
        data-testid="message-list"
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-fantasy"
        onScroll={handleScroll}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreamingMessage = isLastMessage && isStreaming && message.role === 'assistant';

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={isStreamingMessage}
            />
          );
        })}

        {/* Typing indicator */}
        {showTypingIndicator && <TypingIndicator />}
      </div>

      {/* Jump to bottom button */}
      {userScrolledUp && (
        <button
          onClick={handleJumpToBottom}
          aria-label="Jump to latest messages"
          className="absolute bottom-20 right-4 btn-secondary text-sm shadow-fantasy"
        >
          ↓ New messages
        </button>
      )}

      {/* Input area */}
      <div className="border-t border-ink-200 dark:border-shadow-600 p-4 bg-parchment-100 dark:bg-shadow-800">
        <ChatInput
          onSend={sendMessage}
          disabled={connectionStatus !== 'connected'}
          placeholder={
            connectionStatus === 'connected'
              ? 'Type a message...'
              : 'Connecting...'
          }
        />
      </div>
    </div>
  );
}
