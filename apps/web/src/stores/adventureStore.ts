/**
 * Adventure Store - Session and phase management
 *
 * Manages the overall adventure session state including:
 * - Session identification
 * - Current phase tracking
 * - Phase history for navigation
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Phase } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface AdventureState {
  // Session data
  sessionId: string | null;
  adventureName: string;
  createdAt: Date | null;

  // Phase management
  currentPhase: Phase;
  phaseHistory: Phase[];

  // Actions
  initSession: (name: string) => void;
  setPhase: (phase: Phase) => void;
  goToPreviousPhase: () => void;
  reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState = {
  sessionId: null,
  adventureName: '',
  createdAt: null,
  currentPhase: 'setup' as Phase,
  phaseHistory: [] as Phase[],
};

// =============================================================================
// Store
// =============================================================================

export const useAdventureStore = create<AdventureState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        /**
         * Initialize a new adventure session
         */
        initSession: (name: string) => {
          const sessionId = crypto.randomUUID();
          set(
            {
              sessionId,
              adventureName: name,
              createdAt: new Date(),
              currentPhase: 'dial-tuning',
              phaseHistory: ['setup'],
            },
            false,
            'initSession'
          );
        },

        /**
         * Move to a new phase, adding current phase to history
         */
        setPhase: (phase: Phase) => {
          const { currentPhase, phaseHistory } = get();
          if (phase === currentPhase) return;

          set(
            {
              currentPhase: phase,
              phaseHistory: [...phaseHistory, currentPhase],
            },
            false,
            'setPhase'
          );
        },

        /**
         * Go back to the previous phase
         */
        goToPreviousPhase: () => {
          const { phaseHistory } = get();
          if (phaseHistory.length === 0) return;

          const newHistory = [...phaseHistory];
          const previousPhase = newHistory.pop()!;

          set(
            {
              currentPhase: previousPhase,
              phaseHistory: newHistory,
            },
            false,
            'goToPreviousPhase'
          );
        },

        /**
         * Reset the adventure state to initial values
         */
        reset: () => {
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'dagger-adventure-storage',
        // Handle Date serialization
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // Restore Date object
            if (parsed.state?.createdAt) {
              parsed.state.createdAt = new Date(parsed.state.createdAt);
            }
            return parsed;
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    { name: 'AdventureStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if a session is active
 */
export const selectHasActiveSession = (state: AdventureState): boolean =>
  state.sessionId !== null;

/**
 * Check if user can go back to previous phase
 */
export const selectCanGoBack = (state: AdventureState): boolean =>
  state.phaseHistory.length > 0;

/**
 * Get the phase order index (0-9)
 */
export const selectPhaseIndex = (state: AdventureState): number => {
  const phaseOrder: Phase[] = [
    'setup',
    'dial-tuning',
    'frame',
    'outline',
    'scenes',
    'npcs',
    'adversaries',
    'items',
    'echoes',
    'complete',
  ];
  return phaseOrder.indexOf(state.currentPhase);
};

/**
 * Check if adventure is complete
 */
export const selectIsComplete = (state: AdventureState): boolean =>
  state.currentPhase === 'complete';
