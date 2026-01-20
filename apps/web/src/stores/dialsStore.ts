/**
 * Dials Store - All 14 dial values with validation
 *
 * Manages the adventure dial state including:
 * - 4 concrete dials (partySize, partyTier, sceneCount, sessionLength)
 * - 6 conceptual dials (tone, combatExplorationBalance, npcDensity, lethality, emotionalRegister, themes)
 * - Dial confirmation tracking
 * - Validation logic
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  DialId,
  DialValue,
  ThemeOption,
  ConcreteDials,
  ConceptualDials,
} from '@dagger-app/shared-types';
import {
  DEFAULT_CONCRETE_DIALS,
  DEFAULT_CONCEPTUAL_DIALS,
  isValidPartySize,
  isValidPartyTier,
  isValidSceneCount,
  isValidSessionLength,
  isValidThemes,
  DIAL_CONSTRAINTS,
} from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface DialsState extends ConcreteDials, ConceptualDials {
  /** Set of dial IDs that have been confirmed by the user */
  confirmedDials: Set<DialId>;

  // Actions
  setDial: <K extends DialId>(dialId: K, value: DialsState[K]) => boolean;
  confirmDial: (dialId: DialId) => void;
  unconfirmDial: (dialId: DialId) => void;
  resetDials: () => void;
  resetDial: (dialId: DialId) => void;

  // Theme-specific actions
  addTheme: (theme: ThemeOption) => boolean;
  removeTheme: (theme: ThemeOption) => void;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate a dial value based on its ID
 */
function validateDialValue(dialId: DialId, value: DialValue): boolean {
  switch (dialId) {
    case 'partySize':
      return typeof value === 'number' && isValidPartySize(value);
    case 'partyTier':
      return typeof value === 'number' && isValidPartyTier(value);
    case 'sceneCount':
      return typeof value === 'number' && isValidSceneCount(value);
    case 'sessionLength':
      return typeof value === 'string' && isValidSessionLength(value);
    case 'themes':
      return Array.isArray(value) && isValidThemes(value as ThemeOption[]);
    // Conceptual dials accept null or any string
    case 'tone':
    case 'combatExplorationBalance':
    case 'npcDensity':
    case 'lethality':
    case 'emotionalRegister':
      return value === null || typeof value === 'string';
    default:
      return false;
  }
}

// =============================================================================
// Initial State
// =============================================================================

const initialDialValues = {
  ...DEFAULT_CONCRETE_DIALS,
  ...DEFAULT_CONCEPTUAL_DIALS,
  confirmedDials: new Set<DialId>(),
};

// =============================================================================
// Store
// =============================================================================

