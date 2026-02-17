/**
 * Tests for conversation-history.ts
 *
 * Verifies compressConversationHistory:
 * - Empty history returns empty result
 * - Recent messages kept verbatim within window
 * - Older messages are compressed (truncated)
 * - Very old messages are dropped
 * - First message is always role: 'user'
 * - Metadata counts are accurate
 */

import { describe, it, expect } from 'vitest';
import { compressConversationHistory } from './conversation-history.js';
import type { SageMessage } from '@dagger-app/shared-types';

// =============================================================================
// Helpers
// =============================================================================

function createMessage(
  index: number,
  role: 'user' | 'assistant' = index % 2 === 0 ? 'user' : 'assistant',
  content?: string
): SageMessage {
  return {
    id: `msg-${index}`,
    session_id: 'session-1',
    role,
    content: content ?? `Message content ${index}`,
    tool_calls: null,
    token_count: null,
    created_at: new Date(Date.now() - (1000 - index) * 60000).toISOString(),
  };
}

function createMessages(count: number): SageMessage[] {
  return Array.from({ length: count }, (_, i) => createMessage(i));
}

// =============================================================================
// Tests
// =============================================================================

describe('compressConversationHistory', () => {
  describe('empty history', () => {
    it('should return empty result for empty array', () => {
      const result = compressConversationHistory([]);
      expect(result.messages).toEqual([]);
      expect(result.compressedCount).toBe(0);
      expect(result.droppedCount).toBe(0);
      expect(result.originalCount).toBe(0);
    });
  });

  describe('small history (within window)', () => {
    it('should keep all messages verbatim when under window size', () => {
      const messages = createMessages(5);
      const result = compressConversationHistory(messages);

      expect(result.messages).toHaveLength(5);
      expect(result.compressedCount).toBe(0);
      expect(result.droppedCount).toBe(0);
    });

    it('should preserve message content verbatim', () => {
      const messages = createMessages(3);
      const result = compressConversationHistory(messages);

      expect(result.messages[0].content).toBe('Message content 0');
      expect(result.messages[1].content).toBe('Message content 1');
    });

    it('should preserve message roles', () => {
      const messages = createMessages(4);
      const result = compressConversationHistory(messages);

      expect(result.messages[0].role).toBe('user');
      expect(result.messages[1].role).toBe('assistant');
    });
  });

  describe('medium history (compression needed)', () => {
    it('should compress older messages beyond the window', () => {
      const messages = createMessages(20);
      const result = compressConversationHistory(messages);

      // 10 recent (verbatim) + 10 older (compressed) = 20
      expect(result.messages).toHaveLength(20);
      expect(result.compressedCount).toBe(10);
      expect(result.droppedCount).toBe(0);
    });

    it('should mark compressed messages with a marker', () => {
      const messages = createMessages(15);
      const result = compressConversationHistory(messages);

      // First 5 should be compressed, last 10 verbatim
      expect(result.messages[0].content).toContain('[earlier in conversation]');
    });
  });

  describe('large history (dropping needed)', () => {
    it('should drop messages beyond total limit', () => {
      const messages = createMessages(50);
      const result = compressConversationHistory(messages);

      // max 30 total messages
      expect(result.messages.length).toBeLessThanOrEqual(30);
      expect(result.droppedCount).toBeGreaterThan(0);
    });

    it('should report accurate counts', () => {
      const messages = createMessages(50);
      const result = compressConversationHistory(messages);

      expect(result.originalCount).toBe(50);
      expect(result.compressedCount + result.droppedCount + 10).toBeLessThanOrEqual(50);
    });
  });

  describe('first message constraint', () => {
    it('should ensure first message is role: user', () => {
      const messages = createMessages(5);
      const result = compressConversationHistory(messages);

      if (result.messages.length > 0) {
        expect(result.messages[0].role).toBe('user');
      }
    });

    it('should handle case where history starts with assistant', () => {
      const messages: SageMessage[] = [
        createMessage(0, 'assistant', 'Welcome!'),
        createMessage(1, 'user', 'Hi there'),
        createMessage(2, 'assistant', 'How can I help?'),
      ];

      const result = compressConversationHistory(messages);

      // Should drop the leading assistant message
      expect(result.messages[0].role).toBe('user');
    });
  });

  describe('content truncation', () => {
    it('should truncate long messages in the compressed window', () => {
      const longContent = 'A'.repeat(500);
      const messages: SageMessage[] = [
        createMessage(0, 'user', longContent),
        ...createMessages(14).slice(1),
      ];

      const result = compressConversationHistory(messages);

      // First message (index 0) is older, should be compressed
      const firstCompressed = result.messages.find(
        (m) => m.content.includes('[earlier in conversation]')
      );
      if (firstCompressed) {
        expect(firstCompressed.content.length).toBeLessThan(longContent.length);
      }
    });
  });
});
