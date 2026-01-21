import { describe, it, expect } from 'vitest';
import {
  isValidPartySize,
  isValidPartyTier,
  isValidSceneCount,
  isValidSessionLength,
  isValidThemes,
  isValidTone,
  isValidNPCDensity,
  isValidLethality,
  isValidEmotionalRegister,
  isValidPillarBalance,
  DIAL_CONSTRAINTS,
  TONE_OPTIONS,
  NPC_DENSITY_OPTIONS,
  LETHALITY_OPTIONS,
  EMOTIONAL_REGISTER_OPTIONS,
  type ThemeOption,
  type ToneOption,
  type NPCDensityOption,
  type LethalityOption,
  type EmotionalRegisterOption,
  type Pillar,
  type PillarBalance,
  type PartySize,
  type SceneCount,
} from './dials.js';

describe('isValidPartySize', () => {
  it('returns true for valid party sizes (2-5)', () => {
    expect(isValidPartySize(2)).toBe(true);
    expect(isValidPartySize(3)).toBe(true);
    expect(isValidPartySize(4)).toBe(true);
    expect(isValidPartySize(5)).toBe(true);
  });

  it('returns false for party size below minimum', () => {
    expect(isValidPartySize(1)).toBe(false);
    expect(isValidPartySize(0)).toBe(false);
    expect(isValidPartySize(-1)).toBe(false);
  });

  it('returns false for party size above maximum (6 is no longer valid)', () => {
    expect(isValidPartySize(6)).toBe(false);
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
  it('has correct party size options (discrete union type)', () => {
    expect(DIAL_CONSTRAINTS.partySize.options).toEqual([2, 3, 4, 5]);
  });

  it('has correct party tier options', () => {
    expect(DIAL_CONSTRAINTS.partyTier.options).toEqual([1, 2, 3, 4]);
  });

  it('has correct scene count options (discrete union type)', () => {
    expect(DIAL_CONSTRAINTS.sceneCount.options).toEqual([3, 4, 5, 6]);
  });

  it('has correct session length options', () => {
    expect(DIAL_CONSTRAINTS.sessionLength.options).toEqual(['2-3 hours', '3-4 hours', '4-5 hours']);
  });

  it('has correct themes max selections', () => {
    expect(DIAL_CONSTRAINTS.themes.maxSelections).toBe(3);
  });
});

// =============================================================================
// New Discrete Type Tests
// =============================================================================

describe('PartySize union type', () => {
  it('validates valid party sizes (2-5)', () => {
    const validSizes: PartySize[] = [2, 3, 4, 5];
    validSizes.forEach((size) => {
      expect(isValidPartySize(size)).toBe(true);
    });
  });

  it('rejects party size 6 (no longer valid with new discrete type)', () => {
    expect(isValidPartySize(6)).toBe(false);
  });
});

describe('SceneCount union type', () => {
  it('validates valid scene counts (3-6)', () => {
    const validCounts: SceneCount[] = [3, 4, 5, 6];
    validCounts.forEach((count) => {
      expect(isValidSceneCount(count)).toBe(true);
    });
  });
});

describe('ToneOption type', () => {
  it('exports TONE_OPTIONS with correct values', () => {
    expect(TONE_OPTIONS).toEqual(['grim', 'serious', 'balanced', 'lighthearted', 'whimsical']);
  });

  it('validates valid tone options', () => {
    const validTones: ToneOption[] = ['grim', 'serious', 'balanced', 'lighthearted', 'whimsical'];
    validTones.forEach((tone) => {
      expect(isValidTone(tone)).toBe(true);
    });
  });

  it('rejects invalid tone values', () => {
    expect(isValidTone('invalid')).toBe(false);
    expect(isValidTone('')).toBe(false);
    expect(isValidTone(null as unknown as string)).toBe(false);
  });
});

describe('NPCDensityOption type', () => {
  it('exports NPC_DENSITY_OPTIONS with correct values', () => {
    expect(NPC_DENSITY_OPTIONS).toEqual(['sparse', 'moderate', 'rich']);
  });

  it('validates valid NPC density options', () => {
    const validDensities: NPCDensityOption[] = ['sparse', 'moderate', 'rich'];
    validDensities.forEach((density) => {
      expect(isValidNPCDensity(density)).toBe(true);
    });
  });

  it('rejects invalid NPC density values', () => {
    expect(isValidNPCDensity('invalid')).toBe(false);
    expect(isValidNPCDensity('')).toBe(false);
  });
});

describe('LethalityOption type', () => {
  it('exports LETHALITY_OPTIONS with correct values', () => {
    expect(LETHALITY_OPTIONS).toEqual(['heroic', 'standard', 'dangerous', 'brutal']);
  });

  it('validates valid lethality options', () => {
    const validLethalities: LethalityOption[] = ['heroic', 'standard', 'dangerous', 'brutal'];
    validLethalities.forEach((lethality) => {
      expect(isValidLethality(lethality)).toBe(true);
    });
  });

  it('rejects invalid lethality values', () => {
    expect(isValidLethality('invalid')).toBe(false);
    expect(isValidLethality('')).toBe(false);
  });
});

describe('EmotionalRegisterOption type', () => {
  it('exports EMOTIONAL_REGISTER_OPTIONS with correct values', () => {
    expect(EMOTIONAL_REGISTER_OPTIONS).toEqual([
      'thrilling',
      'tense',
      'heartfelt',
      'bittersweet',
      'epic',
    ]);
  });

  it('validates valid emotional register options', () => {
    const validRegisters: EmotionalRegisterOption[] = [
      'thrilling',
      'tense',
      'heartfelt',
      'bittersweet',
      'epic',
    ];
    validRegisters.forEach((register) => {
      expect(isValidEmotionalRegister(register)).toBe(true);
    });
  });

  it('rejects invalid emotional register values', () => {
    expect(isValidEmotionalRegister('invalid')).toBe(false);
    expect(isValidEmotionalRegister('')).toBe(false);
  });
});

describe('PillarBalance type', () => {
  it('validates valid pillar balance configurations', () => {
    const validBalances: PillarBalance[] = [
      { primary: 'combat', secondary: 'exploration', tertiary: 'social' },
      { primary: 'exploration', secondary: 'social', tertiary: 'combat' },
      { primary: 'social', secondary: 'combat', tertiary: 'exploration' },
    ];
    validBalances.forEach((balance) => {
      expect(isValidPillarBalance(balance)).toBe(true);
    });
  });

  it('rejects pillar balance with duplicate pillars', () => {
    expect(
      isValidPillarBalance({ primary: 'combat', secondary: 'combat', tertiary: 'social' })
    ).toBe(false);
  });

  it('rejects pillar balance with invalid pillar values', () => {
    expect(
      isValidPillarBalance({
        primary: 'invalid' as Pillar,
        secondary: 'combat',
        tertiary: 'social',
      })
    ).toBe(false);
  });

  it('rejects null or undefined pillar balance', () => {
    expect(isValidPillarBalance(null as unknown as PillarBalance)).toBe(false);
    expect(isValidPillarBalance(undefined as unknown as PillarBalance)).toBe(false);
  });
});
