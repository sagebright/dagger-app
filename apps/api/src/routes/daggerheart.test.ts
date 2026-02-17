/**
 * Tests for Daggerheart content routes
 *
 * Verifies GET /api/daggerheart/* routes return correct data
 * from mocked query functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import daggerheartRouter from './daggerheart.js';

// Mock the daggerheart-queries service
vi.mock('../services/daggerheart-queries.js', () => ({
  getFrames: vi.fn(),
  getAdversaries: vi.fn(),
  getItems: vi.fn(),
  getConsumables: vi.fn(),
  getWeapons: vi.fn(),
  getArmor: vi.fn(),
  getEnvironments: vi.fn(),
  getAncestries: vi.fn(),
  getClasses: vi.fn(),
  getSubclasses: vi.fn(),
  getDomains: vi.fn(),
  getAbilities: vi.fn(),
  getCommunities: vi.fn(),
  getLocations: vi.fn(),
  getNPCs: vi.fn(),
}));

import {
  getFrames,
  getAdversaries,
  getItems,
  getConsumables,
  getWeapons,
  getArmor,
  getEnvironments,
  getAncestries,
  getClasses,
  getSubclasses,
  getDomains,
  getAbilities,
  getCommunities,
  getLocations,
  getNPCs,
} from '../services/daggerheart-queries.js';

const mockGetFrames = vi.mocked(getFrames);
const mockGetAdversaries = vi.mocked(getAdversaries);
const mockGetItems = vi.mocked(getItems);
const mockGetConsumables = vi.mocked(getConsumables);
const mockGetWeapons = vi.mocked(getWeapons);
const mockGetArmor = vi.mocked(getArmor);
const mockGetEnvironments = vi.mocked(getEnvironments);
const mockGetAncestries = vi.mocked(getAncestries);
const mockGetClasses = vi.mocked(getClasses);
const mockGetSubclasses = vi.mocked(getSubclasses);
const mockGetDomains = vi.mocked(getDomains);
const mockGetAbilities = vi.mocked(getAbilities);
const mockGetCommunities = vi.mocked(getCommunities);
const mockGetLocations = vi.mocked(getLocations);
const mockGetNPCs = vi.mocked(getNPCs);

function createTestApp() {
  const app = express();
  app.use('/api/daggerheart', daggerheartRouter);
  return app;
}

describe('Daggerheart Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // GET /api/daggerheart/frames
  // =========================================================================

  describe('GET /api/daggerheart/frames', () => {
    it('returns frame data on success', async () => {
      const sampleFrames = [{ id: '1', name: 'Test Frame' }];
      mockGetFrames.mockResolvedValue({ data: sampleFrames, error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/frames');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(sampleFrames);
    });

    it('returns 500 on query error', async () => {
      mockGetFrames.mockResolvedValue({ data: null, error: 'Table not found' });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/frames');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Table not found');
    });
  });

  // =========================================================================
  // GET /api/daggerheart/adversaries
  // =========================================================================

  describe('GET /api/daggerheart/adversaries', () => {
    it('returns adversaries without filters', async () => {
      const sampleAdversaries = [{ id: '1', name: 'Goblin', tier: 1 }];
      mockGetAdversaries.mockResolvedValue({ data: sampleAdversaries, error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/adversaries');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(sampleAdversaries);
      expect(mockGetAdversaries).toHaveBeenCalledWith({
        tier: undefined,
        type: undefined,
        limit: undefined,
      });
    });

    it('passes tier filter from query params', async () => {
      mockGetAdversaries.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/adversaries?tier=2');

      expect(mockGetAdversaries).toHaveBeenCalledWith({
        tier: 2,
        type: undefined,
        limit: undefined,
      });
    });

    it('passes type filter from query params', async () => {
      mockGetAdversaries.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/adversaries?type=undead');

      expect(mockGetAdversaries).toHaveBeenCalledWith({
        tier: undefined,
        type: 'undead',
        limit: undefined,
      });
    });

    it('passes limit from query params', async () => {
      mockGetAdversaries.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/adversaries?limit=5');

      expect(mockGetAdversaries).toHaveBeenCalledWith({
        tier: undefined,
        type: undefined,
        limit: 5,
      });
    });

    it('ignores non-numeric tier values', async () => {
      mockGetAdversaries.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/adversaries?tier=abc');

      expect(mockGetAdversaries).toHaveBeenCalledWith({
        tier: undefined,
        type: undefined,
        limit: undefined,
      });
    });
  });

  // =========================================================================
  // GET /api/daggerheart/items
  // =========================================================================

  describe('GET /api/daggerheart/items', () => {
    it('returns items on success', async () => {
      const sampleItems = [{ id: '1', name: 'Healing Potion' }];
      mockGetItems.mockResolvedValue({ data: sampleItems, error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/items');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(sampleItems);
    });
  });

  // =========================================================================
  // GET /api/daggerheart/consumables
  // =========================================================================

  describe('GET /api/daggerheart/consumables', () => {
    it('returns consumables on success', async () => {
      mockGetConsumables.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/consumables');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  // =========================================================================
  // GET /api/daggerheart/weapons
  // =========================================================================

  describe('GET /api/daggerheart/weapons', () => {
    it('returns weapons on success', async () => {
      mockGetWeapons.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/weapons');

      expect(response.status).toBe(200);
    });

    it('passes tier and category filters', async () => {
      mockGetWeapons.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/weapons?tier=2&category=melee');

      expect(mockGetWeapons).toHaveBeenCalledWith({
        tier: 2,
        category: 'melee',
      });
    });
  });

  // =========================================================================
  // GET /api/daggerheart/armor
  // =========================================================================

  describe('GET /api/daggerheart/armor', () => {
    it('returns armor on success', async () => {
      mockGetArmor.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/armor');

      expect(response.status).toBe(200);
    });

    it('passes tier filter', async () => {
      mockGetArmor.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/armor?tier=3');

      expect(mockGetArmor).toHaveBeenCalledWith({ tier: 3 });
    });
  });

  // =========================================================================
  // GET /api/daggerheart/environments
  // =========================================================================

  describe('GET /api/daggerheart/environments', () => {
    it('returns environments on success', async () => {
      mockGetEnvironments.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/environments');

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // GET /api/daggerheart/ancestries
  // =========================================================================

  describe('GET /api/daggerheart/ancestries', () => {
    it('returns ancestries on success', async () => {
      mockGetAncestries.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/ancestries');

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // GET /api/daggerheart/classes
  // =========================================================================

  describe('GET /api/daggerheart/classes', () => {
    it('returns classes on success', async () => {
      mockGetClasses.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/classes');

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // GET /api/daggerheart/subclasses
  // =========================================================================

  describe('GET /api/daggerheart/subclasses', () => {
    it('returns subclasses on success', async () => {
      mockGetSubclasses.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/subclasses');

      expect(response.status).toBe(200);
    });

    it('passes parentClass filter', async () => {
      mockGetSubclasses.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/subclasses?parentClass=Warrior');

      expect(mockGetSubclasses).toHaveBeenCalledWith({ parentClass: 'Warrior' });
    });
  });

  // =========================================================================
  // GET /api/daggerheart/domains
  // =========================================================================

  describe('GET /api/daggerheart/domains', () => {
    it('returns domains on success', async () => {
      mockGetDomains.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/domains');

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // GET /api/daggerheart/abilities
  // =========================================================================

  describe('GET /api/daggerheart/abilities', () => {
    it('returns abilities on success', async () => {
      mockGetAbilities.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/abilities');

      expect(response.status).toBe(200);
    });

    it('passes all filter params', async () => {
      mockGetAbilities.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get(
        '/api/daggerheart/abilities?parentClass=Wizard&domain=Arcana&abilityType=spell'
      );

      expect(mockGetAbilities).toHaveBeenCalledWith({
        parentClass: 'Wizard',
        parentSubclass: undefined,
        domain: 'Arcana',
        abilityType: 'spell',
      });
    });
  });

  // =========================================================================
  // GET /api/daggerheart/communities
  // =========================================================================

  describe('GET /api/daggerheart/communities', () => {
    it('returns communities on success', async () => {
      mockGetCommunities.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/communities');

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // GET /api/daggerheart/locations
  // =========================================================================

  describe('GET /api/daggerheart/locations', () => {
    it('returns locations on success', async () => {
      mockGetLocations.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/locations');

      expect(response.status).toBe(200);
    });

    it('passes tier filter', async () => {
      mockGetLocations.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/locations?tier=1');

      expect(mockGetLocations).toHaveBeenCalledWith({ tier: 1 });
    });
  });

  // =========================================================================
  // GET /api/daggerheart/npcs
  // =========================================================================

  describe('GET /api/daggerheart/npcs', () => {
    it('returns npcs on success', async () => {
      mockGetNPCs.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      const response = await request(app).get('/api/daggerheart/npcs');

      expect(response.status).toBe(200);
    });

    it('passes tier and role filters', async () => {
      mockGetNPCs.mockResolvedValue({ data: [], error: null });

      const app = createTestApp();
      await request(app).get('/api/daggerheart/npcs?tier=2&role=ally');

      expect(mockGetNPCs).toHaveBeenCalledWith({ tier: 2, role: 'ally' });
    });
  });
});
