/**
 * ChatInput — Textarea with submit button for chat messages
 *
 * Features:
 * - Auto-resizes as the user types (up to max-height)
 * - Submit on Enter (Shift+Enter for newline)
 * - Disabled during streaming
 * - Gold focus ring
 * - Diamond-shaped send button
 *
 * Shared across all stages — accepts placeholder as a prop.
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type FormEvent,
} from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ChatInputProps {
  /** Called when the user submits a message */
  onSubmit: (message: string) => void;
  /** Whether input should be disabled (e.g., during streaming) */
  isDisabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ChatInput({
  onSubmit,
  isDisabled = false,
  placeholder = 'What path shall we take?',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;

    onSubmit(trimmed);
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isDisabled, onSubmit]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleFormSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      handleSubmit();
    },
    [handleSubmit]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = 180;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  // Restore focus when the textarea re-enables after streaming ends
  useEffect(() => {
    if (!isDisabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isDisabled]);

  const hasContent = value.trim().length > 0;

  return (
    <div className="input-area">
      <form
        onSubmit={handleFormSubmit}
        className="relative max-w-[720px] mx-auto"
      >
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={3}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={isDisabled || !hasContent}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full border-none flex items-center justify-center transition-all duration-150"
          style={{
            background: 'var(--accent-gold)',
            color: 'var(--bg-primary)',
            opacity: hasContent && !isDisabled ? 0.9 : 0.3,
            cursor: hasContent && !isDisabled ? 'pointer' : 'default',
          }}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <polygon points="12,2 16,12 12,22 8,12" />
          </svg>
        </button>
      </form>
    </div>
  );
}
