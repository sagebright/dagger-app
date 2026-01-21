/**
 * Tests for content route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { DaggerheartFrame } from '@dagger-app/shared-types';
import contentRouter from './content.js';
import * as daggerheartQueries from '../services/daggerheart-queries.js';

// Mock the Supabase queries
vi.mock('../services/daggerheart-queries.js', () => ({
  getFrames: vi.fn(),
  getFrameByName: vi.fn(),
}));

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/content', contentRouter);
  return app;
}

// Mock frame data
const mockFrames: DaggerheartFrame[] = [
  {
    id: 'frame-1',
    name: 'The Dark Forest',
    description: 'A mysterious forest full of danger',
    themes: ['mystery', 'horror'],
    typical_adversaries: ['beasts', 'undead'],
    lore: 'Ancient evil lurks beneath the trees',
    embedding: null,
    source_book: 'Core Rulebook',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'frame-2',
    name: 'City of Shadows',
    description: 'A sprawling city with criminal underbelly',
    themes: ['urban', 'political'],
    typical_adversaries: ['humanoid', 'demons'],
    lore: 'Factions vie for control in the shadows',
    embedding: null,
    source_book: 'Core Rulebook',
    created_at: '2024-01-01T00:00:00.000Z',
  },
];

describe('Content Route', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /content/frames', () => {
    it('should return all frames', async () => {
      vi.mocked(daggerheartQueries.getFrames).mockResolvedValue({
        data: mockFrames,
        error: null,
      });

      const response = await request(app).get('/content/frames');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('frames');
      expect(response.body.frames).toHaveLength(2);
      expect(response.body.frames[0]).toHaveProperty('name', 'The Dark Forest');
    });

    it('should filter frames by theme', async () => {
      vi.mocked(daggerheartQueries.getFrames).mockResolvedValue({
        data: mockFrames,
        error: null,
      });

      const response = await request(app)
        .get('/content/frames')
        .query({ themes: 'horror' });

      expect(response.status).toBe(200);
      expect(response.body.frames).toHaveLength(1);
      expect(response.body.frames[0].name).toBe('The Dark Forest');
    });

    it('should handle database errors', async () => {
      vi.mocked(daggerheartQueries.getFrames).mockResolvedValue({
        data: null,
        error: 'Database connection failed',
      });

      const response = await request(app).get('/content/frames');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', 'DATABASE_ERROR');
    });

    it('should return empty array when no frames match', async () => {
      vi.mocked(daggerheartQueries.getFrames).mockResolvedValue({
        data: mockFrames,
        error: null,
      });

      const response = await request(app)
        .get('/content/frames')
        .query({ themes: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.frames).toHaveLength(0);
    });
  });

  describe('GET /content/frames/:name', () => {
    it('should return a specific frame', async () => {
      vi.mocked(daggerheartQueries.getFrameByName).mockResolvedValue({
        data: mockFrames[0],
        error: null,
      });

      const response = await request(app).get('/content/frames/The%20Dark%20Forest');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'The Dark Forest');
      expect(response.body).toHaveProperty('themes');
    });

    it('should return 404 for non-existent frame', async () => {
      vi.mocked(daggerheartQueries.getFrameByName).mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await request(app).get('/content/frames/NonExistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });
  });

  describe('POST /content/frame/generate', () => {
    it('should generate a frame draft from description', async () => {
      vi.mocked(daggerheartQueries.getFrames).mockResolvedValue({
        data: mockFrames,
        error: null,
      });

      const response = await request(app)
        .post('/content/frame/generate')
        .send({
          userMessage: 'A dark horror adventure in a haunted mansion with ghosts and undead servants',
          dialsSummary: {
            partySize: 4,
            partyTier: 2,
            sceneCount: 4,
            tone: 'grim',
            themes: ['horror'],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messageId');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('isComplete');
      // Should have a frame draft since the message has enough detail
      if (response.body.isComplete) {
        expect(response.body).toHaveProperty('frameDraft');
        expect(response.body.frameDraft).toHaveProperty('name');
        expect(response.body.frameDraft).toHaveProperty('description');
        expect(response.body.frameDraft).toHaveProperty('themes');
      }
    });

    it('should ask follow-up question for incomplete description', async () => {
      vi.mocked(daggerheartQueries.getFrames).mockResolvedValue({
        data: mockFrames,
        error: null,
      });

      const response = await request(app)
        .post('/content/frame/generate')
        .send({
          userMessage: 'adventure',
          dialsSummary: {
            partySize: 4,
            partyTier: 1,
            sceneCount: 4,
            tone: null,
            themes: [],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.isComplete).toBe(false);
      expect(response.body).toHaveProperty('followUpQuestion');
    });

    it('should return 400 for missing userMessage', async () => {
      const response = await request(app)
        .post('/content/frame/generate')
        .send({
          dialsSummary: {
            partySize: 4,
            partyTier: 1,
            sceneCount: 4,
            tone: null,
            themes: [],
          },
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
    });

    it('should return 400 for missing dialsSummary', async () => {
      const response = await request(app)
        .post('/content/frame/generate')
        .send({
          userMessage: 'A dark adventure',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
    });

    it('should extract themes from user message', async () => {
      vi.mocked(daggerheartQueries.getFrames).mockResolvedValue({
        data: mockFrames,
        error: null,
      });

      const response = await request(app)
        .post('/content/frame/generate')
        .send({
          userMessage: 'A mystery adventure where players investigate clues to solve a murder in a noble court',
          dialsSummary: {
            partySize: 4,
            partyTier: 2,
            sceneCount: 5,
            tone: 'dramatic',
            themes: [],
          },
        });

      expect(response.status).toBe(200);
      if (response.body.isComplete && response.body.frameDraft) {
        expect(response.body.frameDraft.themes).toContain('mystery');
        expect(response.body.frameDraft.themes).toContain('political');
      }
    });

    it('should extract adversaries from user message', async () => {
      vi.mocked(daggerheartQueries.getFrames).mockResolvedValue({
        data: mockFrames,
        error: null,
      });

      const response = await request(app)
        .post('/content/frame/generate')
        .send({
          userMessage: 'A dungeon crawl with undead zombies and skeletons guarding ancient tombs',
          dialsSummary: {
            partySize: 4,
            partyTier: 1,
            sceneCount: 6,
            tone: 'action',
            themes: [],
          },
        });

      expect(response.status).toBe(200);
      if (response.body.isComplete && response.body.frameDraft) {
        expect(response.body.frameDraft.typicalAdversaries).toContain('undead');
      }
    });
  });

  describe('POST /content/outline/generate', () => {
    const mockFrame = {
      id: 'frame-1',
      name: 'The Dark Forest',
      description: 'A mysterious forest full of danger and ancient secrets',
      themes: ['mystery', 'horror'],
      typical_adversaries: ['beasts', 'undead'],
    };

    const mockDialsSummary = {
      partySize: 4,
      partyTier: 2,
      sceneCount: 4,
      sessionLength: 'standard',
      tone: 'dramatic',
      themes: ['mystery'],
      combatExplorationBalance: 'balanced',
      lethality: 'standard',
    };

    it('should generate an outline with scene briefs', async () => {
      const response = await request(app)
        .post('/content/outline/generate')
        .send({
          frame: mockFrame,
          dialsSummary: mockDialsSummary,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messageId');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('isComplete', true);
      expect(response.body).toHaveProperty('outline');
      expect(response.body.outline).toHaveProperty('title');
      expect(response.body.outline).toHaveProperty('summary');
      expect(response.body.outline).toHaveProperty('scenes');
      expect(response.body.outline.scenes).toHaveLength(4);
    });

    it('should respect scene count from dials', async () => {
      const response = await request(app)
        .post('/content/outline/generate')
        .send({
          frame: mockFrame,
          dialsSummary: { ...mockDialsSummary, sceneCount: 6 },
        });

      expect(response.status).toBe(200);
      expect(response.body.outline.scenes).toHaveLength(6);
    });

    it('should return 400 for missing frame', async () => {
      const response = await request(app)
        .post('/content/outline/generate')
        .send({
          dialsSummary: mockDialsSummary,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.message).toContain('frame');
    });

    it('should return 400 for missing dialsSummary', async () => {
      const response = await request(app)
        .post('/content/outline/generate')
        .send({
          frame: mockFrame,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.message).toContain('dialsSummary');
    });

    it('should return 400 for invalid scene count', async () => {
      const response = await request(app)
        .post('/content/outline/generate')
        .send({
          frame: mockFrame,
          dialsSummary: { ...mockDialsSummary, sceneCount: 10 },
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.message).toContain('sceneCount');
    });

    it('should accept feedback for regeneration', async () => {
      const response = await request(app)
        .post('/content/outline/generate')
        .send({
          frame: mockFrame,
          dialsSummary: mockDialsSummary,
          feedback: 'Add more combat scenes',
          previousOutline: {
            id: 'old-outline',
            title: 'Old Title',
            summary: 'Old summary',
            scenes: [],
            isConfirmed: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('outline');
      expect(response.body.content).toContain('revised');
    });

    it('should include scene types in generated scenes', async () => {
      const response = await request(app)
        .post('/content/outline/generate')
        .send({
          frame: mockFrame,
          dialsSummary: mockDialsSummary,
        });

      expect(response.status).toBe(200);
      response.body.outline.scenes.forEach((scene: { sceneType?: string }) => {
        expect(scene).toHaveProperty('sceneType');
        expect(['combat', 'exploration', 'social', 'puzzle', 'revelation', 'mixed']).toContain(scene.sceneType);
      });
    });

    it('should include key elements in each scene', async () => {
      const response = await request(app)
        .post('/content/outline/generate')
        .send({
          frame: mockFrame,
          dialsSummary: mockDialsSummary,
        });

      expect(response.status).toBe(200);
      response.body.outline.scenes.forEach((scene: { keyElements?: string[] }) => {
        expect(scene).toHaveProperty('keyElements');
        expect(Array.isArray(scene.keyElements)).toBe(true);
        expect(scene.keyElements?.length).toBeGreaterThan(0);
      });
    });
  });
});
