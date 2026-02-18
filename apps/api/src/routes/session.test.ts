/**
 * Tests for session management routes
 *
 * Validates session CRUD endpoints and stage advancement.
 * Uses supertest for HTTP-level testing against the Express app.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import sessionRouter, { sessionsListRouter } from './session.js';

// Mock the session-state service
vi.mock('../services/session-state.js', () => ({
  createSession: vi.fn(),
  loadSession: vi.fn(),
  listSessions: vi.fn(),
  abandonSession: vi.fn(),
  advanceStage: vi.fn(),
}));

import {
  createSession,
  loadSession,
  listSessions,
  abandonSession,
  advanceStage,
} from '../services/session-state.js';

// =============================================================================
// Test App Setup
// =============================================================================

/** Middleware that simulates an authenticated user */
function mockAuth(userId: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: userId } as never;
    next();
  };
}

function createTestApp(userId = 'user-123') {
  const app = express();
  app.use(express.json());
  app.use(mockAuth(userId));
  app.use('/api/session', sessionRouter);
  app.use('/api/sessions', sessionsListRouter);
  return app;
}

function createUnauthenticatedApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/session', sessionRouter);
  app.use('/api/sessions', sessionsListRouter);
  return app;
}

// =============================================================================
// POST /api/session
// =============================================================================

describe('POST /api/session', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app)
      .post('/api/session')
      .send({ title: 'My Adventure' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('User not authenticated');
  });

  it('returns 400 when title is missing', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/session')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Title is required and must be a string');
  });

  it('returns 400 when title is not a string', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/session')
      .send({ title: 42 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Title is required and must be a string');
  });

  it('returns 409 when user already has an active session', async () => {
    vi.mocked(createSession).mockResolvedValue({
      data: null,
      error: 'An active session already exists. Abandon it before starting a new one.',
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/session')
      .send({ title: 'New Adventure' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('returns 402 when user has insufficient credits', async () => {
    vi.mocked(createSession).mockResolvedValue({
      data: null,
      error: 'Insufficient credits. Purchase credits to start a new adventure.',
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/session')
      .send({ title: 'New Adventure' });

    expect(res.status).toBe(402);
    expect(res.body.error).toContain('Insufficient credits');
  });

  it('returns 201 with session and state on success', async () => {
    const sessionData = {
      session: {
        id: 'session-new',
        user_id: 'user-123',
        title: 'New Adventure',
        stage: 'invoking',
        is_active: true,
      },
      adventureState: {
        id: 'state-1',
        session_id: 'session-new',
        components: {},
        frame: null,
        outline: null,
        scenes: [],
      },
    };

    vi.mocked(createSession).mockResolvedValue({
      data: sessionData,
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/session')
      .send({ title: 'New Adventure' });

    expect(res.status).toBe(201);
    expect(res.body.session.id).toBe('session-new');
    expect(res.body.session.stage).toBe('invoking');
    expect(res.body.adventureState.components).toEqual({});
  });
});

// =============================================================================
// GET /api/session/:id
// =============================================================================

describe('GET /api/session/:id', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app)
      .get('/api/session/session-1');

    expect(res.status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    vi.mocked(loadSession).mockResolvedValue({
      data: null,
      error: 'Session not found',
    });

    const app = createTestApp();
    const res = await request(app)
      .get('/api/session/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });

  it('returns session and state on success', async () => {
    const sessionData = {
      session: {
        id: 'session-1',
        user_id: 'user-123',
        title: 'My Adventure',
        stage: 'attuning',
        is_active: true,
      },
      adventureState: {
        id: 'state-1',
        session_id: 'session-1',
        components: { span: '3-4 hours' },
        frame: null,
        outline: null,
        scenes: [],
      },
    };

    vi.mocked(loadSession).mockResolvedValue({
      data: sessionData,
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .get('/api/session/session-1');

    expect(res.status).toBe(200);
    expect(res.body.session.title).toBe('My Adventure');
    expect(res.body.adventureState.components.span).toBe('3-4 hours');
  });
});

// =============================================================================
// GET /api/sessions
// =============================================================================

describe('GET /api/sessions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app)
      .get('/api/sessions');

    expect(res.status).toBe(401);
  });

  it('returns list of sessions', async () => {
    const sessions = [
      { id: 'session-1', user_id: 'user-123', title: 'Adventure A', is_active: true },
      { id: 'session-2', user_id: 'user-123', title: 'Adventure B', is_active: false },
    ];

    vi.mocked(listSessions).mockResolvedValue({
      data: sessions as never,
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .get('/api/sessions');

    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(2);
  });

  it('returns empty sessions array when user has none', async () => {
    vi.mocked(listSessions).mockResolvedValue({
      data: [],
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .get('/api/sessions');

    expect(res.status).toBe(200);
    expect(res.body.sessions).toEqual([]);
  });
});

// =============================================================================
// DELETE /api/session/:id
// =============================================================================

describe('DELETE /api/session/:id', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app)
      .delete('/api/session/session-1');

    expect(res.status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    vi.mocked(abandonSession).mockResolvedValue({
      data: null,
      error: 'Session not found',
    });

    const app = createTestApp();
    const res = await request(app)
      .delete('/api/session/nonexistent');

    expect(res.status).toBe(404);
  });

  it('returns abandoned session on success', async () => {
    const abandoned = {
      id: 'session-1',
      user_id: 'user-123',
      title: 'My Adventure',
      is_active: false,
    };

    vi.mocked(abandonSession).mockResolvedValue({
      data: abandoned as never,
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .delete('/api/session/session-1');

    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(false);
  });
});

// =============================================================================
// POST /api/session/:id/advance
// =============================================================================

describe('POST /api/session/:id/advance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const app = createUnauthenticatedApp();
    const res = await request(app)
      .post('/api/session/session-1/advance');

    expect(res.status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    vi.mocked(advanceStage).mockResolvedValue({
      data: null,
      error: 'Session not found',
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/session/nonexistent/advance');

    expect(res.status).toBe(404);
  });

  it('returns 400 when session is at final stage', async () => {
    vi.mocked(advanceStage).mockResolvedValue({
      data: null,
      error: 'Session is already at the final stage',
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/session/session-1/advance');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Session is already at the final stage');
  });

  it('returns 400 when session is inactive', async () => {
    vi.mocked(advanceStage).mockResolvedValue({
      data: null,
      error: 'Cannot advance an inactive session',
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/session/session-1/advance');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot advance an inactive session');
  });

  it('returns advanced session on success', async () => {
    const advancedSession = {
      id: 'session-1',
      user_id: 'user-123',
      title: 'My Adventure',
      stage: 'attuning',
      is_active: true,
    };

    vi.mocked(advanceStage).mockResolvedValue({
      data: advancedSession as never,
      error: null,
    });

    const app = createTestApp();
    const res = await request(app)
      .post('/api/session/session-1/advance');

    expect(res.status).toBe(200);
    expect(res.body.stage).toBe('attuning');
  });
});
