/**
 * Tests for dial validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateDialValue,
  validateDialUpdate,
  getDialValidationError,
  isConceptualDial,
  isConcreteDial,
} from './dial-validation.js';
import type { DialUpdate } from '@dagger-app/shared-types';

describe('Dial Validation', () => {
  describe('validateDialValue', () => {
    describe('partySize', () => {
      it('should accept valid party size (2-5)', () => {
        expect(validateDialValue('partySize', 2)).toBe(true);
        expect(validateDialValue('partySize', 3)).toBe(true);
        expect(validateDialValue('partySize', 4)).toBe(true);
        expect(validateDialValue('partySize', 5)).toBe(true);
      });

      it('should reject invalid party size (6 is no longer valid)', () => {
        expect(validateDialValue('partySize', 1)).toBe(false);
        expect(validateDialValue('partySize', 6)).toBe(false);
        expect(validateDialValue('partySize', 7)).toBe(false);
        expect(validateDialValue('partySize', 3.5)).toBe(false);
        expect(validateDialValue('partySize', 'four')).toBe(false);
      });
    });

    describe('partyTier', () => {
      it('should accept valid tier', () => {
        expect(validateDialValue('partyTier', 1)).toBe(true);
        expect(validateDialValue('partyTier', 2)).toBe(true);
        expect(validateDialValue('partyTier', 3)).toBe(true);
        expect(validateDialValue('partyTier', 4)).toBe(true);
      });

      it('should reject invalid tier', () => {
        expect(validateDialValue('partyTier', 0)).toBe(false);
        expect(validateDialValue('partyTier', 5)).toBe(false);
        expect(validateDialValue('partyTier', 1.5)).toBe(false);
      });
    });

    describe('sceneCount', () => {
      it('should accept valid scene count', () => {
        expect(validateDialValue('sceneCount', 3)).toBe(true);
        expect(validateDialValue('sceneCount', 4)).toBe(true);
        expect(validateDialValue('sceneCount', 6)).toBe(true);
      });

      it('should reject invalid scene count', () => {
        expect(validateDialValue('sceneCount', 2)).toBe(false);
        expect(validateDialValue('sceneCount', 7)).toBe(false);
      });
    });

    describe('sessionLength', () => {
      it('should accept valid session length', () => {
        expect(validateDialValue('sessionLength', '2-3 hours')).toBe(true);
        expect(validateDialValue('sessionLength', '3-4 hours')).toBe(true);
        expect(validateDialValue('sessionLength', '4-5 hours')).toBe(true);
      });

      it('should reject invalid session length', () => {
        expect(validateDialValue('sessionLength', '1 hour')).toBe(false);
        expect(validateDialValue('sessionLength', '5-6 hours')).toBe(false);
        expect(validateDialValue('sessionLength', 3)).toBe(false);
      });
    });

    describe('themes', () => {
      it('should accept valid themes', () => {
        expect(validateDialValue('themes', ['redemption'])).toBe(true);
        expect(validateDialValue('themes', ['redemption', 'sacrifice'])).toBe(true);
        expect(validateDialValue('themes', ['redemption', 'sacrifice', 'identity'])).toBe(true);
        expect(validateDialValue('themes', [])).toBe(true);
      });

      it('should reject too many themes', () => {
        expect(
          validateDialValue('themes', ['redemption', 'sacrifice', 'identity', 'legacy'])
        ).toBe(false);
      });

      it('should reject invalid theme values', () => {
        expect(validateDialValue('themes', ['invalid-theme'])).toBe(false);
      });
    });

    describe('conceptual dials', () => {
      it('should accept valid discrete tone options', () => {
        expect(validateDialValue('tone', 'grim')).toBe(true);
        expect(validateDialValue('tone', 'serious')).toBe(true);
        expect(validateDialValue('tone', 'balanced')).toBe(true);
        expect(validateDialValue('tone', 'lighthearted')).toBe(true);
        expect(validateDialValue('tone', 'whimsical')).toBe(true);
        expect(validateDialValue('tone', null)).toBe(true);
      });

      it('should accept valid discrete options for conceptual dials', () => {
        expect(validateDialValue('pillarBalance', { primary: 'combat', secondary: 'exploration', tertiary: 'social' })).toBe(true);
        expect(validateDialValue('npcDensity', 'moderate')).toBe(true);
        expect(validateDialValue('lethality', 'heroic')).toBe(true);
        expect(validateDialValue('emotionalRegister', 'thrilling')).toBe(true);
      });

      it('should reject invalid values for conceptual dials', () => {
        expect(validateDialValue('tone', 123)).toBe(false);
        expect(validateDialValue('tone', 'invalid-tone')).toBe(false);
        expect(validateDialValue('pillarBalance', { value: 5 })).toBe(false);
        expect(validateDialValue('pillarBalance', 'balanced')).toBe(false); // Must be an object
      });
    });
  });

  describe('validateDialUpdate', () => {
    it('should validate valid dial update', () => {
      const update: DialUpdate = {
        dialId: 'partySize',
        value: 5,
        confidence: 'high',
      };
      expect(validateDialUpdate(update)).toEqual({ valid: true });
    });

    it('should return error for invalid dial update', () => {
      const update: DialUpdate = {
        dialId: 'partySize',
        value: 10,
        confidence: 'high',
      };
      const result = validateDialUpdate(update);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getDialValidationError', () => {
    it('should return descriptive error for party size', () => {
      const error = getDialValidationError('partySize', 10);
      expect(error).toContain('Party size');
      expect(error).toContain('2');
      expect(error).toContain('5');
    });

    it('should return descriptive error for party tier', () => {
      const error = getDialValidationError('partyTier', 5);
      expect(error).toContain('Party tier');
      expect(error).toContain('1');
      expect(error).toContain('4');
    });

    it('should return descriptive error for themes', () => {
      const error = getDialValidationError('themes', ['a', 'b', 'c', 'd']);
      expect(error).toContain('Themes');
      expect(error).toContain('3');
    });

    it('should return null for valid values', () => {
      expect(getDialValidationError('partySize', 4)).toBeNull();
      expect(getDialValidationError('tone', 'grim')).toBeNull();
    });
  });

  describe('isConceptualDial', () => {
    it('should identify conceptual dials', () => {
      expect(isConceptualDial('tone')).toBe(true);
      expect(isConceptualDial('pillarBalance')).toBe(true);
      expect(isConceptualDial('npcDensity')).toBe(true);
      expect(isConceptualDial('lethality')).toBe(true);
      expect(isConceptualDial('emotionalRegister')).toBe(true);
      expect(isConceptualDial('themes')).toBe(true);
    });

    it('should not identify concrete dials as conceptual', () => {
      expect(isConceptualDial('partySize')).toBe(false);
      expect(isConceptualDial('partyTier')).toBe(false);
      expect(isConceptualDial('sceneCount')).toBe(false);
      expect(isConceptualDial('sessionLength')).toBe(false);
    });
  });

  describe('isConcreteDial', () => {
    it('should identify concrete dials', () => {
      expect(isConcreteDial('partySize')).toBe(true);
      expect(isConcreteDial('partyTier')).toBe(true);
      expect(isConcreteDial('sceneCount')).toBe(true);
      expect(isConcreteDial('sessionLength')).toBe(true);
    });

    it('should not identify conceptual dials as concrete', () => {
      expect(isConcreteDial('tone')).toBe(false);
      expect(isConcreteDial('themes')).toBe(false);
    });
  });
});
