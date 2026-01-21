/**
 * Tests for content validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  TIER_BOUNDS,
  SCENE_COUNT_BOUNDS,
  VALID_ITEM_CATEGORIES,
  parseTier,
  parseLimit,
  parseCategory,
  parseEchoCategories,
  isValidTier,
  isValidSceneCount,
  isValidItemCategory,
  findFirstError,
  buildUnifiedItems,
} from './content-validation.js';
import type {
  ItemCategory,
  DaggerheartItem,
  DaggerheartWeapon,
  DaggerheartArmor,
  DaggerheartConsumable,
} from '@dagger-app/shared-types';
import type { DbResult } from './content-validation.js';

describe('Content Validation', () => {
  // ===========================================================================
  // Constants
  // ===========================================================================

  describe('TIER_BOUNDS', () => {
    it('should have min of 1 and max of 4', () => {
      expect(TIER_BOUNDS.min).toBe(1);
      expect(TIER_BOUNDS.max).toBe(4);
    });
  });

  describe('SCENE_COUNT_BOUNDS', () => {
    it('should have min of 3 and max of 6', () => {
      expect(SCENE_COUNT_BOUNDS.min).toBe(3);
      expect(SCENE_COUNT_BOUNDS.max).toBe(6);
    });
  });

  describe('VALID_ITEM_CATEGORIES', () => {
    it('should contain all 4 item categories', () => {
      expect(VALID_ITEM_CATEGORIES).toHaveLength(4);
      expect(VALID_ITEM_CATEGORIES).toContain('item');
      expect(VALID_ITEM_CATEGORIES).toContain('weapon');
      expect(VALID_ITEM_CATEGORIES).toContain('armor');
      expect(VALID_ITEM_CATEGORIES).toContain('consumable');
    });
  });

  // ===========================================================================
  // Validators
  // ===========================================================================

  describe('isValidTier', () => {
    it('should accept valid tiers (1-4)', () => {
      expect(isValidTier(1)).toBe(true);
      expect(isValidTier(2)).toBe(true);
      expect(isValidTier(3)).toBe(true);
      expect(isValidTier(4)).toBe(true);
    });

    it('should reject invalid tiers', () => {
      expect(isValidTier(0)).toBe(false);
      expect(isValidTier(5)).toBe(false);
      expect(isValidTier(-1)).toBe(false);
      expect(isValidTier(1.5)).toBe(false);
    });
  });

  describe('isValidSceneCount', () => {
    it('should accept valid scene counts (3-6)', () => {
      expect(isValidSceneCount(3)).toBe(true);
      expect(isValidSceneCount(4)).toBe(true);
      expect(isValidSceneCount(5)).toBe(true);
      expect(isValidSceneCount(6)).toBe(true);
    });

    it('should reject invalid scene counts', () => {
      expect(isValidSceneCount(2)).toBe(false);
      expect(isValidSceneCount(7)).toBe(false);
      expect(isValidSceneCount(0)).toBe(false);
      expect(isValidSceneCount(3.5)).toBe(false);
    });
  });

  describe('isValidItemCategory', () => {
    it('should accept valid item categories', () => {
      expect(isValidItemCategory('item')).toBe(true);
      expect(isValidItemCategory('weapon')).toBe(true);
      expect(isValidItemCategory('armor')).toBe(true);
      expect(isValidItemCategory('consumable')).toBe(true);
    });

    it('should reject invalid item categories', () => {
      expect(isValidItemCategory('invalid')).toBe(false);
      expect(isValidItemCategory('')).toBe(false);
      expect(isValidItemCategory('ITEM')).toBe(false);
    });
  });

  // ===========================================================================
  // Parsers
  // ===========================================================================

  describe('parseTier', () => {
    it('should parse valid tier strings', () => {
      expect(parseTier('1')).toEqual({ value: 1 });
      expect(parseTier('2')).toEqual({ value: 2 });
      expect(parseTier('3')).toEqual({ value: 3 });
      expect(parseTier('4')).toEqual({ value: 4 });
    });

    it('should return undefined for empty/undefined input', () => {
      expect(parseTier(undefined)).toEqual({ value: undefined });
      expect(parseTier('')).toEqual({ value: undefined });
    });

    it('should return error for invalid tier strings', () => {
      const result = parseTier('5');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('tier');
      expect(result.error).toContain('1');
      expect(result.error).toContain('4');
    });

    it('should return error for non-numeric strings', () => {
      const result = parseTier('abc');
      expect(result.error).toBeDefined();
    });

    it('should return error for out-of-range numbers', () => {
      expect(parseTier('0')?.error).toBeDefined();
      expect(parseTier('-1')?.error).toBeDefined();
    });
  });

  describe('parseLimit', () => {
    it('should parse valid limit strings', () => {
      expect(parseLimit('1')).toEqual({ value: 1 });
      expect(parseLimit('10')).toEqual({ value: 10 });
      expect(parseLimit('100')).toEqual({ value: 100 });
    });

    it('should return undefined for empty/undefined input', () => {
      expect(parseLimit(undefined)).toEqual({ value: undefined });
      expect(parseLimit('')).toEqual({ value: undefined });
    });

    it('should return error for invalid limit strings', () => {
      const result = parseLimit('0');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('limit');
      expect(result.error).toContain('positive');
    });

    it('should return error for non-numeric strings', () => {
      const result = parseLimit('abc');
      expect(result.error).toBeDefined();
    });

    it('should return error for negative numbers', () => {
      expect(parseLimit('-1')?.error).toBeDefined();
    });
  });

  describe('parseCategory', () => {
    it('should parse valid item category strings', () => {
      expect(parseCategory('item')).toEqual({ value: 'item' as ItemCategory });
      expect(parseCategory('weapon')).toEqual({ value: 'weapon' as ItemCategory });
      expect(parseCategory('armor')).toEqual({ value: 'armor' as ItemCategory });
      expect(parseCategory('consumable')).toEqual({ value: 'consumable' as ItemCategory });
    });

    it('should return undefined for empty/undefined input', () => {
      expect(parseCategory(undefined)).toEqual({ value: undefined });
      expect(parseCategory('')).toEqual({ value: undefined });
    });

    it('should return error for invalid category strings', () => {
      const result = parseCategory('invalid');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('category');
      expect(result.error).toContain('item');
      expect(result.error).toContain('weapon');
    });
  });

  describe('parseEchoCategories', () => {
    it('should return all categories when input is undefined', () => {
      const result = parseEchoCategories(undefined);
      expect(result.value).toHaveLength(5);
      expect(result.value).toContain('complications');
      expect(result.value).toContain('rumors');
      expect(result.value).toContain('discoveries');
      expect(result.value).toContain('intrusions');
      expect(result.value).toContain('wonders');
    });

    it('should parse valid echo category arrays', () => {
      const result = parseEchoCategories(['complications', 'rumors']);
      expect(result.value).toEqual(['complications', 'rumors']);
    });

    it('should return error for invalid echo categories', () => {
      const result = parseEchoCategories(['invalid']);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('invalid');
    });

    it('should return error when array contains any invalid category', () => {
      const result = parseEchoCategories(['complications', 'invalid']);
      expect(result.error).toBeDefined();
    });
  });

  // ===========================================================================
  // Utilities
  // ===========================================================================

  describe('findFirstError', () => {
    it('should return null when all results have no error', () => {
      const results: DbResult<number>[] = [
        { data: [1, 2, 3], error: null },
        { data: [4, 5], error: null },
        { data: [], error: null },
      ];
      expect(findFirstError(results)).toBeNull();
    });

    it('should return first error found', () => {
      const results: DbResult<number>[] = [
        { data: [], error: null },
        { data: null, error: 'First error' },
        { data: null, error: 'Second error' },
      ];
      expect(findFirstError(results)).toBe('First error');
    });

    it('should return null for empty array', () => {
      expect(findFirstError<number>([])).toBeNull();
    });
  });

  describe('buildUnifiedItems', () => {
    // Helper to create mock items with required fields
    const createMockItem = (id: string, name: string): DaggerheartItem => ({
      id,
      name,
      description: 'Test description',
      item_type: null,
      searchable_text: null,
      embedding: null,
      source_book: null,
      created_at: null,
    });

    const createMockWeapon = (id: string, name: string): DaggerheartWeapon => ({
      id,
      name,
      weapon_category: 'primary',
      tier: 1,
      trait: 'Agility',
      range: 'Melee',
      damage: '1d6',
      burden: null,
      feature: null,
      searchable_text: null,
      embedding: null,
      source_book: null,
      created_at: null,
    });

    const createMockArmor = (id: string, name: string): DaggerheartArmor => ({
      id,
      name,
      tier: 1,
      base_thresholds: '1/2/3',
      base_score: 0,
      feature: null,
      searchable_text: null,
      embedding: null,
      source_book: null,
      created_at: null,
    });

    const createMockConsumable = (id: string, name: string): DaggerheartConsumable => ({
      id,
      name,
      description: 'Test description',
      uses: null,
      searchable_text: null,
      embedding: null,
      source_book: null,
      created_at: null,
    });

    it('should combine items from all sources', () => {
      const items = [createMockItem('1', 'Item 1')];
      const weapons = [createMockWeapon('2', 'Weapon 1')];
      const armor = [createMockArmor('3', 'Armor 1')];
      const consumables = [createMockConsumable('4', 'Consumable 1')];

      const result = buildUnifiedItems(items, weapons, armor, consumables);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ category: 'item', data: items[0] });
      expect(result[1]).toEqual({ category: 'weapon', data: weapons[0] });
      expect(result[2]).toEqual({ category: 'armor', data: armor[0] });
      expect(result[3]).toEqual({ category: 'consumable', data: consumables[0] });
    });

    it('should handle empty arrays', () => {
      const result = buildUnifiedItems([], [], [], []);
      expect(result).toHaveLength(0);
    });

    it('should handle partial arrays', () => {
      const items = [createMockItem('1', 'Item 1')];
      const result = buildUnifiedItems(items, [], [], []);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ category: 'item', data: items[0] });
    });

    it('should maintain order by category', () => {
      const items = [createMockItem('1', 'Item 1'), createMockItem('2', 'Item 2')];
      const weapons = [createMockWeapon('3', 'Weapon 1')];
      const armor = [createMockArmor('4', 'Armor 1'), createMockArmor('5', 'Armor 2')];
      const consumables = [createMockConsumable('6', 'Consumable 1')];

      const result = buildUnifiedItems(items, weapons, armor, consumables);

      expect(result).toHaveLength(6);
      // Items first
      expect(result[0].category).toBe('item');
      expect(result[1].category).toBe('item');
      // Then weapons
      expect(result[2].category).toBe('weapon');
      // Then armor
      expect(result[3].category).toBe('armor');
      expect(result[4].category).toBe('armor');
      // Then consumables
      expect(result[5].category).toBe('consumable');
    });
  });
});
