/**
 * Integration tests for adventure routes
 *
 * Following TDD: RED phase - write failing tests first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/express-utils.js';
import type { WebAdventure, Phase } from '@dagger-app/shared-types';

// Mock the web adventure queries service
vi.mock('../services/web-adventure-queries.js', () => ({
  saveAdventure: vi.fn(),
  loadAdventure: vi.fn(),
  getAdventureMetadata: vi.fn(),
  deleteAdventure: vi.fn(),
  markExported: vi.fn(),
}));

// Also mock supabase for test isolation
vi.mock('../services/supabase.js', () => ({
  getSupabase: vi.fn(),
  checkSupabaseHealth: vi.fn(),
  resetSupabaseClient: vi.fn(),
}));

// Import mocks after vi.mock
import {
  saveAdventure,
  loadAdventure,
  getAdventureMetadata,
  deleteAdventure,
  markExported,
} from '../services/web-adventure-queries.js';

// Helper to create a mock WebAdventure
function createMockAdventure(overrides: Partial<WebAdventure> = {}): WebAdventure {
  return {
    id: 'test-uuid',
    session_id: 'test-session-123',
    adventure_name: 'Test Adventure',
    current_phase: 'setup' as Phase,
    phase_history: ['setup'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    dials: {},
    confirmed_dials: [],
    selected_frame: null,
    frame_confirmed: false,
    current_outline: null,
    outline_confirmed: false,
    scenes: [],
    current_scene_id: null,
    npcs: [],
    confirmed_npc_ids: [],
    selected_adversaries: [],
    confirmed_adversary_ids: [],
    selected_items: [],
    confirmed_item_ids: [],
    echoes: [],
    confirmed_echo_ids: [],
    last_exported_at: null,
    export_count: 0,
    ...overrides,
  };
}

describe('Adventure Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /adventure/save', () => {
    it('returns 200 with success response when save succeeds', async () => {
      vi.mocked(saveAdventure).mockResolvedValue({
        data: {
          sessionId: 'test-session-123',
          updatedAt: '2024-01-15T12:00:00Z',
        },
        error: null,
      });

      const app = createTestApp();
      const response = await request(app)
        .post('/adventure/save')
        .send({
          sessionId: 'test-session-123',
          adventureName: 'Test Adventure',
          currentPhase: 'setup',
          phaseHistory: ['setup'],
          dialsConfirmed: [],
          frameConfirmed: false,
          outlineConfirmed: false,
          scenesConfirmed: 0,
          totalScenes: 0,
          lastUpdated: '2024-01-15T12:00:00Z',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBe('test-session-123');
      expect(response.body.updatedAt).toBeDefined();
    });

    it('returns 400 when required fields are missing', async () => {
      const app = createTestApp();
      const response = await request(app)
        .post('/adventure/save')
        .send({
          // Missing sessionId and adventureName
          currentPhase: 'setup',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 200 when adventureName is empty string (skip naming flow)', async () => {
      vi.mocked(saveAdventure).mockResolvedValue({
        data: {
          sessionId: 'test-session-123',
          updatedAt: '2024-01-15T12:00:00Z',
        },
        error: null,
      });

      const app = createTestApp();
      const response = await request(app)
        .post('/adventure/save')
        .send({
          sessionId: 'test-session-123',
          adventureName: '', // Empty string - user skipped naming
          currentPhase: 'setup',
          phaseHistory: ['setup'],
          dialsConfirmed: [],
          frameConfirmed: false,
          outlineConfirmed: false,
          scenesConfirmed: 0,
          totalScenes: 0,
          lastUpdated: '2024-01-15T12:00:00Z',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBe('test-session-123');
    });

    it('returns 500 when save fails', async () => {
      vi.mocked(saveAdventure).mockResolvedValue({
        data: null,
        error: 'Database connection failed',
      });

      const app = createTestApp();
      const response = await request(app)
        .post('/adventure/save')
        .send({
          sessionId: 'test-session-123',
          adventureName: 'Test Adventure',
          currentPhase: 'setup',
          phaseHistory: ['setup'],
          dialsConfirmed: [],
          frameConfirmed: false,
          outlineConfirmed: false,
          scenesConfirmed: 0,
          totalScenes: 0,
          lastUpdated: '2024-01-15T12:00:00Z',
        });

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('SAVE_FAILED');
    });
  });

  describe('GET /adventure/:sessionId', () => {
    it('returns 200 with adventure when found', async () => {
      const mockAdventure = createMockAdventure();
      vi.mocked(loadAdventure).mockResolvedValue({
        data: mockAdventure,
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).get('/adventure/test-session-123');

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(true);
      expect(response.body.adventure).toBeDefined();
      expect(response.body.adventure.session_id).toBe('test-session-123');
    });

    it('returns 200 with exists: false when not found', async () => {
      vi.mocked(loadAdventure).mockResolvedValue({
        data: null,
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).get('/adventure/non-existent');

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(false);
      expect(response.body.adventure).toBeUndefined();
    });

    it('returns 500 when load fails', async () => {
      vi.mocked(loadAdventure).mockResolvedValue({
        data: null,
        error: 'Query timeout',
      });

      const app = createTestApp();
      const response = await request(app).get('/adventure/test-session-123');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('LOAD_FAILED');
    });
  });

  describe('GET /adventure/:sessionId/metadata', () => {
    it('returns 200 with metadata when adventure exists', async () => {
      vi.mocked(getAdventureMetadata).mockResolvedValue({
        data: {
          exists: true,
          metadata: {
            sessionId: 'test-session-123',
            adventureName: 'Test Adventure',
            currentPhase: 'dial-tuning' as Phase,
            updatedAt: '2024-01-15T12:00:00Z',
            sceneCount: 3,
            npcCount: 5,
          },
        },
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).get('/adventure/test-session-123/metadata');

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(true);
      expect(response.body.metadata.sessionId).toBe('test-session-123');
      expect(response.body.metadata.sceneCount).toBe(3);
      expect(response.body.metadata.npcCount).toBe(5);
    });

    it('returns 200 with exists: false when not found', async () => {
      vi.mocked(getAdventureMetadata).mockResolvedValue({
        data: { exists: false },
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).get('/adventure/non-existent/metadata');

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(false);
      expect(response.body.metadata).toBeUndefined();
    });

    it('returns 500 when metadata query fails', async () => {
      vi.mocked(getAdventureMetadata).mockResolvedValue({
        data: null,
        error: 'Database error',
      });

      const app = createTestApp();
      const response = await request(app).get('/adventure/test-session-123/metadata');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('METADATA_FAILED');
    });
  });

  describe('DELETE /adventure/:sessionId', () => {
    it('returns 200 when delete succeeds', async () => {
      vi.mocked(deleteAdventure).mockResolvedValue({
        success: true,
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).delete('/adventure/test-session-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('returns 500 when delete fails', async () => {
      vi.mocked(deleteAdventure).mockResolvedValue({
        success: false,
        error: 'Foreign key constraint violation',
      });

      const app = createTestApp();
      const response = await request(app).delete('/adventure/test-session-123');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('DELETE_FAILED');
    });
  });

  describe('POST /adventure/:sessionId/export', () => {
    it('returns 200 with generated markdown files when adventure exists', async () => {
      const mockAdventure = createMockAdventure({
        adventure_name: 'The Lost Temple',
        selected_frame: {
          id: 'frame-1',
          name: 'Test Frame',
          description: 'A test frame',
          themes: ['adventure'],
          typical_adversaries: ['goblin'],
          lore: 'Test lore',
          embedding: null,
          source_book: 'Core',
          created_at: '2024-01-15T10:00:00Z',
        },
      });
      vi.mocked(loadAdventure).mockResolvedValue({
        data: mockAdventure,
        error: null,
      });
      vi.mocked(markExported).mockResolvedValue({
        data: {
          lastExportedAt: '2024-01-15T15:00:00Z',
          exportCount: 2,
        },
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).post('/adventure/test-session-123/export');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(response.body.files.length).toBeGreaterThan(0);
      expect(response.body.files[0]).toHaveProperty('path');
      expect(response.body.files[0]).toHaveProperty('content');
      expect(response.body.adventureName).toBe('The Lost Temple');
      expect(response.body.generatedAt).toBeDefined();
      expect(response.body.lastExportedAt).toBe('2024-01-15T15:00:00Z');
      expect(response.body.exportCount).toBe(2);
    });

    it('returns 404 when adventure not found', async () => {
      vi.mocked(loadAdventure).mockResolvedValue({
        data: null,
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).post('/adventure/non-existent/export');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('returns 500 when load fails', async () => {
      vi.mocked(loadAdventure).mockResolvedValue({
        data: null,
        error: 'Database error',
      });

      const app = createTestApp();
      const response = await request(app).post('/adventure/test-session-123/export');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('LOAD_FAILED');
    });

    it('still returns files even if markExported fails', async () => {
      const mockAdventure = createMockAdventure();
      vi.mocked(loadAdventure).mockResolvedValue({
        data: mockAdventure,
        error: null,
      });
      vi.mocked(markExported).mockResolvedValue({
        data: null,
        error: 'Failed to mark',
      });

      const app = createTestApp();
      const response = await request(app).post('/adventure/test-session-123/export');

      expect(response.status).toBe(200);
      expect(response.body.files).toBeDefined();
      expect(Array.isArray(response.body.files)).toBe(true);
    });

    it('returns adventure.md in files list', async () => {
      const mockAdventure = createMockAdventure();
      vi.mocked(loadAdventure).mockResolvedValue({
        data: mockAdventure,
        error: null,
      });
      vi.mocked(markExported).mockResolvedValue({
        data: { lastExportedAt: '2024-01-15T15:00:00Z', exportCount: 1 },
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).post('/adventure/test-session-123/export');

      expect(response.body.files.some((f: { path: string }) => f.path === 'adventure.md')).toBe(true);
    });
  });

  describe('Response headers', () => {
    it('returns JSON content type', async () => {
      vi.mocked(loadAdventure).mockResolvedValue({
        data: null,
        error: null,
      });

      const app = createTestApp();
      const response = await request(app).get('/adventure/test-session-123');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