export const useDialsStore = create<DialsState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialDialValues,

        /**
         * Set a dial value with validation
         * Returns true if the value was valid and set, false otherwise
         */
        setDial: <K extends DialId>(dialId: K, value: DialsState[K]): boolean => {
          if (!validateDialValue(dialId, value as DialValue)) {
            console.warn(`Invalid value for dial ${dialId}:`, value);
            return false;
          }

          set({ [dialId]: value } as Partial<DialsState>, false, `setDial:${dialId}`);
          return true;
        },

        /**
         * Mark a dial as confirmed by the user
         */
        confirmDial: (dialId: DialId) => {
          const { confirmedDials } = get();
          const newConfirmed = new Set(confirmedDials);
          newConfirmed.add(dialId);
          set({ confirmedDials: newConfirmed }, false, `confirmDial:${dialId}`);
        },

        /**
         * Unmark a dial as confirmed
         */
        unconfirmDial: (dialId: DialId) => {
          const { confirmedDials } = get();
          const newConfirmed = new Set(confirmedDials);
          newConfirmed.delete(dialId);
          set({ confirmedDials: newConfirmed }, false, `unconfirmDial:${dialId}`);
        },

        /**
         * Reset all dials to defaults
         */
        resetDials: () => {
          set(
            {
              ...DEFAULT_CONCRETE_DIALS,
              ...DEFAULT_CONCEPTUAL_DIALS,
              confirmedDials: new Set<DialId>(),
            },
            false,
            'resetDials'
          );
        },

        /**
         * Reset a specific dial to its default
         */
        resetDial: (dialId: DialId) => {
          const defaultValue =
            dialId in DEFAULT_CONCRETE_DIALS
              ? DEFAULT_CONCRETE_DIALS[dialId as keyof ConcreteDials]
              : DEFAULT_CONCEPTUAL_DIALS[dialId as keyof ConceptualDials];

          const { confirmedDials } = get();
          const newConfirmed = new Set(confirmedDials);
          newConfirmed.delete(dialId);

          set(
            {
              [dialId]: defaultValue,
              confirmedDials: newConfirmed,
            } as Partial<DialsState>,
            false,
            `resetDial:${dialId}`
          );
        },

        /**
         * Add a theme (max 3)
         * Returns true if theme was added, false if max reached or already exists
         */
        addTheme: (theme: ThemeOption): boolean => {
          const { themes } = get();
          if (themes.includes(theme)) return false;
          if (themes.length >= DIAL_CONSTRAINTS.themes.maxSelections) return false;

          set({ themes: [...themes, theme] }, false, 'addTheme');
          return true;
        },

        /**
         * Remove a theme
         */
        removeTheme: (theme: ThemeOption) => {
          const { themes } = get();
          set({ themes: themes.filter((t) => t !== theme) }, false, 'removeTheme');
        },
      }),
      {
        name: 'dagger-dials-storage',
        // Handle Set serialization
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // Restore Set from array
            if (parsed.state?.confirmedDials) {
              parsed.state.confirmedDials = new Set(parsed.state.confirmedDials);
            }
            return parsed;
          },
          setItem: (name, value) => {
            // Convert Set to array for serialization
            const serializable = {
              ...value,
              state: {
                ...value.state,
                confirmedDials: value.state?.confirmedDials
                  ? Array.from(value.state.confirmedDials)
                  : [],
              },
            };
            localStorage.setItem(name, JSON.stringify(serializable));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    { name: 'DialsStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Get all unconfirmed dial IDs
 */
export const selectUnconfirmedDials = (state: DialsState): DialId[] => {
  const allDialIds: DialId[] = [
    'partySize',
    'partyTier',
    'sceneCount',
    'sessionLength',
    'tone',
    'combatExplorationBalance',
    'npcDensity',
    'lethality',
    'emotionalRegister',
    'themes',
  ];
  return allDialIds.filter((id) => !state.confirmedDials.has(id));
};

/**
 * Get count of confirmed dials
 */
export const selectConfirmedCount = (state: DialsState): number => state.confirmedDials.size;

/**
 * Get completion percentage (0-100)
 */
export const selectCompletionPercentage = (state: DialsState): number => {
  const total = 10; // Total number of dials
  return Math.round((state.confirmedDials.size / total) * 100);
};

/**
 * Check if all required dials (concrete) are confirmed
 */
export const selectRequiredDialsComplete = (state: DialsState): boolean => {
  const requiredDials: DialId[] = ['partySize', 'partyTier', 'sceneCount', 'sessionLength'];
  return requiredDials.every((id) => state.confirmedDials.has(id));
};

/**
 * Check if a specific dial is confirmed
 */
export const selectIsDialConfirmed = (state: DialsState, dialId: DialId): boolean =>
  state.confirmedDials.has(dialId);

/**
 * Get concrete dial values only
 */
export const selectConcreteDials = (state: DialsState): ConcreteDials => ({
  partySize: state.partySize,
  partyTier: state.partyTier,
  sceneCount: state.sceneCount,
  sessionLength: state.sessionLength,
});

/**
 * Get conceptual dial values only
 */
export const selectConceptualDials = (state: DialsState): ConceptualDials => ({
  tone: state.tone,
  combatExplorationBalance: state.combatExplorationBalance,
  npcDensity: state.npcDensity,
  lethality: state.lethality,
  emotionalRegister: state.emotionalRegister,
  themes: state.themes,
});

/**
 * Check if themes are at max capacity
 */
export const selectThemesAtMax = (state: DialsState): boolean =>
  state.themes.length >= DIAL_CONSTRAINTS.themes.maxSelections;

/**
 * Get a summary object suitable for display
 */
export const selectDialsSummary = (
  state: DialsState
): { concrete: ConcreteDials; conceptual: ConceptualDials; confirmedCount: number } => ({
  concrete: selectConcreteDials(state),
  conceptual: selectConceptualDials(state),
  confirmedCount: state.confirmedDials.size,
});
