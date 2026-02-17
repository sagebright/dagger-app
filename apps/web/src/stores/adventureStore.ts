/**
 * Adventure state store for the Sage Codex frontend
 *
 * Lightweight Zustand store that mirrors the server-side adventure state.
 * State flows one-way: server -> SSE events -> this store -> UI components.
 *
 * This store is READ-ONLY from the UI perspective. Mutations happen on the
 * server via tool calls, and state updates arrive via SSE events.
 */

import { create } from 'zustand';
import type {
  AdventureState,
  AdventureSpark,
  BoundFrame,
  SceneArc,
  InscribedScene,
  SerializableComponentsState,
  Stage,
} from '@dagger-app/shared-types';
import { createEmptyAdventureState } from '@dagger-app/shared-types';

// =============================================================================
// Store Interface
// =============================================================================

export interface AdventureStoreState {
  /** The current adventure state (mirrors server) */
  adventure: AdventureState;

  /** Whether the store has been initialized with server data */
  isInitialized: boolean;

  /** The session ID this store is tracking */
  sessionId: string | null;

  // ----- Actions (called from SSE event handlers) -----

  /** Initialize the store with a full adventure state from the server */
  initialize: (sessionId: string, state: AdventureState) => void;

  /** Reset the store to empty state */
  reset: () => void;

  /** Update the current stage */
  setStage: (stage: Stage) => void;

  /** Update the spark */
  setSpark: (spark: AdventureSpark) => void;

  /** Update components */
  setComponents: (components: SerializableComponentsState) => void;

  /** Update the selected frame */
  setFrame: (frame: BoundFrame) => void;

  /** Update scene arcs */
  setSceneArcs: (arcs: SceneArc[]) => void;

  /** Update or add an inscribed scene */
  setInscribedScene: (scene: InscribedScene) => void;

  /** Update the adventure name */
  setAdventureName: (name: string) => void;

  /** Apply a full state snapshot (e.g., after undo) */
  applySnapshot: (state: AdventureState) => void;
}

// =============================================================================
// Store
// =============================================================================

export const useAdventureStore = create<AdventureStoreState>((set) => ({
  adventure: createEmptyAdventureState(),
  isInitialized: false,
  sessionId: null,

  initialize: (sessionId, state) =>
    set({
      adventure: state,
      isInitialized: true,
      sessionId,
    }),

  reset: () =>
    set({
      adventure: createEmptyAdventureState(),
      isInitialized: false,
      sessionId: null,
    }),

  setStage: (stage) =>
    set((prev) => ({
      adventure: { ...prev.adventure, stage },
    })),

  setSpark: (spark) =>
    set((prev) => ({
      adventure: { ...prev.adventure, spark },
    })),

  setComponents: (components) =>
    set((prev) => ({
      adventure: { ...prev.adventure, components },
    })),

  setFrame: (frame) =>
    set((prev) => ({
      adventure: { ...prev.adventure, frame },
    })),

  setSceneArcs: (sceneArcs) =>
    set((prev) => ({
      adventure: { ...prev.adventure, sceneArcs },
    })),

  setInscribedScene: (scene) =>
    set((prev) => {
      const existing = prev.adventure.inscribedScenes;
      const index = existing.findIndex((s) => s.arcId === scene.arcId);

      const updated =
        index >= 0
          ? existing.map((s, i) => (i === index ? scene : s))
          : [...existing, scene];

      return {
        adventure: { ...prev.adventure, inscribedScenes: updated },
      };
    }),

  setAdventureName: (adventureName) =>
    set((prev) => ({
      adventure: { ...prev.adventure, adventureName },
    })),

  applySnapshot: (state) =>
    set({ adventure: state }),
}));
