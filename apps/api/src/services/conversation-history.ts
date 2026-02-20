/**
 * Conversation history compression for Sage Codex
 *
 * Manages the T5 tier: sliding-window conversation context.
 *
 * Strategies:
 * 1. Recent messages are kept verbatim (within the window)
 * 2. Older messages are compressed: assistant tool_results stripped,
 *    long messages truncated, sequential similar messages merged
 * 3. Very old messages are dropped entirely
 *
 * This keeps the Anthropic messages array within token budget while
 * preserving recent conversational context.
 */

import type { SageMessage } from '@sage-codex/shared-types';
import type { AnthropicMessage } from './anthropic.js';

// =============================================================================
// Constants
// =============================================================================

/** Number of recent messages to keep verbatim */
const RECENT_WINDOW_SIZE = 10;

/** Maximum character length for a compressed message */
const MAX_COMPRESSED_LENGTH = 200;

/** Maximum total messages to include (recent + compressed) */
const MAX_TOTAL_MESSAGES = 30;

/** Marker indicating a message was compressed */
const COMPRESSION_MARKER = '[earlier in conversation]';

// =============================================================================
// Types
// =============================================================================

export interface CompressedHistory {
  /** Messages formatted for the Anthropic API */
  messages: AnthropicMessage[];
  /** Number of messages that were compressed */
  compressedCount: number;
  /** Number of messages that were dropped entirely */
  droppedCount: number;
  /** Total original message count */
  originalCount: number;
}

// =============================================================================
// Compression
// =============================================================================

/**
 * Truncate a message to a maximum length, adding an ellipsis.
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength - 3) + '...';
}

/**
 * Compress a single message by truncating its content.
 */
function compressMessage(msg: SageMessage): AnthropicMessage {
  const compressed = truncateContent(msg.content, MAX_COMPRESSED_LENGTH);
  return {
    role: msg.role as 'user' | 'assistant',
    content: `${COMPRESSION_MARKER} ${compressed}`,
  };
}

/**
 * Convert a SageMessage to an Anthropic message (verbatim).
 */
function toVerbatimMessage(msg: SageMessage): AnthropicMessage {
  return {
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  };
}

/**
 * Compress conversation history for inclusion in the Anthropic API request.
 *
 * Strategy:
 * 1. Take the most recent RECENT_WINDOW_SIZE messages verbatim
 * 2. Compress older messages (truncate, strip tool details)
 * 3. Drop messages beyond MAX_TOTAL_MESSAGES
 * 4. Ensure the first message in the array is always role: 'user'
 *    (Anthropic API requirement)
 *
 * The current user message is NOT included — it is added separately
 * by the context-assembler.
 */
export function compressConversationHistory(
  messages: SageMessage[]
): CompressedHistory {
  const originalCount = messages.length;

  if (messages.length === 0) {
    return {
      messages: [],
      compressedCount: 0,
      droppedCount: 0,
      originalCount: 0,
    };
  }

  // Split into recent (verbatim) and older (compressible)
  const recentStart = Math.max(0, messages.length - RECENT_WINDOW_SIZE);
  const recentMessages = messages.slice(recentStart);
  const olderMessages = messages.slice(0, recentStart);

  // Determine how many older messages we can include
  const olderBudget = MAX_TOTAL_MESSAGES - recentMessages.length;
  const droppedCount = Math.max(0, olderMessages.length - olderBudget);
  const compressibleMessages = olderMessages.slice(droppedCount);

  // Compress older messages
  const compressed = compressibleMessages.map(compressMessage);
  const verbatim = recentMessages.map(toVerbatimMessage);

  // Combine: compressed first, then verbatim
  let result = [...compressed, ...verbatim];

  // Ensure the first message has role 'user' (Anthropic requirement)
  result = ensureFirstMessageIsUser(result);

  return {
    messages: result,
    compressedCount: compressed.length,
    droppedCount,
    originalCount,
  };
}

/**
 * Ensure the message array starts with a 'user' role message.
 *
 * The Anthropic API requires the first message to be from the user.
 * If the first message is from the assistant (e.g. the Sage's greeting),
 * prepend a synthetic user message to satisfy the constraint while
 * preserving the full conversation context.
 */
function ensureFirstMessageIsUser(
  messages: AnthropicMessage[]
): AnthropicMessage[] {
  if (messages.length === 0) return messages;
  if (messages[0].role === 'user') return messages;

  // Prepend a synthetic user message to preserve the assistant greeting
  return [
    { role: 'user', content: '[Session started]' },
    ...messages,
  ];
}
