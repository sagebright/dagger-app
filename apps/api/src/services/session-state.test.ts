/**
 * Tests for session state service
 *
 * Validates session CRUD operations, one-active-session constraint,
 * and stage advancement logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getNextStage,
  isValidStage,
  createSession,
  loadSession,
  listSessions,
  abandonSession,
  advanceStage,
  findActiveSession,
} from './session-state.js';

// Mock the supabase service
vi.mock('./supabase.js', () => ({
  getSupabase: vi.fn(),
}));

// Mock the credits service
vi.mock('./credits.js', () => ({
  hasCredits: vi.fn(),
  deductCredit: vi.fn(),
}));

import { getSupabase } from './supabase.js';
import { hasCredits, deductCredit } from './credits.js';

// =============================================================================
// Helpers
// =============================================================================

function createChainableMock(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: vi.fn().mockImplementation((resolve?: (v: unknown) => void) =>
      Promise.resolve(result).then(resolve)
    ),
  };
  return chain;
}

function setupMockSupabase() {
  const chains: ReturnType<typeof createChainableMock>[] = [];

  const mockFrom = vi.fn().mockImplementation(() => {
    const chain = createChainableMock({ data: null, error: null });
    chains.push(chain);
    return chain;
  });

  vi.mocked(getSupabase).mockReturnValue({ from: mockFrom } as never);

  return { mockFrom, getChain: (index: number) => chains[index] };
}

// =============================================================================
// Pure Function Tests
// =============================================================================

describe('getNextStage', () => {
  it('returns attuning after invoking', () => {
    expect(getNextStage('invoking')).toBe('attuning');
  });

  it('returns binding after attuning', () => {
    expect(getNextStage('attuning')).toBe('binding');
  });

  it('returns weaving after binding', () => {
    expect(getNextStage('binding')).toBe('weaving');
  });

  it('returns inscribing after weaving', () => {
    expect(getNextStage('weaving')).toBe('inscribing');
  });

  it('returns delivering after inscribing', () => {
    expect(getNextStage('inscribing')).toBe('delivering');
  });

  it('returns null for delivering (final stage)', () => {
    expect(getNextStage('delivering')).toBeNull();
  });
});

describe('isValidStage', () => {
  it('returns true for valid stages', () => {
    expect(isValidStage('invoking')).toBe(true);
    expect(isValidStage('attuning')).toBe(true);
    expect(isValidStage('delivering')).toBe(true);
  });

  it('returns false for invalid stages', () => {
    expect(isValidStage('invalid')).toBe(false);
    expect(isValidStage('')).toBe(false);
    expect(isValidStage('INVOKING')).toBe(false);
  });
});

// =============================================================================
// findActiveSession Tests
// =============================================================================

describe('findActiveSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns active session when one exists', async () => {
    const activeSession = {
      id: 'session-1',
      user_id: 'user-1',
      title: 'My Adventure',
      stage: 'invoking',
      is_active: true,
    };

    const chain = createChainableMock({ data: activeSession, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await findActiveSession('user-1');
    expect(result.data).toEqual(activeSession);
    expect(result.error).toBeNull();
  });

  it('returns null data when no active session exists', async () => {
    const chain = createChainableMock({ data: null, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await findActiveSession('user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it('returns error on database failure', async () => {
    const chain = createChainableMock({
      data: null,
      error: { message: 'Database error' },
    });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await findActiveSession('user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Database error');
  });
});

// =============================================================================
// createSession Tests
// =============================================================================

describe('createSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns error when title is empty', async () => {
    const result = await createSession('user-1', '');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Session title is required');
  });

  it('returns error when title is whitespace only', async () => {
    const result = await createSession('user-1', '   ');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Session title is required');
  });

  it('returns error when user already has an active session', async () => {
    const activeSession = {
      id: 'session-1',
      user_id: 'user-1',
      title: 'Existing Session',
      stage: 'invoking',
      is_active: true,
    };

    // findActiveSession returns an existing session
    const chain = createChainableMock({ data: activeSession, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await createSession('user-1', 'New Session');
    expect(result.data).toBeNull();
    expect(result.error).toBe(
      'An active session already exists. Abandon it before starting a new one.'
    );
  });

  it('creates session and adventure state when no active session exists', async () => {
    const newSession = {
      id: 'session-new',
      user_id: 'user-1',
      title: 'New Adventure',
      stage: 'invoking',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const newState = {
      id: 'state-1',
      session_id: 'session-new',
      components: {},
      frame: null,
      outline: null,
      scenes: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    // Credit gate: user has credits and deduction succeeds
    vi.mocked(hasCredits).mockResolvedValue(true);
    vi.mocked(deductCredit).mockResolvedValue({
      data: { success: true, new_balance: 2, transaction_id: 'tx-1' },
      error: null,
    });

    let callCount = 0;
    const findChain = createChainableMock({ data: null, error: null });
    const insertSessionChain = createChainableMock({
      data: newSession,
      error: null,
    });
    const insertStateChain = createChainableMock({
      data: newState,
      error: null,
    });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return findChain;
        if (callCount === 2) return insertSessionChain;
        return insertStateChain;
      }),
    } as never);

    const result = await createSession('user-1', 'New Adventure');
    expect(result.error).toBeNull();
    expect(result.data?.session).toEqual(newSession);
    expect(result.data?.adventureState).toEqual(newState);
  });

  it('returns error when user has no credits', async () => {
    // No active session
    const chain = createChainableMock({ data: null, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    // Credit gate: user has no credits
    vi.mocked(hasCredits).mockResolvedValue(false);

    const result = await createSession('user-1', 'New Adventure');
    expect(result.data).toBeNull();
    expect(result.error).toBe(
      'Insufficient credits. Purchase credits to start a new adventure.'
    );
  });

  it('rolls back session when credit deduction fails', async () => {
    const newSession = {
      id: 'session-new',
      user_id: 'user-1',
      title: 'New Adventure',
      stage: 'invoking',
      is_active: true,
    };

    // Credit gate: user appears to have credits
    vi.mocked(hasCredits).mockResolvedValue(true);
    // But deduction fails (race condition — someone else took the last credit)
    vi.mocked(deductCredit).mockResolvedValue({
      data: { success: false, error: 'insufficient_credits' },
      error: null,
    });

    let callCount = 0;
    const findChain = createChainableMock({ data: null, error: null });
    const insertSessionChain = createChainableMock({
      data: newSession,
      error: null,
    });
    const deleteChain = createChainableMock({ data: null, error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return findChain;
        if (callCount === 2) return insertSessionChain;
        return deleteChain;
      }),
    } as never);

    const result = await createSession('user-1', 'New Adventure');
    expect(result.data).toBeNull();
    expect(result.error).toBe(
      'Insufficient credits. Purchase credits to start a new adventure.'
    );
  });
});

// =============================================================================
// loadSession Tests
// =============================================================================

describe('loadSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns session and adventure state', async () => {
    const session = {
      id: 'session-1',
      user_id: 'user-1',
      title: 'My Adventure',
      stage: 'attuning',
      is_active: true,
    };

    const state = {
      id: 'state-1',
      session_id: 'session-1',
      components: { span: '3-4 hours' },
      frame: null,
      outline: null,
      scenes: [],
    };

    let callCount = 0;
    const sessionChain = createChainableMock({ data: session, error: null });
    const stateChain = createChainableMock({ data: state, error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? sessionChain : stateChain;
      }),
    } as never);

    const result = await loadSession('session-1', 'user-1');
    expect(result.error).toBeNull();
    expect(result.data?.session).toEqual(session);
    expect(result.data?.adventureState).toEqual(state);
  });

  it('returns error when session not found', async () => {
    const chain = createChainableMock({
      data: null,
      error: { message: 'No rows found' },
    });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await loadSession('nonexistent', 'user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Session not found');
  });
});

// =============================================================================
// listSessions Tests
// =============================================================================

describe('listSessions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns list of sessions for user', async () => {
    const sessions = [
      { id: 'session-1', user_id: 'user-1', title: 'Adventure A', is_active: true },
      { id: 'session-2', user_id: 'user-1', title: 'Adventure B', is_active: false },
    ];

    const chain = createChainableMock({ data: sessions, error: null });
    // listSessions uses order() then awaits (no single/maybeSingle)
    chain.order.mockResolvedValue({ data: sessions, error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await listSessions('user-1');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
  });

  it('returns empty array when user has no sessions', async () => {
    const chain = createChainableMock({ data: [], error: null });
    chain.order.mockResolvedValue({ data: [], error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await listSessions('user-1');
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('returns error on database failure', async () => {
    const chain = createChainableMock({ data: null, error: null });
    chain.order.mockResolvedValue({
      data: null,
      error: { message: 'Query failed' },
    });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await listSessions('user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Query failed');
  });
});

// =============================================================================
// abandonSession Tests
// =============================================================================

describe('abandonSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deactivates the session', async () => {
    const abandonedSession = {
      id: 'session-1',
      user_id: 'user-1',
      title: 'My Adventure',
      is_active: false,
    };

    const chain = createChainableMock({ data: abandonedSession, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await abandonSession('session-1', 'user-1');
    expect(result.error).toBeNull();
    expect(result.data?.is_active).toBe(false);
  });

  it('returns error when session not found', async () => {
    const chain = createChainableMock({
      data: null,
      error: { message: 'No rows found' },
    });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await abandonSession('nonexistent', 'user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('No rows found');
  });
});

// =============================================================================
// advanceStage Tests
// =============================================================================

describe('advanceStage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('advances from invoking to attuning', async () => {
    const session = {
      id: 'session-1',
      user_id: 'user-1',
      title: 'My Adventure',
      stage: 'invoking',
      is_active: true,
    };

    const state = {
      id: 'state-1',
      session_id: 'session-1',
      components: {},
    };

    const updatedSession = { ...session, stage: 'attuning' };

    let callCount = 0;
    const sessionChain = createChainableMock({ data: session, error: null });
    const stateChain = createChainableMock({ data: state, error: null });
    const updateChain = createChainableMock({
      data: updatedSession,
      error: null,
    });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return sessionChain;
        if (callCount === 2) return stateChain;
        return updateChain;
      }),
    } as never);

    const result = await advanceStage('session-1', 'user-1');
    expect(result.error).toBeNull();
    expect(result.data?.stage).toBe('attuning');
  });

  it('returns error when session is at final stage', async () => {
    const session = {
      id: 'session-1',
      user_id: 'user-1',
      title: 'My Adventure',
      stage: 'delivering',
      is_active: true,
    };

    const state = {
      id: 'state-1',
      session_id: 'session-1',
      components: {},
    };

    let callCount = 0;
    const sessionChain = createChainableMock({ data: session, error: null });
    const stateChain = createChainableMock({ data: state, error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? sessionChain : stateChain;
      }),
    } as never);

    const result = await advanceStage('session-1', 'user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Session is already at the final stage');
  });

  it('returns error when session is inactive', async () => {
    const session = {
      id: 'session-1',
      user_id: 'user-1',
      title: 'My Adventure',
      stage: 'attuning',
      is_active: false,
    };

    const state = {
      id: 'state-1',
      session_id: 'session-1',
      components: {},
    };

    let callCount = 0;
    const sessionChain = createChainableMock({ data: session, error: null });
    const stateChain = createChainableMock({ data: state, error: null });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? sessionChain : stateChain;
      }),
    } as never);

    const result = await advanceStage('session-1', 'user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Cannot advance an inactive session');
  });

  it('returns error when session not found', async () => {
    const chain = createChainableMock({
      data: null,
      error: { message: 'No rows found' },
    });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const result = await advanceStage('nonexistent', 'user-1');
    expect(result.data).toBeNull();
    expect(result.error).toBe('Session not found');
  });
});
