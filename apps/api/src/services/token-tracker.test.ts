/**
 * Tests for token-tracker service
 *
 * Verifies that token usage records are correctly inserted into
 * the sage_usage table and that errors are handled gracefully.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logTokenUsage } from './token-tracker.js';

// =============================================================================
// Mocks
// =============================================================================

const mockFrom = vi.fn();
const mockInsert = vi.fn();

/**
 * Configure the mock chain for the Supabase `from().insert()` pattern.
 * The insert in token-tracker.ts does NOT chain `.select().single()` --
 * it just does `from('sage_usage').insert({...})` and awaits the result.
 */
function resetChainMocks(result: { data: unknown; error: unknown }): void {
  const chain = {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        then: (resolve?: (v: unknown) => void) =>
          Promise.resolve(result).then(resolve),
      };
    },
  };

  mockFrom.mockReturnValue(chain);
}

vi.mock('./supabase.js', () => ({
  getSupabase: vi.fn(() => ({ from: (...args: unknown[]) => mockFrom(...args) })),
}));

// =============================================================================
// Tests
// =============================================================================

describe('logTokenUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should insert a record into sage_usage', async () => {
    resetChainMocks({ data: { id: 'usage-001' }, error: null });

    const result = await logTokenUsage({
      sessionId: 'session-001',
      messageId: 'msg-001',
      inputTokens: 100,
      outputTokens: 50,
      model: 'claude-sonnet-4-20250514',
    });

    expect(result.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('sage_usage');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'session-001',
        input_tokens: 100,
        output_tokens: 50,
      })
    );
  });

  it('should return success false on Supabase error', async () => {
    resetChainMocks({ data: null, error: { message: 'Insert failed' } });

    const result = await logTokenUsage({
      sessionId: 'session-001',
      messageId: 'msg-001',
      inputTokens: 100,
      outputTokens: 50,
      model: 'claude-sonnet-4-20250514',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed');
  });
});
