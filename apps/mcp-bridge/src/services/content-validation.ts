/**
 * Content Validation Utilities
 *
 * Provides validation and parsing utilities for content routes.
 * Follows the pattern established in dial-validation.ts.
 */

import type {
  ItemCategory,
  EchoCategory,
  UnifiedItem,
  DaggerheartItem,
  DaggerheartWeapon,
  DaggerheartArmor,
  DaggerheartConsumable,
} from '@dagger-app/shared-types';
import { VALID_ECHO_CATEGORIES } from '../constants/echo-templates.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of a parse operation, containing either a value or an error
 */
export interface ParseResult<T> {
  value?: T;
  error?: string;
}

/**
 * Database query result shape
 */
export interface DbResult<T> {
  data: T[] | null;
  error: string | null;
}

// =============================================================================
// Constants
// =============================================================================

/** Valid tier range (1-4) */
export const TIER_BOUNDS = {
  min: 1,
  max: 4,
} as const;

/** Valid scene count range (3-6) */
export const SCENE_COUNT_BOUNDS = {
  min: 3,
  max: 6,
} as const;

/** Valid item categories */
export const VALID_ITEM_CATEGORIES: readonly ItemCategory[] = [
  'item',
  'weapon',
  'armor',
  'consumable',
] as const;

// =============================================================================
// Validators
// =============================================================================

/**
 * Check if a tier value is valid (1-4)
 */
export function isValidTier(tier: number): boolean {
  return Number.isInteger(tier) && tier >= TIER_BOUNDS.min && tier <= TIER_BOUNDS.max;
}

/**
 * Check if a scene count is valid (3-6)
 */
export function isValidSceneCount(count: number): boolean {
  return (
    Number.isInteger(count) && count >= SCENE_COUNT_BOUNDS.min && count <= SCENE_COUNT_BOUNDS.max
  );
}

/**
 * Check if a category is a valid item category
 */
export function isValidItemCategory(category: string): category is ItemCategory {
  return VALID_ITEM_CATEGORIES.includes(category as ItemCategory);
}

// =============================================================================
// Parsers
// =============================================================================

/**
 * Parse a tier query parameter
 */
export function parseTier(value: string | undefined): ParseResult<number> {
  if (value === undefined || value === '') {
    return { value: undefined };
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || !isValidTier(parsed)) {
    return {
      error: `tier must be a number between ${TIER_BOUNDS.min} and ${TIER_BOUNDS.max}`,
    };
  }

  return { value: parsed };
}

/**
 * Parse a limit query parameter
 */
export function parseLimit(value: string | undefined): ParseResult<number> {
  if (value === undefined || value === '') {
    return { value: undefined };
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) {
    return {
      error: 'limit must be a positive number',
    };
  }

  return { value: parsed };
}

/**
 * Parse an item category query parameter
 */
export function parseCategory(value: string | undefined): ParseResult<ItemCategory> {
  if (value === undefined || value === '') {
    return { value: undefined };
  }

  if (!isValidItemCategory(value)) {
    return {
      error: `category must be one of: ${VALID_ITEM_CATEGORIES.join(', ')}`,
    };
  }

  return { value: value as ItemCategory };
}

/**
 * Parse echo categories from request body
 * Returns all categories if input is undefined
 */
export function parseEchoCategories(
  categories: unknown[] | undefined
): ParseResult<EchoCategory[]> {
  if (categories === undefined) {
    return { value: [...VALID_ECHO_CATEGORIES] };
  }

  for (const cat of categories) {
    if (!VALID_ECHO_CATEGORIES.includes(cat as EchoCategory)) {
      return {
        error: `Invalid category: ${cat}. Must be one of: ${VALID_ECHO_CATEGORIES.join(', ')}`,
      };
    }
  }

  return { value: categories as EchoCategory[] };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Find the first error in an array of database results
 */
export function findFirstError<T>(results: DbResult<T>[]): string | null {
  for (const result of results) {
    if (result.error) {
      return result.error;
    }
  }
  return null;
}

/**
 * Build a unified items array from four separate item sources
 */
export function buildUnifiedItems(
  items: DaggerheartItem[],
  weapons: DaggerheartWeapon[],
  armor: DaggerheartArmor[],
  consumables: DaggerheartConsumable[]
): UnifiedItem[] {
  const unified: UnifiedItem[] = [];

  for (const item of items) {
    unified.push({ category: 'item', data: item });
  }

  for (const weapon of weapons) {
    unified.push({ category: 'weapon', data: weapon });
  }

  for (const armorItem of armor) {
    unified.push({ category: 'armor', data: armorItem });
  }

  for (const consumable of consumables) {
    unified.push({ category: 'consumable', data: consumable });
  }

  return unified;
}
