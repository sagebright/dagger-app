import { describe, it, expect } from 'vitest';
import {
  isValidPartySize,
  isValidPartyTier,
  isValidSceneCount,
  isValidSessionLength,
  isValidThemes,
  DIAL_CONSTRAINTS,
  type ThemeOption,
} from './dials.js';

describe('isValidPartySize', () => {
  it('returns true for valid party sizes (2-6)', () => {
    expect(isValidPartySize(2)).toBe(true);
    expect(isValidPartySize(3)).toBe(true);
    expect(isValidPartySize(4)).toBe(true);
    expect(isValidPartySize(5)).toBe(true);
    expect(isValidPartySize(6)).toBe(true);
  });

  it('returns false for party size below minimum', () => {
    expect(isValidPartySize(1)).toBe(false);
    expect(isValidPartySize(0)).toBe(false);
    expect(isValidPartySize(-1)).toBe(false);
  });

  it('returns false for party size above maximum', () => {
    expect(isValidPartySize(7)).toBe(false);
    expect(isValidPartySize(100)).toBe(false);
  });

  it('returns false for non-integer values', () => {
    expect(isValidPartySize(3.5)).toBe(false);
    expect(isValidPartySize(4.1)).toBe(false);
    expect(isValidPartySize(2.9)).toBe(false);
  });

  it('returns false for NaN and Infinity', () => {
    expect(isValidPartySize(NaN)).toBe(false);
    expect(isValidPartySize(Infinity)).toBe(false);
    expect(isValidPartySize(-Infinity)).toBe(false);
  });
});

describe('isValidPartyTier', () => {
  it('returns true for valid party tiers (1-4)', () => {
    expect(isValidPartyTier(1)).toBe(true);
    expect(isValidPartyTier(2)).toBe(true);
    expect(isValidPartyTier(3)).toBe(true);
    expect(isValidPartyTier(4)).toBe(true);
  });

  it('returns false for invalid tier values', () => {
    expect(isValidPartyTier(0)).toBe(false);
    expect(isValidPartyTier(5)).toBe(false);
    expect(isValidPartyTier(-1)).toBe(false);
    expect(isValidPartyTier(100)).toBe(false);
  });

  it('returns false for non-integer values', () => {
    expect(isValidPartyTier(1.5)).toBe(false);
    expect(isValidPartyTier(2.5)).toBe(false);
  });
});

describe('isValidSceneCount', () => {
  it('returns true for valid scene counts (3-6)', () => {
    expect(isValidSceneCount(3)).toBe(true);
    expect(isValidSceneCount(4)).toBe(true);
    expect(isValidSceneCount(5)).toBe(true);
    expect(isValidSceneCount(6)).toBe(true);
  });

  it('returns false for scene count below minimum', () => {
    expect(isValidSceneCount(2)).toBe(false);
    expect(isValidSceneCount(1)).toBe(false);
    expect(isValidSceneCount(0)).toBe(false);
    expect(isValidSceneCount(-1)).toBe(false);
  });

  it('returns false for scene count above maximum', () => {
    expect(isValidSceneCount(7)).toBe(false);
    expect(isValidSceneCount(10)).toBe(false);
  });

  it('returns false for non-integer values', () => {
    expect(isValidSceneCount(3.5)).toBe(false);
    expect(isValidSceneCount(4.9)).toBe(false);
  });

  it('returns false for NaN and Infinity', () => {
    expect(isValidSceneCount(NaN)).toBe(false);
    expect(isValidSceneCount(Infinity)).toBe(false);
  });
});

describe('isValidSessionLength', () => {
  it('returns true for valid session lengths', () => {
    expect(isValidSessionLength('2-3 hours')).toBe(true);
    expect(isValidSessionLength('3-4 hours')).toBe(true);
    expect(isValidSessionLength('4-5 hours')).toBe(true);
  });

  it('returns false for invalid session lengths', () => {
    expect(isValidSessionLength('1-2 hours')).toBe(false);
    expect(isValidSessionLength('5-6 hours')).toBe(false);
    expect(isValidSessionLength('2 hours')).toBe(false);
    expect(isValidSessionLength('')).toBe(false);
    expect(isValidSessionLength('invalid')).toBe(false);
  });

  it('returns false for case-sensitive mismatches', () => {
    expect(isValidSessionLength('2-3 Hours')).toBe(false);
    expect(isValidSessionLength('2-3 HOURS')).toBe(false);
  });
});

describe('isValidThemes', () => {
  const validThemes: ThemeOption[] = [
    'redemption',
    'sacrifice',
    'identity',
    'power-corruption',
    'nature-civilization',
    'trust-betrayal',
    'found-family',
    'legacy',
    'survival',
    'justice-mercy',
  ];

  it('returns true for empty themes array', () => {
    expect(isValidThemes([])).toBe(true);
  });

  it('returns true for single valid theme', () => {
    expect(isValidThemes(['redemption'])).toBe(true);
    expect(isValidThemes(['sacrifice'])).toBe(true);
    expect(isValidThemes(['identity'])).toBe(true);
  });

  it('returns true for up to 3 valid themes', () => {
    expect(isValidThemes(['redemption', 'sacrifice'])).toBe(true);
    expect(isValidThemes(['redemption', 'sacrifice', 'identity'])).toBe(true);
  });

  it('returns false for more than 3 themes', () => {
    expect(isValidThemes(['redemption', 'sacrifice', 'identity', 'legacy'])).toBe(false);
    expect(isValidThemes(validThemes.slice(0, 5) as ThemeOption[])).toBe(false);
  });

  it('returns false for invalid theme values', () => {
    expect(isValidThemes(['invalid-theme' as ThemeOption])).toBe(false);
    expect(isValidThemes(['redemption', 'not-a-theme' as ThemeOption])).toBe(false);
  });

  it('validates all valid theme options individually', () => {
    for (const theme of validThemes) {
      expect(isValidThemes([theme])).toBe(true);
    }
  });
});

describe('DIAL_CONSTRAINTS', () => {
  it('has correct party size constraints', () => {
    expect(DIAL_CONSTRAINTS.partySize.min).toBe(2);
    expect(DIAL_CONSTRAINTS.partySize.max).toBe(6);
  });

  it('has correct party tier options', () => {
    expect(DIAL_CONSTRAINTS.partyTier.options).toEqual([1, 2, 3, 4]);
  });

  it('has correct scene count constraints', () => {
    expect(DIAL_CONSTRAINTS.sceneCount.min).toBe(3);
    expect(DIAL_CONSTRAINTS.sceneCount.max).toBe(6);
  });

  it('has correct session length options', () => {
    expect(DIAL_CONSTRAINTS.sessionLength.options).toEqual(['2-3 hours', '3-4 hours', '4-5 hours']);
  });

  it('has correct themes max selections', () => {
    expect(DIAL_CONSTRAINTS.themes.maxSelections).toBe(3);
  });
});
