/**
 * Dials Store Tests
 *
 * Tests for dial value management:
 * - setDial with validation for each dial type
 * - Dial confirmation tracking
 * - Theme add/remove with max limit
 * - Set serialization/deserialization in persist middleware
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useDialsStore,
  selectUnconfirmedDials,
  selectConfirmedCount,
  selectCompletionPercentage,
  selectRequiredDialsComplete,
  selectIsDialConfirmed,
  selectConcreteDials,
  selectConceptualDials,
  selectThemesAtMax,
  selectDialsSummary,
} from './dialsStore';
import {
  clearPersistedStorage,
  storeAction,
  verifySetSerialization,
} from '../test/store-utils';
import {
  DEFAULT_CONCRETE_DIALS,
  DEFAULT_CONCEPTUAL_DIALS,
  DIAL_CONSTRAINTS,
} from '@dagger-app/shared-types';

// Storage key used by the store
const STORAGE_KEY = 'dagger-dials-storage';

describe('dialsStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearPersistedStorage(STORAGE_KEY);

    // Reset store to initial state
    act(() => {
      useDialsStore.getState().resetDials();
    });
  });

  describe('initial state', () => {
    it('starts with default concrete dial values', () => {
      const state = useDialsStore.getState();

      expect(state.partySize).toBe(DEFAULT_CONCRETE_DIALS.partySize);
      expect(state.partyTier).toBe(DEFAULT_CONCRETE_DIALS.partyTier);
      expect(state.sceneCount).toBe(DEFAULT_CONCRETE_DIALS.sceneCount);
      expect(state.sessionLength).toBe(DEFAULT_CONCRETE_DIALS.sessionLength);
    });

    it('starts with default conceptual dial values', () => {
      const state = useDialsStore.getState();

      expect(state.tone).toBe(DEFAULT_CONCEPTUAL_DIALS.tone);
      expect(state.pillarBalance).toBe(DEFAULT_CONCEPTUAL_DIALS.pillarBalance);
      expect(state.npcDensity).toBe(DEFAULT_CONCEPTUAL_DIALS.npcDensity);
      expect(state.lethality).toBe(DEFAULT_CONCEPTUAL_DIALS.lethality);
      expect(state.emotionalRegister).toBe(DEFAULT_CONCEPTUAL_DIALS.emotionalRegister);
      expect(state.themes).toEqual(DEFAULT_CONCEPTUAL_DIALS.themes);
    });

    it('starts with no confirmed dials', () => {
      const state = useDialsStore.getState();
      expect(state.confirmedDials.size).toBe(0);
    });
  });

  describe('setDial', () => {
    describe('partySize validation', () => {
      it('accepts valid party size (2-6)', () => {
        const result = storeAction(() => useDialsStore.getState().setDial('partySize', 3));

        expect(result).toBe(true);
        expect(useDialsStore.getState().partySize).toBe(3);
      });

      it('accepts all valid party size options (2-5)', () => {
        for (const size of DIAL_CONSTRAINTS.partySize.options) {
          const result = storeAction(() => useDialsStore.getState().setDial('partySize', size));
          expect(result).toBe(true);
          expect(useDialsStore.getState().partySize).toBe(size);
        }
      });

      it('rejects party size below minimum', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('partySize', 1 as never)
        );

        expect(result).toBe(false);
        expect(useDialsStore.getState().partySize).toBe(DEFAULT_CONCRETE_DIALS.partySize);
      });

      it('rejects party size above maximum (6 is no longer valid)', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('partySize', 6 as never)
        );

        expect(result).toBe(false);
        expect(useDialsStore.getState().partySize).toBe(DEFAULT_CONCRETE_DIALS.partySize);
      });

      it('rejects non-option party size values', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('partySize', 7 as never)
        );

        expect(result).toBe(false);
      });
    });

    describe('partyTier validation', () => {
      it('accepts valid tier values (1-4)', () => {
        for (const tier of [1, 2, 3, 4] as const) {
          storeAction(() => useDialsStore.getState().setDial('partyTier', tier));
          expect(useDialsStore.getState().partyTier).toBe(tier);
        }
      });

      it('rejects tier 0', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('partyTier', 0 as never)
        );

        expect(result).toBe(false);
      });

      it('rejects tier 5', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('partyTier', 5 as never)
        );

        expect(result).toBe(false);
      });
    });

    describe('sceneCount validation', () => {
      it('accepts all valid scene count options (3-6)', () => {
        for (const count of DIAL_CONSTRAINTS.sceneCount.options) {
          const result = storeAction(() => useDialsStore.getState().setDial('sceneCount', count));
          expect(result).toBe(true);
          expect(useDialsStore.getState().sceneCount).toBe(count);
        }
      });

      it('rejects scene count below minimum', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('sceneCount', 2 as never)
        );

        expect(result).toBe(false);
      });

      it('rejects scene count above maximum', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('sceneCount', 7 as never)
        );

        expect(result).toBe(false);
      });
    });

    describe('sessionLength validation', () => {
      it('accepts valid session lengths', () => {
        for (const length of DIAL_CONSTRAINTS.sessionLength.options) {
          const result = storeAction(() =>
            useDialsStore.getState().setDial('sessionLength', length)
          );

          expect(result).toBe(true);
          expect(useDialsStore.getState().sessionLength).toBe(length);
        }
      });

      it('rejects invalid session length', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('sessionLength', '1 hour' as never)
        );

        expect(result).toBe(false);
      });
    });

    describe('conceptual dial validation', () => {
      it('accepts null for conceptual dials', () => {
        const conceptualDials = [
          'tone',
          'pillarBalance',
          'npcDensity',
          'lethality',
          'emotionalRegister',
        ] as const;

        for (const dial of conceptualDials) {
          const result = storeAction(() => useDialsStore.getState().setDial(dial, null));
          expect(result).toBe(true);
        }
      });

      it('accepts valid discrete tone options', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('tone', 'grim')
        );

        expect(result).toBe(true);
        expect(useDialsStore.getState().tone).toBe('grim');
      });

      it('accepts valid pillarBalance object', () => {
        const validBalance = { primary: 'combat' as const, secondary: 'exploration' as const, tertiary: 'social' as const };
        const result = storeAction(() =>
          useDialsStore.getState().setDial('pillarBalance', validBalance)
        );

        expect(result).toBe(true);
        expect(useDialsStore.getState().pillarBalance).toEqual(validBalance);
      });

      it('rejects invalid tone values', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('tone', 'invalid-tone' as never)
        );

        expect(result).toBe(false);
      });
    });

    describe('themes validation', () => {
      it('accepts valid theme arrays', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('themes', ['redemption', 'sacrifice'])
        );

        expect(result).toBe(true);
        expect(useDialsStore.getState().themes).toEqual(['redemption', 'sacrifice']);
      });

      it('rejects themes array exceeding max selections', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('themes', [
            'redemption',
            'sacrifice',
            'identity',
            'legacy',
          ])
        );

        expect(result).toBe(false);
      });

      it('rejects invalid theme values', () => {
        const result = storeAction(() =>
          useDialsStore.getState().setDial('themes', ['invalid-theme' as never])
        );

        expect(result).toBe(false);
      });
    });
  });

  describe('confirmDial / unconfirmDial', () => {
    it('confirms a dial', () => {
      storeAction(() => useDialsStore.getState().confirmDial('partySize'));

      const state = useDialsStore.getState();
      expect(state.confirmedDials.has('partySize')).toBe(true);
    });

    it('unconfirms a dial', () => {
      storeAction(() => useDialsStore.getState().confirmDial('partySize'));
      storeAction(() => useDialsStore.getState().unconfirmDial('partySize'));

      const state = useDialsStore.getState();
      expect(state.confirmedDials.has('partySize')).toBe(false);
    });

    it('can confirm multiple dials', () => {
      storeAction(() => {
        useDialsStore.getState().confirmDial('partySize');
        useDialsStore.getState().confirmDial('partyTier');
        useDialsStore.getState().confirmDial('tone');
      });

      const state = useDialsStore.getState();
      expect(state.confirmedDials.size).toBe(3);
    });
  });

  describe('resetDials', () => {
    it('resets all dials to defaults', () => {
      storeAction(() => {
        useDialsStore.getState().setDial('partySize', 5);
        useDialsStore.getState().setDial('tone', 'grim');
        useDialsStore.getState().confirmDial('partySize');
      });

      storeAction(() => useDialsStore.getState().resetDials());

      const state = useDialsStore.getState();
      expect(state.partySize).toBe(DEFAULT_CONCRETE_DIALS.partySize);
      expect(state.tone).toBe(DEFAULT_CONCEPTUAL_DIALS.tone);
      expect(state.confirmedDials.size).toBe(0);
    });
  });

  describe('resetDial', () => {
    it('resets a single dial to default and unconfirms it', () => {
      storeAction(() => {
        useDialsStore.getState().setDial('partySize', 5);
        useDialsStore.getState().confirmDial('partySize');
      });

      storeAction(() => useDialsStore.getState().resetDial('partySize'));

      const state = useDialsStore.getState();
      expect(state.partySize).toBe(DEFAULT_CONCRETE_DIALS.partySize);
      expect(state.confirmedDials.has('partySize')).toBe(false);
    });
  });

  describe('addTheme / removeTheme', () => {
    it('adds a theme', () => {
      const result = storeAction(() => useDialsStore.getState().addTheme('redemption'));

      expect(result).toBe(true);
      expect(useDialsStore.getState().themes).toContain('redemption');
    });

    it('removes a theme', () => {
      storeAction(() => useDialsStore.getState().addTheme('redemption'));
      storeAction(() => useDialsStore.getState().removeTheme('redemption'));

      expect(useDialsStore.getState().themes).not.toContain('redemption');
    });

    it('prevents duplicate themes', () => {
      storeAction(() => useDialsStore.getState().addTheme('redemption'));
      const result = storeAction(() => useDialsStore.getState().addTheme('redemption'));

      expect(result).toBe(false);
      expect(useDialsStore.getState().themes.filter((t) => t === 'redemption')).toHaveLength(1);
    });

    it('enforces max theme limit', () => {
      storeAction(() => useDialsStore.getState().addTheme('redemption'));
      storeAction(() => useDialsStore.getState().addTheme('sacrifice'));
      storeAction(() => useDialsStore.getState().addTheme('identity'));

      const result = storeAction(() => useDialsStore.getState().addTheme('legacy'));

      expect(result).toBe(false);
      expect(useDialsStore.getState().themes).toHaveLength(3);
    });
  });

  describe('selectors', () => {
    describe('selectUnconfirmedDials', () => {
      it('returns all dials when none confirmed', () => {
        const state = useDialsStore.getState();
        const unconfirmed = selectUnconfirmedDials(state);

        expect(unconfirmed).toHaveLength(10);
      });

      it('excludes confirmed dials', () => {
        storeAction(() => {
          useDialsStore.getState().confirmDial('partySize');
          useDialsStore.getState().confirmDial('tone');
        });

        const state = useDialsStore.getState();
        const unconfirmed = selectUnconfirmedDials(state);

        expect(unconfirmed).not.toContain('partySize');
        expect(unconfirmed).not.toContain('tone');
        expect(unconfirmed).toHaveLength(8);
      });
    });

    describe('selectConfirmedCount', () => {
      it('returns 0 when none confirmed', () => {
        const state = useDialsStore.getState();
        expect(selectConfirmedCount(state)).toBe(0);
      });

      it('counts confirmed dials', () => {
        storeAction(() => {
          useDialsStore.getState().confirmDial('partySize');
          useDialsStore.getState().confirmDial('partyTier');
        });

        const state = useDialsStore.getState();
        expect(selectConfirmedCount(state)).toBe(2);
      });
    });

    describe('selectCompletionPercentage', () => {
      it('returns 0% when none confirmed', () => {
        const state = useDialsStore.getState();
        expect(selectCompletionPercentage(state)).toBe(0);
      });

      it('returns correct percentage', () => {
        storeAction(() => {
          useDialsStore.getState().confirmDial('partySize');
          useDialsStore.getState().confirmDial('partyTier');
        });

        const state = useDialsStore.getState();
        expect(selectCompletionPercentage(state)).toBe(20); // 2/10 = 20%
      });

      it('returns 100% when all confirmed', () => {
        const allDials = [
          'partySize',
          'partyTier',
          'sceneCount',
          'sessionLength',
          'tone',
          'pillarBalance',
          'npcDensity',
          'lethality',
          'emotionalRegister',
          'themes',
        ] as const;

        storeAction(() => {
          allDials.forEach((dial) => useDialsStore.getState().confirmDial(dial));
        });

        const state = useDialsStore.getState();
        expect(selectCompletionPercentage(state)).toBe(100);
      });
    });

    describe('selectRequiredDialsComplete', () => {
      it('returns false when no required dials confirmed', () => {
        const state = useDialsStore.getState();
        expect(selectRequiredDialsComplete(state)).toBe(false);
      });

      it('returns false when some required dials missing', () => {
        storeAction(() => {
          useDialsStore.getState().confirmDial('partySize');
          useDialsStore.getState().confirmDial('partyTier');
        });

        const state = useDialsStore.getState();
        expect(selectRequiredDialsComplete(state)).toBe(false);
      });

      it('returns true when all required dials confirmed', () => {
        storeAction(() => {
          useDialsStore.getState().confirmDial('partySize');
          useDialsStore.getState().confirmDial('partyTier');
          useDialsStore.getState().confirmDial('sceneCount');
          useDialsStore.getState().confirmDial('sessionLength');
        });

        const state = useDialsStore.getState();
        expect(selectRequiredDialsComplete(state)).toBe(true);
      });
    });

    describe('selectIsDialConfirmed', () => {
      it('returns false for unconfirmed dial', () => {
        const state = useDialsStore.getState();
        expect(selectIsDialConfirmed(state, 'partySize')).toBe(false);
      });

      it('returns true for confirmed dial', () => {
        storeAction(() => useDialsStore.getState().confirmDial('partySize'));

        const state = useDialsStore.getState();
        expect(selectIsDialConfirmed(state, 'partySize')).toBe(true);
      });
    });

    describe('selectConcreteDials', () => {
      it('returns only concrete dial values', () => {
        const state = useDialsStore.getState();
        const concrete = selectConcreteDials(state);

        expect(concrete).toEqual({
          partySize: DEFAULT_CONCRETE_DIALS.partySize,
          partyTier: DEFAULT_CONCRETE_DIALS.partyTier,
          sceneCount: DEFAULT_CONCRETE_DIALS.sceneCount,
          sessionLength: DEFAULT_CONCRETE_DIALS.sessionLength,
        });
      });
    });

    describe('selectConceptualDials', () => {
      it('returns only conceptual dial values', () => {
        const state = useDialsStore.getState();
        const conceptual = selectConceptualDials(state);

        expect(conceptual).toEqual({
          tone: null,
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
        });
      });
    });

    describe('selectThemesAtMax', () => {
      it('returns false when themes below max', () => {
        const state = useDialsStore.getState();
        expect(selectThemesAtMax(state)).toBe(false);
      });

      it('returns true when themes at max', () => {
        storeAction(() => {
          useDialsStore.getState().addTheme('redemption');
          useDialsStore.getState().addTheme('sacrifice');
          useDialsStore.getState().addTheme('identity');
        });

        const state = useDialsStore.getState();
        expect(selectThemesAtMax(state)).toBe(true);
      });
    });

    describe('selectDialsSummary', () => {
      it('returns complete summary object', () => {
        storeAction(() => {
          useDialsStore.getState().confirmDial('partySize');
        });

        const state = useDialsStore.getState();
        const summary = selectDialsSummary(state);

        expect(summary.concrete).toEqual(selectConcreteDials(state));
        expect(summary.conceptual).toEqual(selectConceptualDials(state));
        expect(summary.confirmedCount).toBe(1);
      });
    });
  });

  describe('Set persistence (confirmedDials)', () => {
    it('serializes Set as Array in localStorage', () => {
      storeAction(() => {
        useDialsStore.getState().confirmDial('partySize');
        useDialsStore.getState().confirmDial('tone');
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed.state.confirmedDials)).toBe(true);
      expect(parsed.state.confirmedDials).toContain('partySize');
      expect(parsed.state.confirmedDials).toContain('tone');
    });

    it('deserializes Array back to Set on load', () => {
      storeAction(() => {
        useDialsStore.getState().confirmDial('partySize');
        useDialsStore.getState().confirmDial('partyTier');
      });

      const state = useDialsStore.getState();
      expect(state.confirmedDials).toBeInstanceOf(Set);
      expect(state.confirmedDials.has('partySize')).toBe(true);
      expect(state.confirmedDials.has('partyTier')).toBe(true);
    });

    it('verifies Set serialization format using utility', () => {
      storeAction(() => {
        useDialsStore.getState().confirmDial('partySize');
      });

      expect(verifySetSerialization(STORAGE_KEY, 'confirmedDials')).toBe(true);
    });

    it('preserves Set behavior after roundtrip', () => {
      storeAction(() => {
        useDialsStore.getState().confirmDial('partySize');
      });

      // Simulate storage roundtrip by getting stored value
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);

      // Convert back to Set like the storage handler does
      const restoredSet = new Set(parsed.state.confirmedDials);

      expect(restoredSet.has('partySize')).toBe(true);
      expect(restoredSet.has('nonexistent')).toBe(false);
    });
  });
});
