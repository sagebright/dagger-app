/**
 * Mock factory for Supabase client
 *
 * Provides chainable query builder mocks that simulate the Supabase
 * `.from().select().eq()` pattern with configurable return data.
 *
 * Usage:
 *   import { createMockSupabaseClient, mockQueryResult } from '../test/mocks/supabase';
 *
 *   const mockClient = createMockSupabaseClient();
 *   mockQueryResult(mockClient, { data: [{ id: 1, name: 'Frame A' }] });
 */

import { vi } from 'vitest';

// =============================================================================
// Types
// =============================================================================

interface QueryResult<T = unknown> {
  data: T[] | null;
  error: SupabaseError | null;
  count?: number;
}

interface SingleResult<T = unknown> {
  data: T | null;
  error: SupabaseError | null;
}

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

interface MockSupabaseAuth {
  getUser: ReturnType<typeof vi.fn>;
  getSession: ReturnType<typeof vi.fn>;
}

interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  auth: MockSupabaseAuth;
  rpc: ReturnType<typeof vi.fn>;
  _queryBuilder: MockQueryBuilder;
}

// =============================================================================
// Query Builder Factory
// =============================================================================

/** Default successful empty query result */
const DEFAULT_QUERY_RESULT: QueryResult = { data: [], error: null };

/**
 * Create a chainable query builder mock.
 *
 * All filter/modifier methods return the builder itself (for chaining),
 * and the builder resolves to a configurable result when awaited.
 */
function createMockQueryBuilder(
  initialResult: QueryResult = DEFAULT_QUERY_RESULT
): MockQueryBuilder {
  let currentResult: QueryResult | SingleResult = { ...initialResult };

  const builder: MockQueryBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    like: vi.fn(),
    ilike: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    range: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    then: vi.fn(),
  };

  // All chainable methods return the builder
  const chainableMethods: Array<keyof MockQueryBuilder> = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'gte', 'lte', 'like', 'ilike', 'is',
    'order', 'limit', 'range',
  ];

  for (const method of chainableMethods) {
    builder[method].mockReturnValue(builder);
  }

  // single() and maybeSingle() resolve differently
  builder.single.mockImplementation(() => {
    const arrayData = currentResult.data;
    const singleData = Array.isArray(arrayData) ? arrayData[0] ?? null : arrayData;
    currentResult = { data: singleData, error: currentResult.error };
    return builder;
  });

  builder.maybeSingle.mockImplementation(() => {
    const arrayData = currentResult.data;
    const singleData = Array.isArray(arrayData) ? arrayData[0] ?? null : arrayData;
    currentResult = { data: singleData, error: currentResult.error };
    return builder;
  });

  // then() makes the builder thenable (so await works)
  builder.then.mockImplementation(
    (resolve?: (value: QueryResult | SingleResult) => void) => {
      return Promise.resolve(currentResult).then(resolve);
    }
  );

  // Expose a way to update the result (used by mockQueryResult)
  Object.defineProperty(builder, '_setResult', {
    value: (result: QueryResult) => {
      currentResult = { ...result };
    },
    enumerable: false,
  });

  return builder;
}

// =============================================================================
// Client Factory
// =============================================================================

/**
 * Create a mock Supabase client with chainable query methods.
 *
 * The client starts with empty successful responses. Use `mockQueryResult`
 * to configure specific return data for queries.
 */
export function createMockSupabaseClient(): MockSupabaseClient {
  const queryBuilder = createMockQueryBuilder();

  const client: MockSupabaseClient = {
    from: vi.fn().mockReturnValue(queryBuilder),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _queryBuilder: queryBuilder,
  };

  return client;
}

/**
 * Configure the mock client to return specific data for the next query.
 *
 * Example:
 *   mockQueryResult(client, {
 *     data: [{ id: 1, name: 'Ember Frame' }],
 *   });
 *
 *   const result = await client.from('daggerheart_frames').select('*');
 *   // result.data = [{ id: 1, name: 'Ember Frame' }]
 */
export function mockQueryResult<T = unknown>(
  client: MockSupabaseClient,
  result: { data?: T[] | null; error?: SupabaseError | null; count?: number }
): void {
  const queryResult: QueryResult<T> = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count,
  };

  // Access the hidden setter on the query builder
  const builder = client._queryBuilder as MockQueryBuilder & {
    _setResult: (r: QueryResult) => void;
  };
  builder._setResult(queryResult as QueryResult);
}

/**
 * Configure the mock client to return a Supabase error.
 *
 * Example:
 *   mockQueryError(client, {
 *     message: 'relation "daggerheart_frames" does not exist',
 *     code: '42P01',
 *   });
 */
export function mockQueryError(
  client: MockSupabaseClient,
  error: SupabaseError
): void {
  mockQueryResult(client, { data: null, error });
}

/**
 * Configure the auth.getUser mock to return a specific user.
 */
export function mockAuthUser(
  client: MockSupabaseClient,
  user: { id: string; email?: string; role?: string } | null
): void {
  client.auth.getUser.mockResolvedValue({
    data: { user },
    error: user ? null : { message: 'Not authenticated' },
  });
}
