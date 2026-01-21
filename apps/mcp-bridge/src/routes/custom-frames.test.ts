/**
 * Integration tests for custom-frames route
 *
 * Tests CRUD operations for custom frame management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';

// Mock the supabase service
vi.mock('../services/supabase.js', () => ({
  getSupabase: vi.fn(),
}));

import { getSupabase } from '../services/supabase.js';
import customFramesRouter from './custom-frames.js';

// Sample test data
const MOCK_CUSTOM_FRAME = {
  id: 'cf-123',
  title: 'Test Frame',
  concept: 'A test concept',
  pitch: 'A test pitch',
  tone_feel: ['dark', 'mysterious'],
  themes: ['redemption'],
  complexity_rating: 2,
  touchstones: ['Dark Souls'],
  overview: 'Test overview',
  heritage_classes: null,
  player_principles: null,
  gm_principles: null,
  distinctions: null,
  inciting_incident: null,
  custom_mechanics: null,
  session_zero_questions: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * Creates a test Express app with custom-frames routes
 */
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/custom-frames', customFramesRouter);
  return app;
}

/**
 * Creates a mock Supabase client with configurable responses
 */
function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const defaultMock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return defaultMock;
}

describe('Custom Frames API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/custom-frames', () => {
    it('returns 200 with list of custom frames', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.order.mockResolvedValue({
        data: [MOCK_CUSTOM_FRAME],
        error: null,
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).get('/api/custom-frames');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Frame');
    });

    it('returns 500 when database query fails', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).get('/api/custom-frames');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });

    it('returns empty array when no frames exist', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).get('/api/custom-frames');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/custom-frames/:id', () => {
    it('returns 200 with single frame when found', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: MOCK_CUSTOM_FRAME,
        error: null,
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).get('/api/custom-frames/cf-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('cf-123');
    });

    it('returns 404 when frame not found', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).get('/api/custom-frames/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Custom frame not found');
    });

    it('returns 500 on database error', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).get('/api/custom-frames/cf-123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/custom-frames', () => {
    const VALID_CREATE_PAYLOAD = {
      title: 'New Frame',
      concept: 'New concept',
      pitch: 'New pitch',
      tone_feel: ['epic'],
      themes: ['adventure'],
    };

    it('returns 201 when frame is created successfully', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: { ...MOCK_CUSTOM_FRAME, ...VALID_CREATE_PAYLOAD },
        error: null,
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app)
        .post('/api/custom-frames')
        .send(VALID_CREATE_PAYLOAD);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Frame');
    });

    it('returns 400 when title is missing', async () => {
      const app = createTestApp();
      const response = await request(app)
        .post('/api/custom-frames')
        .send({ concept: 'test', pitch: 'test', tone_feel: [], themes: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('title');
    });

    it('returns 400 when concept is missing', async () => {
      const app = createTestApp();
      const response = await request(app)
        .post('/api/custom-frames')
        .send({ title: 'test', pitch: 'test', tone_feel: [], themes: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('concept');
    });

    it('returns 400 when pitch is missing', async () => {
      const app = createTestApp();
      const response = await request(app)
        .post('/api/custom-frames')
        .send({ title: 'test', concept: 'test', tone_feel: [], themes: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('pitch');
    });

    it('returns 400 when tone_feel is missing', async () => {
      const app = createTestApp();
      const response = await request(app)
        .post('/api/custom-frames')
        .send({ title: 'test', concept: 'test', pitch: 'test', themes: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('tone_feel');
    });

    it('returns 400 when themes is missing', async () => {
      const app = createTestApp();
      const response = await request(app)
        .post('/api/custom-frames')
        .send({ title: 'test', concept: 'test', pitch: 'test', tone_feel: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('themes');
    });

    it('returns 500 on database insert error', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app)
        .post('/api/custom-frames')
        .send(VALID_CREATE_PAYLOAD);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/custom-frames/:id', () => {
    it('returns 200 when frame is updated successfully', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: { ...MOCK_CUSTOM_FRAME, title: 'Updated Title' },
        error: null,
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app)
        .put('/api/custom-frames/cf-123')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('returns 404 when frame to update not found', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app)
        .put('/api/custom-frames/nonexistent')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('returns 400 when request body is empty', async () => {
      const app = createTestApp();
      const response = await request(app)
        .put('/api/custom-frames/cf-123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No fields');
    });

    it('returns 500 on database update error', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app)
        .put('/api/custom-frames/cf-123')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/custom-frames/:id', () => {
    it('returns 200 when frame is deleted successfully', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null,
        count: 1,
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).delete('/api/custom-frames/cf-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('returns 404 when frame to delete not found', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).delete(
        '/api/custom-frames/nonexistent'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('returns 500 on database delete error', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).delete('/api/custom-frames/cf-123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response format', () => {
    it('returns JSON content type for all responses', async () => {
      const mockSupabase = createMockSupabase();
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(getSupabase).mockReturnValue(mockSupabase as never);

      const app = createTestApp();
      const response = await request(app).get('/api/custom-frames');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
