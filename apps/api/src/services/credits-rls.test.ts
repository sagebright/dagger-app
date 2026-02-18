/**
 * RLS regression tests for credit service
 *
 * Validates that credit operations properly handle and surface RLS errors.
 * These tests simulate the RLS violation scenario to ensure the code paths
 * don't silently swallow database errors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrCreateBalance,
  addCredits,
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

const RLS_ERROR_MESSAGE = 'new row violates row-level security policy for table "credit_balances"';
const RLS_ERROR_CODE = '42501';

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
// RLS Error Handling: getOrCreateBalance
// =============================================================================

describe('getOrCreateBalance — RLS error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('surfaces RLS violation error on insert', async () => {
    // First call: lookup returns null (no existing balance)
    const lookupChain = createChainableMock({ data: null, error: null });
    // Second call: insert fails with RLS violation
    const insertChain = createChainableMock({
      data: null,
      error: { message: RLS_ERROR_MESSAGE, code: RLS_ERROR_CODE },
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
    expect(result.error).toBe(RLS_ERROR_MESSAGE);
  });

  it('surfaces RLS error on initial select', async () => {
    const chain = createChainableMock({
      data: null,
      error: { message: 'permission denied for table credit_balances', code: RLS_ERROR_CODE },
    });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await getOrCreateBalance('user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('permission denied for table credit_balances');
  });
});

// =============================================================================
// RLS Error Handling: addCredits
// =============================================================================

describe('addCredits — RLS error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('surfaces RLS violation from add_credits RPC', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: RLS_ERROR_MESSAGE },
    });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    const result = await addCredits('user-1', 5, 'cs_session');
    expect(result.data).toBeNull();
    expect(result.error).toBe(RLS_ERROR_MESSAGE);
  });
});

// =============================================================================
// RLS Error Handling: hasCredits
// =============================================================================

describe('hasCredits — RLS-blocked reads', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when RLS blocks the select (no data returned)', async () => {
    // With RLS enabled and no policies, select returns zero rows
    const chain = createChainableMock({ data: null, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await hasCredits('user-1');
    expect(result).toBe(false);
  });

  it('returns false when RLS returns a permission error', async () => {
    const chain = createChainableMock({
      data: null,
      error: { message: 'permission denied for table credit_balances' },
    });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await hasCredits('user-1');
    expect(result).toBe(false);
  });
});
