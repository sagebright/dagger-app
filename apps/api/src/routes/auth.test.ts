/**
 * Tests for authentication routes
 *
 * Validates signup, login, logout, and session endpoints.
 * Uses supertest for HTTP-level testing against the Express app.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from './auth.js';

// Mock the supabase service
vi.mock('../services/supabase.js', () => ({
  getSupabase: vi.fn(),
}));

import { getSupabase } from '../services/supabase.js';

// =============================================================================
// Test App Setup
// =============================================================================

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

// =============================================================================
// Mock Supabase Auth Methods
// =============================================================================

interface MockAuth {
  signUp: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  getUser: ReturnType<typeof vi.fn>;
}

function createMockAuth(): MockAuth {
  return {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('POST /api/auth/signup', () => {
  let mockAuth: MockAuth;

  beforeEach(() => {
    mockAuth = createMockAuth();
    vi.mocked(getSupabase).mockReturnValue({ auth: mockAuth } as never);
  });

  it('returns 400 when email is missing', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password are required');
  });

  it('returns 400 when password is too short', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Password must be at least 6 characters');
  });

  it('returns user and session on successful signup', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token-abc', refresh_token: 'refresh-xyz' },
      },
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user.id).toBe('user-123');
    expect(res.body.session.access_token).toBe('token-abc');
  });

  it('returns error when Supabase signup fails', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User already registered');
  });
});

describe('POST /api/auth/login', () => {
  let mockAuth: MockAuth;

  beforeEach(() => {
    mockAuth = createMockAuth();
    vi.mocked(getSupabase).mockReturnValue({ auth: mockAuth } as never);
  });

  it('returns 400 when email is missing', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password are required');
  });

  it('returns user and session on successful login', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token-abc', refresh_token: 'refresh-xyz' },
      },
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user-123');
    expect(res.body.session.access_token).toBe('token-abc');
  });

  it('returns 401 when credentials are invalid', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid login credentials');
  });
});

describe('POST /api/auth/logout', () => {
  let mockAuth: MockAuth;

  beforeEach(() => {
    mockAuth = createMockAuth();
    vi.mocked(getSupabase).mockReturnValue({ auth: mockAuth } as never);
  });

  it('returns success on logout', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('returns error when logout fails', async () => {
    mockAuth.signOut.mockResolvedValue({
      error: { message: 'Session not found' },
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Session not found');
  });
});

describe('GET /api/auth/session', () => {
  let mockAuth: MockAuth;

  beforeEach(() => {
    mockAuth = createMockAuth();
    vi.mocked(getSupabase).mockReturnValue({ auth: mockAuth } as never);
  });

  it('returns 401 when no token is provided', async () => {
    const app = createTestApp();
    const res = await request(app)
      .get('/api/auth/session');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authorization header is required');
  });

  it('returns user when token is valid', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user-123');
  });

  it('returns 401 when token is invalid', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid JWT' },
    });

    const app = createTestApp();
    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });
});
