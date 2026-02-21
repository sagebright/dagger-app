/**
 * MessageBubble — Styled chat message for user or assistant
 *
 * User messages: right-aligned, subtle background, sans-serif
 * Assistant messages: left-aligned, "Sage" label, serif text, streaming cursor
 *
 * Shared across all stages — no stage-specific logic.
 */

import { memo, useEffect } from 'react';
import { StreamingText } from './StreamingText';
import { RevealText } from '@/components/ui/RevealText';
import { useChatStore } from '@/stores/chatStore';

// =============================================================================
// Types
// =============================================================================

export interface MessageBubbleProps {
  /** Message role determines styling */
  role: 'user' | 'assistant';
  /** Message text content */
  content: string;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
  /** Whether this is the first assistant message (greeting) */
  isGreeting?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export const MessageBubble = memo(function MessageBubble({
  role,
  content,
  isStreaming = false,
  isGreeting = false,
}: MessageBubbleProps) {
  const hasAnimatedGreeting = useChatStore((s) => s.hasAnimatedGreeting);
  const markGreetingAnimated = useChatStore((s) => s.markGreetingAnimated);

  // Mark greeting animation as played once RevealText has rendered
  const shouldReveal = isGreeting && !isStreaming && !hasAnimatedGreeting && content.trim() !== '';
  useEffect(() => {
    if (shouldReveal) {
      markGreetingAnimated();
    }
  }, [shouldReveal, markGreetingAnimated]);
  if (role === 'user') {
    return (
      <div
        className="max-w-[88%] self-end animate-message-appear"
        role="log"
        aria-label="Your message"
      >
        <div
          className="rounded-md px-4 py-3"
          style={{
            background: 'var(--user-msg-bg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="text-[15px] leading-[1.6]">{content}</div>
        </div>
      </div>
    );
  }

  // Assistant (Sage) message

  // Hide completed messages with no text content (tool-only turns)
  if (!isStreaming && content.trim() === '') {
    return null;
  }

  // Show thinking dots when streaming but no text has arrived yet (tool execution)
  if (isStreaming && content === '') {
    return (
      <div
        className="flex items-center gap-2 self-start animate-message-appear"
        role="status"
        aria-label="Sage is working"
      >
        <span className="sage-label">Sage</span>
        <div className="thinking-dots">
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-[88%] self-start animate-message-appear"
      role="log"
      aria-label="Sage message"
      aria-live={isStreaming ? 'polite' : undefined}
    >
      <div className="sage-label mb-1.5">Sage</div>
      {shouldReveal ? (
        <div className="font-serif text-[15px] leading-[1.7]" style={{ color: 'var(--text-primary)' }}>
          <RevealText text={content} />
        </div>
      ) : (
        <StreamingText content={content} isStreaming={isStreaming} />
      )}
    </div>
  );
});
