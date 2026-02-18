/**
 * Tests for credit service
 *
 * Validates balance management, credit addition/deduction via RPC,
 * transaction history retrieval, and the hasCredits check.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrCreateBalance,
  addCredits,
  deductCredit,
  getTransactionHistory,
  hasCredits,
} from './credits.js';

// Mock the supabase service
vi.mock('./supabase.js', () => ({
  getSupabase: vi.fn(),
}));

import { getSupabase } from './supabase.js';

// =============================================================================
// Helpers
// =============================================================================

function createChainableMock(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: vi.fn().mockImplementation((resolve?: (v: unknown) => void) =>
      Promise.resolve(result).then(resolve)
    ),
  };
  return chain;
}

// =============================================================================
// getOrCreateBalance Tests
// =============================================================================

describe('getOrCreateBalance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns existing balance when found', async () => {
    const existingBalance = {
      id: 'bal-1',
      user_id: 'user-1',
      balance: 5,
      lifetime_credits: 10,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const chain = createChainableMock({ data: existingBalance, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await getOrCreateBalance('user-1');
    expect(result.data).toEqual(existingBalance);
    expect(result.error).toBeNull();
  });

  it('creates new balance row when none exists', async () => {
    const newBalance = {
      id: 'bal-new',
      user_id: 'user-1',
      balance: 0,
      lifetime_credits: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    // First call: lookup returns null
    const lookupChain = createChainableMock({ data: null, error: null });
    // Second call: insert succeeds
    const insertChain = createChainableMock({ data: newBalance, error: null });

    let callCount = 0;
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? lookupChain : insertChain;
      }),
    } as never);

    const result = await getOrCreateBalance('user-1');
    expect(result.data).toEqual(newBalance);
    expect(result.error).toBeNull();
  });

  it('handles race condition on insert with re-fetch', async () => {
    const raceBalance = {
      id: 'bal-race',
      user_id: 'user-1',
      balance: 0,
      lifetime_credits: 0,
    };

    // First call: lookup returns null
    const lookupChain = createChainableMock({ data: null, error: null });
    // Second call: insert fails with unique constraint
    const insertChain = createChainableMock({
      data: null,
      error: { message: 'duplicate key value violates unique constraint', code: '23505' },
    });
    // Third call: re-fetch succeeds
    const reFetchChain = createChainableMock({ data: raceBalance, error: null });

    let callCount = 0;
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return lookupChain;
        if (callCount === 2) return insertChain;
        return reFetchChain;
      }),
    } as never);

    const result = await getOrCreateBalance('user-1');
    expect(result.data).toEqual(raceBalance);
    expect(result.error).toBeNull();
  });

  it('returns error on non-unique-constraint database failure', async () => {
    // First call: lookup returns null
    const lookupChain = createChainableMock({ data: null, error: null });
    // Second call: insert fails with a generic error
    const insertChain = createChainableMock({
      data: null,
      error: { message: 'Connection refused', code: '08001' },
    });

    let callCount = 0;
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? lookupChain : insertChain;
      }),
    } as never);

    const result = await getOrCreateBalance('user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Connection refused');
  });
});

// =============================================================================
// addCredits Tests
// =============================================================================

describe('addCredits', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls add_credits RPC and returns success result', async () => {
    const rpcResult = {
      success: true,
      new_balance: 8,
      transaction_id: 'txn-add-1',
      idempotent: false,
    };

    const mockRpc = vi.fn().mockResolvedValue({ data: rpcResult, error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    const result = await addCredits('user-1', 5, 'cs_stripe_session', 'Purchased 5 credits');
    expect(result.data).toEqual(rpcResult);
    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith('add_credits', {
      p_user_id: 'user-1',
      p_amount: 5,
      p_stripe_session_id: 'cs_stripe_session',
      p_description: 'Purchased 5 credits',
      p_idempotency_key: null,
    });
  });

  it('passes custom idempotency key when provided', async () => {
    const rpcResult = {
      success: true,
      new_balance: 3,
      transaction_id: 'txn-add-2',
      idempotent: false,
    };

    const mockRpc = vi.fn().mockResolvedValue({ data: rpcResult, error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    await addCredits('user-1', 3, 'cs_session', 'Grant', 'custom-key-123');
    expect(mockRpc).toHaveBeenCalledWith('add_credits', {
      p_user_id: 'user-1',
      p_amount: 3,
      p_stripe_session_id: 'cs_session',
      p_description: 'Grant',
      p_idempotency_key: 'custom-key-123',
    });
  });

  it('returns idempotent result for duplicate stripe session', async () => {
    const rpcResult = {
      success: true,
      new_balance: 8,
      transaction_id: 'txn-existing',
      idempotent: true,
    };

    const mockRpc = vi.fn().mockResolvedValue({ data: rpcResult, error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    const result = await addCredits('user-1', 5, 'cs_duplicate');
    expect(result.data?.idempotent).toBe(true);
  });

  it('returns error on RPC failure', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Function not found' },
    });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    const result = await addCredits('user-1', 5, 'cs_session');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Function not found');
  });
});

// =============================================================================
// deductCredit Tests
// =============================================================================

describe('deductCredit', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls deduct_credit RPC and returns success result', async () => {
    const rpcResult = {
      success: true,
      new_balance: 4,
      transaction_id: 'txn-deduct-1',
      idempotent: false,
    };

    const mockRpc = vi.fn().mockResolvedValue({ data: rpcResult, error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    const result = await deductCredit('user-1', 'session-abc', 'Adventure session');
    expect(result.data).toEqual(rpcResult);
    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith('deduct_credit', {
      p_user_id: 'user-1',
      p_session_id: 'session-abc',
      p_description: 'Adventure session',
    });
  });

  it('returns insufficient_credits when balance is zero', async () => {
    const rpcResult = {
      success: false,
      new_balance: 0,
      error: 'insufficient_credits',
    };

    const mockRpc = vi.fn().mockResolvedValue({ data: rpcResult, error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    const result = await deductCredit('user-1', 'session-xyz');
    expect(result.data?.success).toBe(false);
    expect(result.error).toBeNull();
  });

  it('returns idempotent result for duplicate session deduction', async () => {
    const rpcResult = {
      success: true,
      new_balance: 4,
      transaction_id: 'txn-existing',
      idempotent: true,
    };

    const mockRpc = vi.fn().mockResolvedValue({ data: rpcResult, error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    const result = await deductCredit('user-1', 'session-abc');
    expect(result.data?.idempotent).toBe(true);
  });

  it('returns error on RPC failure', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database timeout' },
    });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    const result = await deductCredit('user-1', 'session-abc');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Database timeout');
  });
});

// =============================================================================
// getTransactionHistory Tests
// =============================================================================

describe('getTransactionHistory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns transaction list ordered by recency', async () => {
    const transactions = [
      { id: 'txn-1', user_id: 'user-1', amount: 5, transaction_type: 'purchase' },
      { id: 'txn-2', user_id: 'user-1', amount: -1, transaction_type: 'deduction' },
    ];

    const chain = createChainableMock({ data: transactions, error: null });
    // getTransactionHistory chains: select -> eq -> order -> limit
    chain.limit.mockResolvedValue({ data: transactions, error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await getTransactionHistory('user-1', 10);
    expect(result.data).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  it('uses default limit of 20', async () => {
    const chain = createChainableMock({ data: [], error: null });
    chain.limit.mockResolvedValue({ data: [], error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    await getTransactionHistory('user-1');
    expect(chain.limit).toHaveBeenCalledWith(20);
  });

  it('returns error on database failure', async () => {
    const chain = createChainableMock({ data: null, error: null });
    chain.limit.mockResolvedValue({
      data: null,
      error: { message: 'Query failed' },
    });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await getTransactionHistory('user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Query failed');
  });
});

// =============================================================================
// hasCredits Tests
// =============================================================================

describe('hasCredits', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when user has credits', async () => {
    const balance = { balance: 5 };
    const chain = createChainableMock({ data: balance, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await hasCredits('user-1');
    expect(result).toBe(true);
  });

  it('returns false when user has zero credits', async () => {
    const balance = { balance: 0 };
    const chain = createChainableMock({ data: balance, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await hasCredits('user-1');
    expect(result).toBe(false);
  });

  it('returns false when no balance row exists', async () => {
    const chain = createChainableMock({ data: null, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await hasCredits('user-1');
    expect(result).toBe(false);
  });

  it('returns false on database error', async () => {
    const chain = createChainableMock({
      data: null,
      error: { message: 'Database error' },
    });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await hasCredits('user-1');
    expect(result).toBe(false);
  });
});
