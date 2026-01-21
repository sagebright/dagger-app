/**
 * Tests for content route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type {
  DaggerheartFrame,
  DaggerheartAdversary,
  DaggerheartItem,
  DaggerheartWeapon,
  DaggerheartArmor,
  DaggerheartConsumable,
} from '@dagger-app/shared-types';
import contentRouter from './content.js';
import * as daggerheartQueries from '../services/daggerheart-queries.js';

// Mock the Supabase queries
vi.mock('../services/daggerheart-queries.js', () => ({
  getFrames: vi.fn(),
  getFrameByName: vi.fn(),
  getAdversaries: vi.fn(),
  getAdversaryByName: vi.fn(),
  getAdversaryTypes: vi.fn(),
  getItems: vi.fn(),
  getWeapons: vi.fn(),
  getArmor: vi.fn(),
  getConsumables: vi.fn(),
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

// Mock adversary data
const mockAdversaries: DaggerheartAdversary[] = [
  {
    id: 'adv-1',
    name: 'Dire Wolf',
    tier: 2,
    type: 'beast',
    description: 'A massive wolf with supernatural hunger',
    motives_tactics: ['pack attack', 'pursuit'],
    difficulty: 5,
    thresholds: '3',
    hp: 12,
    stress: 8,
    atk: '+3',
    weapon: 'Bite',
    range: 'melee',
    dmg: '1d6+2',
    experiences: { xp: 75 },
    features: [{ name: 'Pack Tactics', effect: '+1 to hit per ally' }],
    searchable_text: 'dire wolf beast animal canine',
    embedding: null,
    source_book: 'Core Rulebook',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'adv-2',
    name: 'Bandit Captain',
    tier: 2,
    type: 'humanoid',
    description: 'A cunning leader of outlaws',
    motives_tactics: ['command allies', 'tactical retreat'],
    difficulty: 6,
    thresholds: '4',
    hp: 15,
    stress: 10,
    atk: '+4',
    weapon: 'Longsword',
    range: 'melee',
    dmg: '1d8+3',
    experiences: { xp: 100 },
    features: [{ name: 'Rally', effect: 'Allies gain +1 to attacks' }],
    searchable_text: 'bandit captain humanoid criminal outlaw',
    embedding: null,
    source_book: 'Core Rulebook',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'adv-3',
    name: 'Skeleton Guard',
    tier: 1,
    type: 'undead',
    description: 'An animated skeletal warrior',
    motives_tactics: ['defend position', 'mindless attack'],
    difficulty: 3,
    thresholds: '2',
    hp: 8,
    stress: 4,
    atk: '+2',
    weapon: 'Rusty Sword',
    range: 'melee',
    dmg: '1d6',
    experiences: { xp: 50 },
    features: [{ name: 'Undead', effect: 'Immune to fear and poison' }],
    searchable_text: 'skeleton guard undead bone warrior',
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
      pillarBalance: 'balanced',
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

  // ==========================================================================
  // Adversary Routes (Phase 4.1)
  // ==========================================================================

  describe('GET /content/adversaries', () => {
    it('should return all adversaries', async () => {
      vi.mocked(daggerheartQueries.getAdversaries).mockResolvedValue({
        data: mockAdversaries,
        error: null,
      });

      const response = await request(app).get('/content/adversaries');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('adversaries');
      expect(response.body).toHaveProperty('availableTypes');
      expect(response.body.adversaries).toHaveLength(3);
      expect(response.body.availableTypes).toContain('beast');
      expect(response.body.availableTypes).toContain('humanoid');
      expect(response.body.availableTypes).toContain('undead');
    });

    it('should filter by tier', async () => {
      vi.mocked(daggerheartQueries.getAdversaries).mockResolvedValue({
        data: mockAdversaries.filter((a) => a.tier === 2),
        error: null,
      });

      const response = await request(app)
        .get('/content/adversaries')
        .query({ tier: '2' });

      expect(response.status).toBe(200);
      expect(response.body.adversaries).toHaveLength(2);
      expect(response.body.adversaries.every((a: DaggerheartAdversary) => a.tier === 2)).toBe(true);
      expect(daggerheartQueries.getAdversaries).toHaveBeenCalledWith({ tier: 2 });
    });

    it('should filter by type', async () => {
      vi.mocked(daggerheartQueries.getAdversaries).mockResolvedValue({
        data: mockAdversaries.filter((a) => a.type === 'beast'),
        error: null,
      });

      const response = await request(app)
        .get('/content/adversaries')
        .query({ type: 'beast' });

      expect(response.status).toBe(200);
      expect(response.body.adversaries).toHaveLength(1);
      expect(response.body.adversaries[0].name).toBe('Dire Wolf');
      expect(daggerheartQueries.getAdversaries).toHaveBeenCalledWith({ type: 'beast' });
    });

    it('should combine tier and type filters', async () => {
      vi.mocked(daggerheartQueries.getAdversaries).mockResolvedValue({
        data: mockAdversaries.filter((a) => a.tier === 2 && a.type === 'humanoid'),
        error: null,
      });

      const response = await request(app)
        .get('/content/adversaries')
        .query({ tier: '2', type: 'humanoid' });

      expect(response.status).toBe(200);
      expect(response.body.adversaries).toHaveLength(1);
      expect(response.body.adversaries[0].name).toBe('Bandit Captain');
      expect(daggerheartQueries.getAdversaries).toHaveBeenCalledWith({ tier: 2, type: 'humanoid' });
    });

    it('should respect limit parameter', async () => {
      vi.mocked(daggerheartQueries.getAdversaries).mockResolvedValue({
        data: mockAdversaries.slice(0, 2),
        error: null,
      });

      const response = await request(app)
        .get('/content/adversaries')
        .query({ limit: '2' });

      expect(response.status).toBe(200);
      expect(response.body.adversaries).toHaveLength(2);
      expect(daggerheartQueries.getAdversaries).toHaveBeenCalledWith({ limit: 2 });
    });

    it('should return 400 for invalid tier', async () => {
      const response = await request(app)
        .get('/content/adversaries')
        .query({ tier: '5' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.message).toContain('tier');
    });

    it('should return 400 for non-numeric tier', async () => {
      const response = await request(app)
        .get('/content/adversaries')
        .query({ tier: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/content/adversaries')
        .query({ limit: '-1' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.message).toContain('limit');
    });

    it('should handle database errors', async () => {
      vi.mocked(daggerheartQueries.getAdversaries).mockResolvedValue({
        data: null,
        error: 'Database connection failed',
      });

      const response = await request(app).get('/content/adversaries');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', 'DATABASE_ERROR');
    });

    it('should return empty array when no adversaries match', async () => {
      vi.mocked(daggerheartQueries.getAdversaries).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/content/adversaries')
        .query({ tier: '4' });

      expect(response.status).toBe(200);
      expect(response.body.adversaries).toHaveLength(0);
      expect(response.body.availableTypes).toHaveLength(0);
    });

    it('should return sorted unique types', async () => {
      vi.mocked(daggerheartQueries.getAdversaries).mockResolvedValue({
        data: mockAdversaries,
        error: null,
      });

      const response = await request(app).get('/content/adversaries');

      expect(response.status).toBe(200);
      // Types should be sorted alphabetically
      expect(response.body.availableTypes).toEqual(['beast', 'humanoid', 'undead']);
    });
  });

  describe('GET /content/adversaries/types', () => {
    it('should return all available types', async () => {
      vi.mocked(daggerheartQueries.getAdversaryTypes).mockResolvedValue({
        data: ['beast', 'humanoid', 'undead'],
        error: null,
      });

      const response = await request(app).get('/content/adversaries/types');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('types');
      expect(response.body.types).toContain('beast');
      expect(response.body.types).toContain('humanoid');
      expect(response.body.types).toContain('undead');
    });

    it('should return sorted unique types', async () => {
      vi.mocked(daggerheartQueries.getAdversaryTypes).mockResolvedValue({
        data: ['beast', 'humanoid', 'undead'],
        error: null,
      });

      const response = await request(app).get('/content/adversaries/types');

      expect(response.status).toBe(200);
      expect(response.body.types).toEqual(['beast', 'humanoid', 'undead']);
    });

    it('should handle database errors', async () => {
      vi.mocked(daggerheartQueries.getAdversaryTypes).mockResolvedValue({
        data: null,
        error: 'Database connection failed',
      });

      const response = await request(app).get('/content/adversaries/types');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', 'DATABASE_ERROR');
    });
  });

  describe('GET /content/adversaries/:name', () => {
    it('should return a specific adversary', async () => {
      vi.mocked(daggerheartQueries.getAdversaryByName).mockResolvedValue({
        data: mockAdversaries[0],
        error: null,
      });

      const response = await request(app).get('/content/adversaries/Dire%20Wolf');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Dire Wolf');
      expect(response.body).toHaveProperty('tier', 2);
      expect(response.body).toHaveProperty('type', 'beast');
      expect(response.body).toHaveProperty('hp', 12);
    });

    it('should return 404 for non-existent adversary', async () => {
      vi.mocked(daggerheartQueries.getAdversaryByName).mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await request(app).get('/content/adversaries/NonExistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should handle URL-encoded names', async () => {
      vi.mocked(daggerheartQueries.getAdversaryByName).mockResolvedValue({
        data: mockAdversaries[1],
        error: null,
      });

      const response = await request(app).get('/content/adversaries/Bandit%20Captain');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Bandit Captain');
      expect(daggerheartQueries.getAdversaryByName).toHaveBeenCalledWith('Bandit Captain');
    });

    it('should handle database errors', async () => {
      vi.mocked(daggerheartQueries.getAdversaryByName).mockResolvedValue({
        data: null,
        error: 'Database connection failed',
      });

      const response = await request(app).get('/content/adversaries/Dire%20Wolf');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', 'DATABASE_ERROR');
    });
  });

  // ==========================================================================
  // Item Routes (Phase 4.2)
  // ==========================================================================

  describe('GET /content/items', () => {
    // Mock data for items
    const mockItems: DaggerheartItem[] = [
      {
        id: 'item-1',
        name: 'Torch',
        description: 'A simple wooden torch that provides light',
        item_type: 'gear',
        searchable_text: 'torch light gear',
        embedding: null,
        source_book: 'Core Rulebook',
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'item-2',
        name: 'Rope',
        description: '50 feet of sturdy hemp rope',
        item_type: 'gear',
        searchable_text: 'rope climbing gear',
        embedding: null,
        source_book: 'Core Rulebook',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockWeapons: DaggerheartWeapon[] = [
      {
        id: 'weapon-1',
        name: 'Longsword',
        weapon_category: 'Blade',
        tier: 2,
        trait: 'Versatile',
        range: 'melee',
        damage: '1d8',
        burden: '1',
        feature: 'Can be used one or two-handed',
        searchable_text: 'longsword blade melee',
        embedding: null,
        source_book: 'Core Rulebook',
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'weapon-2',
        name: 'Shortbow',
        weapon_category: 'Bow',
        tier: 1,
        trait: 'Ranged',
        range: 'far',
        damage: '1d6',
        burden: '1',
        feature: null,
        searchable_text: 'shortbow bow ranged',
        embedding: null,
        source_book: 'Core Rulebook',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockArmor: DaggerheartArmor[] = [
      {
        id: 'armor-1',
        name: 'Chain Mail',
        tier: 2,
        base_thresholds: '3/5/7',
        base_score: 3,
        feature: 'Heavy armor',
        searchable_text: 'chain mail armor heavy',
        embedding: null,
        source_book: 'Core Rulebook',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    const mockConsumables: DaggerheartConsumable[] = [
      {
        id: 'consumable-1',
        name: 'Healing Potion',
        description: 'Restores 2d4 HP',
        uses: 1,
        searchable_text: 'healing potion consumable',
        embedding: null,
        source_book: 'Core Rulebook',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ];

    beforeEach(() => {
      vi.mocked(daggerheartQueries.getItems).mockResolvedValue({
        data: mockItems,
        error: null,
      });
      vi.mocked(daggerheartQueries.getWeapons).mockResolvedValue({
        data: mockWeapons,
        error: null,
      });
      vi.mocked(daggerheartQueries.getArmor).mockResolvedValue({
        data: mockArmor,
        error: null,
      });
      vi.mocked(daggerheartQueries.getConsumables).mockResolvedValue({
        data: mockConsumables,
        error: null,
      });
    });

    it('should return unified items from all categories', async () => {
      const response = await request(app).get('/content/items');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('availableCategories');
      // 2 items + 2 weapons + 1 armor + 1 consumable = 6 total
      expect(response.body.items).toHaveLength(6);
      expect(response.body.availableCategories).toContain('item');
      expect(response.body.availableCategories).toContain('weapon');
      expect(response.body.availableCategories).toContain('armor');
      expect(response.body.availableCategories).toContain('consumable');
    });

    it('should return items with category discriminator', async () => {
      const response = await request(app).get('/content/items');

      expect(response.status).toBe(200);
      const weaponItem = response.body.items.find(
        (i: { category: string; data: { name: string } }) =>
          i.category === 'weapon' && i.data.name === 'Longsword'
      );
      expect(weaponItem).toBeDefined();
      expect(weaponItem.category).toBe('weapon');
      expect(weaponItem.data.tier).toBe(2);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/content/items')
        .query({ category: 'weapon' });

      expect(response.status).toBe(200);
      expect(response.body.items.every((i: { category: string }) => i.category === 'weapon')).toBe(true);
      expect(response.body.items).toHaveLength(2);
    });

    it('should filter weapons/armor by tier', async () => {
      vi.mocked(daggerheartQueries.getWeapons).mockResolvedValue({
        data: mockWeapons.filter((w) => w.tier === 2),
        error: null,
      });
      vi.mocked(daggerheartQueries.getArmor).mockResolvedValue({
        data: mockArmor.filter((a) => a.tier === 2),
        error: null,
      });

      const response = await request(app)
        .get('/content/items')
        .query({ tier: '2' });

      expect(response.status).toBe(200);
      // T2 weapons (1) + T2 armor (1) + all items (2) + all consumables (1) = 5
      expect(response.body.items).toHaveLength(5);
      expect(daggerheartQueries.getWeapons).toHaveBeenCalledWith({ tier: 2 });
      expect(daggerheartQueries.getArmor).toHaveBeenCalledWith({ tier: 2 });
    });

    it('should return 400 for invalid tier', async () => {
      const response = await request(app)
        .get('/content/items')
        .query({ tier: '5' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.message).toContain('tier');
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app)
        .get('/content/items')
        .query({ category: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'INVALID_REQUEST');
      expect(response.body.message).toContain('category');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/content/items')
        .query({ limit: '3' });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(3);
    });

    it('should handle database errors for items', async () => {
      vi.mocked(daggerheartQueries.getItems).mockResolvedValue({
        data: null,
        error: 'Database connection failed',
      });

      const response = await request(app).get('/content/items');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', 'DATABASE_ERROR');
    });

    it('should handle database errors for weapons', async () => {
      vi.mocked(daggerheartQueries.getWeapons).mockResolvedValue({
        data: null,
        error: 'Database connection failed',
      });

      const response = await request(app).get('/content/items');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('code', 'DATABASE_ERROR');
    });

    it('should return empty array when no items exist', async () => {
      vi.mocked(daggerheartQueries.getItems).mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(daggerheartQueries.getWeapons).mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(daggerheartQueries.getArmor).mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(daggerheartQueries.getConsumables).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app).get('/content/items');

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
      expect(response.body.availableCategories).toHaveLength(0);
    });

    it('should return sorted categories', async () => {
      const response = await request(app).get('/content/items');

      expect(response.status).toBe(200);
      expect(response.body.availableCategories).toEqual(['armor', 'consumable', 'item', 'weapon']);
    });
  });

  // ===========================================================================
  // Echo Routes (Phase 4.3)
  // ===========================================================================

  describe('POST /content/echoes/generate', () => {
    const validRequest = {
      categories: ['complications', 'rumors'],
    };

    it('should return 200 and generated echoes', async () => {
      const response = await request(app)
        .post('/content/echoes/generate')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.messageId).toBeDefined();
      expect(response.body.content).toBeDefined();
      expect(response.body.echoes).toBeDefined();
      expect(Array.isArray(response.body.echoes)).toBe(true);
      expect(response.body.isComplete).toBe(true);
    });

    it('should generate echoes for all categories when none specified', async () => {
      const response = await request(app)
        .post('/content/echoes/generate')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.echoes).toBeDefined();
      // Should generate for all 5 categories
      const categories = new Set(response.body.echoes.map((e: { category: string }) => e.category));
      expect(categories.size).toBe(5);
    });

    it('should generate echoes for specified categories only', async () => {
      const response = await request(app)
        .post('/content/echoes/generate')
        .send({ categories: ['complications', 'rumors'] });

      expect(response.status).toBe(200);
      const categories = new Set(response.body.echoes.map((e: { category: string }) => e.category));
      expect(categories.has('complications')).toBe(true);
      expect(categories.has('rumors')).toBe(true);
      expect(categories.has('discoveries')).toBe(false);
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app)
        .post('/content/echoes/generate')
        .send({ categories: ['invalid-category'] });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_REQUEST');
    });

    it('should return valid echo structure', async () => {
      const response = await request(app)
        .post('/content/echoes/generate')
        .send({ categories: ['complications'] });

      expect(response.status).toBe(200);
      expect(response.body.echoes.length).toBeGreaterThan(0);

      const echo = response.body.echoes[0];
      expect(echo.id).toBeDefined();
      expect(echo.category).toBe('complications');
      expect(echo.title).toBeDefined();
      expect(echo.content).toBeDefined();
      expect(echo.isConfirmed).toBe(false);
      expect(echo.createdAt).toBeDefined();
    });

    it('should include message ID in response', async () => {
      const response = await request(app)
        .post('/content/echoes/generate')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.messageId).toMatch(/^[a-f0-9-]+$/);
    });

    it('should include assistant message in response', async () => {
      const response = await request(app)
        .post('/content/echoes/generate')
        .send({});

      expect(response.status).toBe(200);
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(0);
    });
  });
});
