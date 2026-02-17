/**
 * Tests for authentication middleware
 *
 * Validates JWT extraction, Supabase user verification, and
 * access gate (is_active check) for protected routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from './auth.js';

// Mock the supabase service
vi.mock('../services/supabase.js', () => ({
  getSupabase: vi.fn(),
}));

import { getSupabase } from '../services/supabase.js';

// =============================================================================
// Helpers
// =============================================================================

function createMockRequest(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

function createMockResponse(): Partial<Response> & {
  _status: number;
  _json: unknown;
} {
  const res = {
    _status: 0,
    _json: null as unknown,
    status: vi.fn().mockImplementation(function (this: typeof res, code: number) {
      this._status = code;
      return this;
    }),
    json: vi.fn().mockImplementation(function (this: typeof res, body: unknown) {
      this._json = body;
      return this;
    }),
  };
  return res;
}

function createMockNext(): NextFunction {
  return vi.fn();
}

// =============================================================================
// Tests
// =============================================================================

describe('requireAuth middleware', () => {
  let mockGetUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetUser = vi.fn();

    const mockSupabase = {
      auth: {
        getUser: mockGetUser,
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123', is_active: true },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);
  });

  it('returns 401 when no Authorization header is present', async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req as Request, res as unknown as Response, next);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Authorization header is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header has no Bearer prefix', async () => {
    const req = createMockRequest('Basic abc123');
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req as Request, res as unknown as Response, next);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Authorization header must use Bearer scheme' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is empty', async () => {
    const req = createMockRequest('Bearer ');
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req as Request, res as unknown as Response, next);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Authorization token is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Supabase getUser returns an error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid JWT' },
    });

    const req = createMockRequest('Bearer invalid-token');
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req as Request, res as unknown as Response, next);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Supabase getUser returns no user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const req = createMockRequest('Bearer some-token');
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req as Request, res as unknown as Response, next);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user profile has is_active=false', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const mockSupabase = {
      auth: { getUser: mockGetUser },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123', is_active: false },
              error: null,
            }),
          }),
        }),
      }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

    const req = createMockRequest('Bearer valid-token');
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req as Request, res as unknown as Response, next);

    expect(res._status).toBe(403);
    expect(res._json).toEqual({
      error: 'Account is inactive. Contact an administrator for access.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and attaches user when token is valid and user is active', async () => {
    const testUser = { id: 'user-123', email: 'test@example.com' };

    mockGetUser.mockResolvedValue({
      data: { user: testUser },
      error: null,
    });

    const req = createMockRequest('Bearer valid-token');
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as Request & { user: unknown }).user).toEqual(testUser);
  });

  it('treats missing profile as active (allows access)', async () => {
    const testUser = { id: 'user-123', email: 'test@example.com' };

    mockGetUser.mockResolvedValue({
      data: { user: testUser },
      error: null,
    });

    const mockSupabase = {
      auth: { getUser: mockGetUser },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found', code: 'PGRST116' },
            }),
          }),
        }),
      }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

    const req = createMockRequest('Bearer valid-token');
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
  });
});
