/**
 * Tests for message-store service
 *
 * Verifies message storage and conversation history loading
 * against the sage_messages table.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storeMessage, loadConversationHistory } from './message-store.js';

// =============================================================================
// Mocks
// =============================================================================

const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

/**
 * Build a chainable query builder mock.
 * Each method returns the builder for chaining; `single()` / `then()`
 * resolve the configured result.
 */
function resetChainMocks(result: { data: unknown; error: unknown }): void {
  const chain = {
    insert: (...args: unknown[]) => { mockInsert(...args); return chain; },
    select: (...args: unknown[]) => { mockSelect(...args); return chain; },
    eq: (...args: unknown[]) => { mockEq(...args); return chain; },
    order: (...args: unknown[]) => { mockOrder(...args); return chain; },
    limit: (...args: unknown[]) => { mockLimit(...args); return chain; },
    single: () => { mockSingle(); return chain; },
    then: (resolve?: (v: unknown) => void) =>
      Promise.resolve(result).then(resolve),
  };

  mockFrom.mockReturnValue(chain);
}

vi.mock('./supabase.js', () => ({
  getSupabase: vi.fn(() => ({ from: (...args: unknown[]) => mockFrom(...args) })),
}));

// =============================================================================
// Tests
// =============================================================================

describe('storeMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should insert a user message', async () => {
    resetChainMocks({
      data: {
        id: 'msg-001',
        session_id: 'session-001',
        role: 'user',
        content: 'Hello',
        tool_calls: null,
        token_count: null,
        created_at: '2025-01-01T00:00:00Z',
      },
      error: null,
    });

    const result = await storeMessage({
      sessionId: 'session-001',
      role: 'user',
      content: 'Hello',
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
    expect(mockFrom).toHaveBeenCalledWith('sage_messages');
  });

  it('should insert an assistant message with tool_calls', async () => {
    resetChainMocks({
      data: {
        id: 'msg-002',
        session_id: 'session-001',
        role: 'assistant',
        content: 'Response',
        tool_calls: [{ id: 't1', name: 'echo' }],
        token_count: 150,
        created_at: '2025-01-01T00:00:00Z',
      },
      error: null,
    });

    const result = await storeMessage({
      sessionId: 'session-001',
      role: 'assistant',
      content: 'Response',
      toolCalls: [{ id: 't1', name: 'echo' }],
      tokenCount: 150,
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('should return an error on Supabase failure', async () => {
    resetChainMocks({
      data: null,
      error: { message: 'Insert failed' },
    });

    const result = await storeMessage({
      sessionId: 'session-001',
      role: 'user',
      content: 'Hello',
    });

    expect(result.error).toBe('Insert failed');
    expect(result.data).toBeNull();
  });
});

describe('loadConversationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return messages for a session', async () => {
    const messages = [
      {
        id: 'msg-001',
        session_id: 'session-001',
        role: 'user',
        content: 'Hello',
        tool_calls: null,
        token_count: null,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'msg-002',
        session_id: 'session-001',
        role: 'assistant',
        content: 'Hi there',
        tool_calls: null,
        token_count: 50,
        created_at: '2025-01-01T00:00:01Z',
      },
    ];
    resetChainMocks({ data: messages, error: null });

    const result = await loadConversationHistory('session-001');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(mockFrom).toHaveBeenCalledWith('sage_messages');
  });

  it('should return empty array when no messages exist', async () => {
    resetChainMocks({ data: [], error: null });

    const result = await loadConversationHistory('session-empty');

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('should return an error on Supabase failure', async () => {
    resetChainMocks({ data: null, error: { message: 'Query failed' } });

    const result = await loadConversationHistory('session-001');

    expect(result.error).toBe('Query failed');
    expect(result.data).toBeNull();
  });
});
