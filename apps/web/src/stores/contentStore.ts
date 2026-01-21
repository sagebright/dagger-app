/**
 * Content Store - Frame, Outline, Scene, and NPC state management
 *
 * Manages content generation state for Phase 3+ including:
 * - Frame selection/creation
 * - Outline generation with feedback loop
 * - (Future: Scene drafts)
 * - (Future: NPC compilation)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  DaggerheartFrame,
  SelectedFrame,
  FrameDraft,
  Outline,
  SceneBrief,
  Scene,
  SceneDraft,
  SceneStatus,
  CompiledNPC,
  DaggerheartAdversary,
  SelectedAdversary,
  AdversaryFilterOptions,
  UnifiedItem,
  SelectedItem,
  ItemFilterOptions,
  ItemCategory,
  Echo,
  EchoCategory,
} from '@dagger-app/shared-types';
import { isCustomFrame, isOutlineComplete } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface ContentState {
  // Frame state
  /** All available frames from Supabase */
  availableFrames: DaggerheartFrame[];
  /** Currently selected or created frame */
  selectedFrame: SelectedFrame | null;
  /** Whether the selected frame has been confirmed */
  frameConfirmed: boolean;
  /** Loading state for frames */
  framesLoading: boolean;
  /** Error message if frame loading failed */
  framesError: string | null;

  // Outline state
  /** Current outline draft or confirmed outline */
  currentOutline: Outline | null;
  /** Loading state for outline generation */
  outlineLoading: boolean;
  /** Error message if outline generation failed */
  outlineError: string | null;
  /** Whether the outline has been confirmed */
  outlineConfirmed: boolean;

  // Scene state (Phase 3.3)
  /** All scenes from confirmed outline */
  scenes: Scene[];
  /** Currently active scene ID */
  currentSceneId: string | null;
  /** Loading state for scene generation */
  sceneLoading: boolean;
  /** Error message if scene generation failed */
  sceneError: string | null;
  /** Streaming content during generation */
  sceneStreamingContent: string | null;

  // NPC state (Phase 3.4)
  /** Compiled NPCs from scenes */
  npcs: CompiledNPC[];
  /** Set of confirmed NPC IDs */
  confirmedNPCIds: Set<string>;
  /** Loading state for NPC compilation */
  npcLoading: boolean;
  /** Error message if NPC compilation failed */
  npcError: string | null;
  /** Streaming content during NPC compilation */
  npcStreamingContent: string | null;
  /** NPC currently being refined */
  refiningNPCId: string | null;

  // Adversary state (Phase 4.1)
  /** Available adversaries from Supabase */
  availableAdversaries: DaggerheartAdversary[];
  /** Selected adversaries with quantities */
  selectedAdversaries: SelectedAdversary[];
  /** Set of confirmed adversary IDs */
  confirmedAdversaryIds: Set<string>;
  /** Loading state for adversary loading */
  adversaryLoading: boolean;
  /** Error message if adversary loading failed */
  adversaryError: string | null;
  /** Available adversary types for filtering */
  availableAdversaryTypes: string[];
  /** Current filter options */
  adversaryFilters: AdversaryFilterOptions;

  // Item state (Phase 4.2)
  /** Available items from Supabase (unified across categories) */
  availableItems: UnifiedItem[];
  /** Selected items with quantities */
  selectedItems: SelectedItem[];
  /** Set of confirmed item keys (category:id) */
  confirmedItemIds: Set<string>;
  /** Loading state for item loading */
  itemLoading: boolean;
  /** Error message if item loading failed */
  itemError: string | null;
  /** Available item categories for filtering */
  availableItemCategories: ItemCategory[];
  /** Current filter options */
  itemFilters: ItemFilterOptions;

  // Echo state (Phase 4.3)
  /** Generated echoes (GM creativity tools) */
  echoes: Echo[];
  /** Set of confirmed echo IDs */
  confirmedEchoIds: Set<string>;
  /** Loading state for echo generation */
  echoLoading: boolean;
  /** Error message if echo generation failed */
  echoError: string | null;
  /** Streaming content during echo generation */
  echoStreamingContent: string | null;
  /** Currently active category tab */
  activeEchoCategory: EchoCategory;

  // Actions - Frame
  setAvailableFrames: (frames: DaggerheartFrame[]) => void;
  selectFrame: (frame: SelectedFrame) => void;
  setCustomFrameDraft: (draft: Omit<FrameDraft, 'id' | 'isCustom'>) => void;
  confirmFrame: () => void;
  clearFrame: () => void;
  setFramesLoading: (loading: boolean) => void;
  setFramesError: (error: string | null) => void;

  // Actions - Outline
  setOutline: (outline: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>) => void;
  updateOutline: (outline: Outline) => void;
  updateSceneBrief: (sceneId: string, updates: Partial<Omit<SceneBrief, 'id' | 'sceneNumber'>>) => void;
  confirmOutline: () => void;
  clearOutline: () => void;
  setOutlineLoading: (loading: boolean) => void;
  setOutlineError: (error: string | null) => void;

  // Actions - Scene (Phase 3.3)
  initializeScenesFromOutline: () => void;
  setCurrentScene: (sceneId: string) => void;
  setSceneStatus: (sceneId: string, status: SceneStatus) => void;
  setSceneDraft: (sceneId: string, draft: SceneDraft) => void;
  confirmScene: (sceneId: string) => void;
  setSceneLoading: (loading: boolean) => void;
  setSceneError: (error: string | null) => void;
  setSceneStreamingContent: (content: string | null) => void;
  appendSceneStreamingContent: (chunk: string) => void;
  navigateToNextScene: () => void;
  navigateToPreviousScene: () => void;
  clearScenes: () => void;

  // Actions - NPC (Phase 3.4)
  setNPCs: (npcs: CompiledNPC[]) => void;
  addNPC: (npc: CompiledNPC) => void;
  updateNPC: (npcId: string, updates: Partial<CompiledNPC>) => void;
  confirmNPC: (npcId: string) => void;
  confirmAllNPCs: () => void;
  setNPCLoading: (loading: boolean) => void;
  setNPCError: (error: string | null) => void;
  setNPCStreamingContent: (content: string | null) => void;
  appendNPCStreamingContent: (chunk: string) => void;
  setRefiningNPCId: (npcId: string | null) => void;
  clearNPCs: () => void;

  // Actions - Adversary (Phase 4.1)
  setAvailableAdversaries: (adversaries: DaggerheartAdversary[], types?: string[]) => void;
  selectAdversary: (adversary: DaggerheartAdversary, quantity?: number) => void;
  deselectAdversary: (adversaryId: string) => void;
  updateAdversaryQuantity: (adversaryId: string, quantity: number) => void;
  confirmAdversary: (adversaryId: string) => void;
  confirmAllAdversaries: () => void;
  setAdversaryFilters: (filters: Partial<AdversaryFilterOptions>) => void;
  setAdversaryLoading: (loading: boolean) => void;
  setAdversaryError: (error: string | null) => void;
  clearAdversaries: () => void;

  // Actions - Item (Phase 4.2)
  setAvailableItems: (items: UnifiedItem[], categories?: ItemCategory[]) => void;
  selectItem: (item: UnifiedItem, quantity?: number) => void;
  deselectItem: (itemId: string, category: ItemCategory) => void;
  updateItemQuantity: (itemId: string, category: ItemCategory, quantity: number) => void;
  confirmItem: (itemId: string, category: ItemCategory) => void;
  confirmAllItems: () => void;
  setItemFilters: (filters: Partial<ItemFilterOptions>) => void;
  setItemLoading: (loading: boolean) => void;
  setItemError: (error: string | null) => void;
  clearItems: () => void;

  // Actions - Echo (Phase 4.3)
  setEchoes: (echoes: Echo[]) => void;
  addEcho: (echo: Echo) => void;
  updateEcho: (echoId: string, updates: Partial<Echo>) => void;
  confirmEcho: (echoId: string) => void;
  confirmAllEchoes: () => void;
  setActiveEchoCategory: (category: EchoCategory) => void;
  setEchoLoading: (loading: boolean) => void;
  setEchoError: (error: string | null) => void;
  setEchoStreamingContent: (content: string | null) => void;
  appendEchoStreamingContent: (chunk: string) => void;
  clearEchoes: () => void;

  // Reset
  resetContent: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialContentState = {
  availableFrames: [] as DaggerheartFrame[],
  selectedFrame: null as SelectedFrame | null,
  frameConfirmed: false,
  framesLoading: false,
  framesError: null as string | null,
  currentOutline: null as Outline | null,
  outlineLoading: false,
  outlineError: null as string | null,
  outlineConfirmed: false,
  // Scene state
  scenes: [] as Scene[],
  currentSceneId: null as string | null,
  sceneLoading: false,
  sceneError: null as string | null,
  sceneStreamingContent: null as string | null,
  // NPC state
  npcs: [] as CompiledNPC[],
  confirmedNPCIds: new Set<string>(),
  npcLoading: false,
  npcError: null as string | null,
  npcStreamingContent: null as string | null,
  refiningNPCId: null as string | null,
  // Adversary state
  availableAdversaries: [] as DaggerheartAdversary[],
  selectedAdversaries: [] as SelectedAdversary[],
  confirmedAdversaryIds: new Set<string>(),
  adversaryLoading: false,
  adversaryError: null as string | null,
  availableAdversaryTypes: [] as string[],
  adversaryFilters: {} as AdversaryFilterOptions,
  // Item state
  availableItems: [] as UnifiedItem[],
  selectedItems: [] as SelectedItem[],
  confirmedItemIds: new Set<string>(),
  itemLoading: false,
  itemError: null as string | null,
  availableItemCategories: [] as ItemCategory[],
  itemFilters: {} as ItemFilterOptions,
  // Echo state
  echoes: [] as Echo[],
  confirmedEchoIds: new Set<string>(),
  echoLoading: false,
  echoError: null as string | null,
  echoStreamingContent: null as string | null,
  activeEchoCategory: 'complications' as EchoCategory,
};

// =============================================================================
// Store
// =============================================================================

export const useContentStore = create<ContentState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialContentState,

        /**
         * Set available frames from Supabase
         */
        setAvailableFrames: (frames: DaggerheartFrame[]) => {
          set({ availableFrames: frames, framesError: null }, false, 'setAvailableFrames');
        },

        /**
         * Select a frame (existing or custom)
         */
        selectFrame: (frame: SelectedFrame) => {
          set({ selectedFrame: frame, frameConfirmed: false }, false, 'selectFrame');
        },

        /**
         * Create a custom frame from a draft
         */
        setCustomFrameDraft: (draft: Omit<FrameDraft, 'id' | 'isCustom'>) => {
          const customFrame: FrameDraft = {
            ...draft,
            id: `custom-${Date.now()}`,
            isCustom: true,
          };
          set({ selectedFrame: customFrame, frameConfirmed: false }, false, 'setCustomFrameDraft');
        },

        /**
         * Confirm the selected frame
         */
        confirmFrame: () => {
          const { selectedFrame } = get();
          if (selectedFrame) {
            set({ frameConfirmed: true }, false, 'confirmFrame');
          }
        },

        /**
         * Clear the selected frame
         */
        clearFrame: () => {
          set({ selectedFrame: null, frameConfirmed: false }, false, 'clearFrame');
        },

        /**
         * Set frames loading state
         */
        setFramesLoading: (loading: boolean) => {
          set({ framesLoading: loading }, false, 'setFramesLoading');
        },

        /**
         * Set frames error state
         */
        setFramesError: (error: string | null) => {
          set({ framesError: error, framesLoading: false }, false, 'setFramesError');
        },

        // =====================================================================
        // Outline Actions
        // =====================================================================

        /**
         * Set a new outline from generated draft
         */
        setOutline: (outline: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>) => {
          const now = new Date().toISOString();
          const fullOutline: Outline = {
            ...outline,
            id: `outline-${Date.now()}`,
            isConfirmed: false,
            createdAt: now,
            updatedAt: now,
            scenes: outline.scenes.map((scene, index) => ({
              ...scene,
              id: scene.id || `scene-${Date.now()}-${index}`,
            })),
          };
          set(
            { currentOutline: fullOutline, outlineConfirmed: false, outlineError: null },
            false,
            'setOutline'
          );
        },

        /**
         * Update an existing outline
         */
        updateOutline: (outline: Outline) => {
          const updatedOutline: Outline = {
            ...outline,
            updatedAt: new Date().toISOString(),
          };
          set({ currentOutline: updatedOutline }, false, 'updateOutline');
        },

        /**
         * Update a specific scene brief
         */
        updateSceneBrief: (
          sceneId: string,
          updates: Partial<Omit<SceneBrief, 'id' | 'sceneNumber'>>
        ) => {
          const { currentOutline } = get();
          if (!currentOutline) return;

          const updatedScenes = currentOutline.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, ...updates } : scene
          );

          const updatedOutline: Outline = {
            ...currentOutline,
            scenes: updatedScenes,
            updatedAt: new Date().toISOString(),
          };

          set({ currentOutline: updatedOutline }, false, 'updateSceneBrief');
        },

        /**
         * Confirm the current outline
         */
        confirmOutline: () => {
          const { currentOutline } = get();
          if (currentOutline) {
            const confirmedOutline: Outline = {
              ...currentOutline,
              isConfirmed: true,
              updatedAt: new Date().toISOString(),
            };
            set(
              { currentOutline: confirmedOutline, outlineConfirmed: true },
              false,
              'confirmOutline'
            );
          }
        },

        /**
         * Clear the current outline
         */
        clearOutline: () => {
          set(
            { currentOutline: null, outlineConfirmed: false, outlineError: null },
            false,
            'clearOutline'
          );
        },

        /**
         * Set outline loading state
         */
        setOutlineLoading: (loading: boolean) => {
          set({ outlineLoading: loading }, false, 'setOutlineLoading');
        },

        /**
         * Set outline error state
         */
        setOutlineError: (error: string | null) => {
          set({ outlineError: error, outlineLoading: false }, false, 'setOutlineError');
        },

        // =====================================================================
        // Scene Actions (Phase 3.3)
        // =====================================================================

        /**
         * Initialize scenes from confirmed outline
         */
        initializeScenesFromOutline: () => {
          const { currentOutline } = get();
          if (!currentOutline) return;

          const scenes: Scene[] = currentOutline.scenes.map((brief) => ({
            brief,
            draft: null,
            status: 'pending' as SceneStatus,
          }));

          const firstSceneId = scenes[0]?.brief.id ?? null;

          set(
            {
              scenes,
              currentSceneId: firstSceneId,
              sceneError: null,
              sceneStreamingContent: null,
            },
            false,
            'initializeScenesFromOutline'
          );
        },

        /**
         * Set current active scene
         */
        setCurrentScene: (sceneId: string) => {
          set({ currentSceneId: sceneId, sceneError: null }, false, 'setCurrentScene');
        },

        /**
         * Set scene status
         */
        setSceneStatus: (sceneId: string, status: SceneStatus) => {
          const { scenes } = get();
          const updatedScenes = scenes.map((scene) =>
            scene.brief.id === sceneId ? { ...scene, status } : scene
          );
          set({ scenes: updatedScenes }, false, 'setSceneStatus');
        },

        /**
         * Set scene draft
         */
        setSceneDraft: (sceneId: string, draft: SceneDraft) => {
          const { scenes } = get();
          const updatedScenes = scenes.map((scene) =>
            scene.brief.id === sceneId
              ? { ...scene, draft, status: 'draft' as SceneStatus }
              : scene
          );
          set(
            { scenes: updatedScenes, sceneLoading: false, sceneStreamingContent: null },
            false,
            'setSceneDraft'
          );
        },

        /**
         * Confirm a scene
         */
        confirmScene: (sceneId: string) => {
          const { scenes } = get();
          const updatedScenes = scenes.map((scene) =>
            scene.brief.id === sceneId
              ? { ...scene, status: 'confirmed' as SceneStatus, confirmedAt: new Date().toISOString() }
              : scene
          );
          set({ scenes: updatedScenes }, false, 'confirmScene');
        },

        /**
         * Set scene loading state
         */
        setSceneLoading: (loading: boolean) => {
          set({ sceneLoading: loading }, false, 'setSceneLoading');
        },

        /**
         * Set scene error state
         */
        setSceneError: (error: string | null) => {
          set({ sceneError: error, sceneLoading: false }, false, 'setSceneError');
        },

        /**
         * Set scene streaming content
         */
        setSceneStreamingContent: (content: string | null) => {
          set({ sceneStreamingContent: content }, false, 'setSceneStreamingContent');
        },

        /**
         * Append to scene streaming content
         */
        appendSceneStreamingContent: (chunk: string) => {
          const { sceneStreamingContent } = get();
          set(
            { sceneStreamingContent: (sceneStreamingContent || '') + chunk },
            false,
            'appendSceneStreamingContent'
          );
        },

        /**
         * Navigate to next scene
         */
        navigateToNextScene: () => {
          const { scenes, currentSceneId } = get();
          const currentIndex = scenes.findIndex((s) => s.brief.id === currentSceneId);
          if (currentIndex < scenes.length - 1) {
            const nextScene = scenes[currentIndex + 1];
            set(
              { currentSceneId: nextScene.brief.id, sceneError: null, sceneStreamingContent: null },
              false,
              'navigateToNextScene'
            );
          }
        },

        /**
         * Navigate to previous scene
         */
        navigateToPreviousScene: () => {
          const { scenes, currentSceneId } = get();
          const currentIndex = scenes.findIndex((s) => s.brief.id === currentSceneId);
          if (currentIndex > 0) {
            const prevScene = scenes[currentIndex - 1];
            set(
              { currentSceneId: prevScene.brief.id, sceneError: null, sceneStreamingContent: null },
              false,
              'navigateToPreviousScene'
            );
          }
        },

        /**
         * Clear all scenes
         */
        clearScenes: () => {
          set(
            {
              scenes: [],
              currentSceneId: null,
              sceneLoading: false,
              sceneError: null,
              sceneStreamingContent: null,
            },
            false,
            'clearScenes'
          );
        },

        // =====================================================================
        // NPC Actions (Phase 3.4)
        // =====================================================================

        /**
         * Set all compiled NPCs
         */
        setNPCs: (npcs: CompiledNPC[]) => {
          set({ npcs, npcError: null }, false, 'setNPCs');
        },

        /**
         * Add a single NPC
         */
        addNPC: (npc: CompiledNPC) => {
          const { npcs } = get();
          set({ npcs: [...npcs, npc] }, false, 'addNPC');
        },

        /**
         * Update an existing NPC
         */
        updateNPC: (npcId: string, updates: Partial<CompiledNPC>) => {
          const { npcs } = get();
          const updatedNPCs = npcs.map((npc) =>
            npc.id === npcId
              ? { ...npc, ...updates, updatedAt: new Date().toISOString() }
              : npc
          );
          set({ npcs: updatedNPCs }, false, 'updateNPC');
        },

        /**
         * Confirm an NPC
         */
        confirmNPC: (npcId: string) => {
          const { npcs, confirmedNPCIds } = get();
          const updatedNPCs = npcs.map((npc) =>
            npc.id === npcId
              ? { ...npc, isConfirmed: true, updatedAt: new Date().toISOString() }
              : npc
          );
          const newConfirmedIds = new Set(confirmedNPCIds);
          newConfirmedIds.add(npcId);
          set({ npcs: updatedNPCs, confirmedNPCIds: newConfirmedIds }, false, 'confirmNPC');
        },

        /**
         * Confirm all NPCs
         */
        confirmAllNPCs: () => {
          const { npcs } = get();
          const now = new Date().toISOString();
          const updatedNPCs = npcs.map((npc) => ({
            ...npc,
            isConfirmed: true,
            updatedAt: now,
          }));
          const allIds = new Set(npcs.map((n) => n.id));
          set({ npcs: updatedNPCs, confirmedNPCIds: allIds }, false, 'confirmAllNPCs');
        },

        /**
         * Set NPC loading state
         */
        setNPCLoading: (loading: boolean) => {
          set({ npcLoading: loading }, false, 'setNPCLoading');
        },

        /**
         * Set NPC error state
         */
        setNPCError: (error: string | null) => {
          set({ npcError: error, npcLoading: false }, false, 'setNPCError');
        },

        /**
         * Set NPC streaming content
         */
        setNPCStreamingContent: (content: string | null) => {
          set({ npcStreamingContent: content }, false, 'setNPCStreamingContent');
        },

        /**
         * Append to NPC streaming content
         */
        appendNPCStreamingContent: (chunk: string) => {
          const { npcStreamingContent } = get();
          set(
            { npcStreamingContent: (npcStreamingContent || '') + chunk },
            false,
            'appendNPCStreamingContent'
          );
        },

        /**
         * Set the NPC currently being refined
         */
        setRefiningNPCId: (npcId: string | null) => {
          set({ refiningNPCId: npcId }, false, 'setRefiningNPCId');
        },

        /**
         * Clear all NPCs
         */
        clearNPCs: () => {
          set(
            {
              npcs: [],
              confirmedNPCIds: new Set<string>(),
              npcLoading: false,
              npcError: null,
              npcStreamingContent: null,
              refiningNPCId: null,
            },
            false,
            'clearNPCs'
          );
        },

        // =====================================================================
        // Adversary Actions (Phase 4.1)
        // =====================================================================

        /**
         * Set available adversaries from Supabase
         */
        setAvailableAdversaries: (adversaries: DaggerheartAdversary[], types?: string[]) => {
          set(
            {
              availableAdversaries: adversaries,
              availableAdversaryTypes: types ?? [],
              adversaryError: null,
            },
            false,
            'setAvailableAdversaries'
          );
        },

        /**
         * Select an adversary with optional quantity
         */
        selectAdversary: (adversary: DaggerheartAdversary, quantity = 1) => {
          const { selectedAdversaries } = get();
          // Check if already selected
          const existing = selectedAdversaries.find((sa) => sa.adversary.name === adversary.name);
          if (existing) {
            // Update quantity instead
            const updated = selectedAdversaries.map((sa) =>
              sa.adversary.name === adversary.name
                ? { ...sa, quantity: sa.quantity + quantity }
                : sa
            );
            set({ selectedAdversaries: updated }, false, 'selectAdversary');
          } else {
            // Add new selection
            const newSelection: SelectedAdversary = {
              adversary,
              quantity,
            };
            set(
              { selectedAdversaries: [...selectedAdversaries, newSelection] },
              false,
              'selectAdversary'
            );
          }
        },

        /**
         * Deselect an adversary
         */
        deselectAdversary: (adversaryId: string) => {
          const { selectedAdversaries, confirmedAdversaryIds } = get();
          const filtered = selectedAdversaries.filter((sa) => sa.adversary.name !== adversaryId);
          const newConfirmedIds = new Set(confirmedAdversaryIds);
          newConfirmedIds.delete(adversaryId);
          set(
            { selectedAdversaries: filtered, confirmedAdversaryIds: newConfirmedIds },
            false,
            'deselectAdversary'
          );
        },

        /**
         * Update adversary quantity
         */
        updateAdversaryQuantity: (adversaryId: string, quantity: number) => {
          const { selectedAdversaries } = get();
          const clampedQty = Math.max(1, Math.min(10, quantity));
          const updated = selectedAdversaries.map((sa) =>
            sa.adversary.name === adversaryId ? { ...sa, quantity: clampedQty } : sa
          );
          set({ selectedAdversaries: updated }, false, 'updateAdversaryQuantity');
        },

        /**
         * Confirm an adversary
         */
        confirmAdversary: (adversaryId: string) => {
          const { confirmedAdversaryIds } = get();
          const newConfirmedIds = new Set(confirmedAdversaryIds);
          newConfirmedIds.add(adversaryId);
          set({ confirmedAdversaryIds: newConfirmedIds }, false, 'confirmAdversary');
        },

        /**
         * Confirm all adversaries
         */
        confirmAllAdversaries: () => {
          const { selectedAdversaries } = get();
          const allIds = new Set(selectedAdversaries.map((sa) => sa.adversary.name));
          set({ confirmedAdversaryIds: allIds }, false, 'confirmAllAdversaries');
        },

        /**
         * Set adversary filters
         */
        setAdversaryFilters: (filters: Partial<AdversaryFilterOptions>) => {
          const { adversaryFilters } = get();
          set(
            { adversaryFilters: { ...adversaryFilters, ...filters } },
            false,
            'setAdversaryFilters'
          );
        },

        /**
         * Set adversary loading state
         */
        setAdversaryLoading: (loading: boolean) => {
          set({ adversaryLoading: loading }, false, 'setAdversaryLoading');
        },

        /**
         * Set adversary error state
         */
        setAdversaryError: (error: string | null) => {
          set({ adversaryError: error, adversaryLoading: false }, false, 'setAdversaryError');
        },

        /**
         * Clear all adversaries
         */
        clearAdversaries: () => {
          set(
            {
              availableAdversaries: [],
              selectedAdversaries: [],
              confirmedAdversaryIds: new Set<string>(),
              adversaryLoading: false,
              adversaryError: null,
              availableAdversaryTypes: [],
              adversaryFilters: {},
            },
            false,
            'clearAdversaries'
          );
        },

        // =====================================================================
        // Item Actions (Phase 4.2)
        // =====================================================================

        /**
         * Set available items from Supabase
         */
        setAvailableItems: (items: UnifiedItem[], categories?: ItemCategory[]) => {
          set(
            {
              availableItems: items,
              availableItemCategories: categories ?? [],
              itemError: null,
            },
            false,
            'setAvailableItems'
          );
        },

        /**
         * Select an item with optional quantity
         */
        selectItem: (item: UnifiedItem, quantity = 1) => {
          const { selectedItems } = get();
          const itemKey = `${item.category}:${item.data.name}`;
          // Check if already selected
          const existing = selectedItems.find(
            (si) => `${si.item.category}:${si.item.data.name}` === itemKey
          );
          if (existing) {
            // Update quantity instead
            const updated = selectedItems.map((si) =>
              `${si.item.category}:${si.item.data.name}` === itemKey
                ? { ...si, quantity: si.quantity + quantity }
                : si
            );
            set({ selectedItems: updated }, false, 'selectItem');
          } else {
            // Add new selection
            const newSelection: SelectedItem = {
              item,
              quantity,
            };
            set(
              { selectedItems: [...selectedItems, newSelection] },
              false,
              'selectItem'
            );
          }
        },

        /**
         * Deselect an item
         */
        deselectItem: (itemId: string, category: ItemCategory) => {
          const { selectedItems, confirmedItemIds } = get();
          const itemKey = `${category}:${itemId}`;
          const filtered = selectedItems.filter(
            (si) => `${si.item.category}:${si.item.data.name}` !== itemKey
          );
          const newConfirmedIds = new Set(confirmedItemIds);
          newConfirmedIds.delete(itemKey);
          set(
            { selectedItems: filtered, confirmedItemIds: newConfirmedIds },
            false,
            'deselectItem'
          );
        },

        /**
         * Update item quantity
         */
        updateItemQuantity: (itemId: string, category: ItemCategory, quantity: number) => {
          const { selectedItems } = get();
          const itemKey = `${category}:${itemId}`;
          const clampedQty = Math.max(1, Math.min(10, quantity));
          const updated = selectedItems.map((si) =>
            `${si.item.category}:${si.item.data.name}` === itemKey
              ? { ...si, quantity: clampedQty }
              : si
          );
          set({ selectedItems: updated }, false, 'updateItemQuantity');
        },

        /**
         * Confirm an item
         */
        confirmItem: (itemId: string, category: ItemCategory) => {
          const { confirmedItemIds } = get();
          const itemKey = `${category}:${itemId}`;
          const newConfirmedIds = new Set(confirmedItemIds);
          newConfirmedIds.add(itemKey);
          set({ confirmedItemIds: newConfirmedIds }, false, 'confirmItem');
        },

        /**
         * Confirm all items
         */
        confirmAllItems: () => {
          const { selectedItems } = get();
          const allIds = new Set(
            selectedItems.map((si) => `${si.item.category}:${si.item.data.name}`)
          );
          set({ confirmedItemIds: allIds }, false, 'confirmAllItems');
        },

        /**
         * Set item filters
         */
        setItemFilters: (filters: Partial<ItemFilterOptions>) => {
          const { itemFilters } = get();
          set(
            { itemFilters: { ...itemFilters, ...filters } },
            false,
            'setItemFilters'
          );
        },

        /**
         * Set item loading state
         */
        setItemLoading: (loading: boolean) => {
          set({ itemLoading: loading }, false, 'setItemLoading');
        },

        /**
         * Set item error state
         */
        setItemError: (error: string | null) => {
          set({ itemError: error, itemLoading: false }, false, 'setItemError');
        },

        /**
         * Clear all items
         */
        clearItems: () => {
          set(
            {
              availableItems: [],
              selectedItems: [],
              confirmedItemIds: new Set<string>(),
              itemLoading: false,
              itemError: null,
              availableItemCategories: [],
              itemFilters: {},
            },
            false,
            'clearItems'
          );
        },

        // =====================================================================
        // Echo Actions (Phase 4.3)
        // =====================================================================

        /**
         * Set all echoes
         */
        setEchoes: (echoes: Echo[]) => {
          set({ echoes, echoError: null }, false, 'setEchoes');
        },

        /**
         * Add a single echo
         */
        addEcho: (echo: Echo) => {
          const { echoes } = get();
          set({ echoes: [...echoes, echo] }, false, 'addEcho');
        },

        /**
         * Update an existing echo
         */
        updateEcho: (echoId: string, updates: Partial<Echo>) => {
          const { echoes } = get();
          const updatedEchoes = echoes.map((echo) =>
            echo.id === echoId ? { ...echo, ...updates } : echo
          );
          set({ echoes: updatedEchoes }, false, 'updateEcho');
        },

        /**
         * Confirm an echo
         */
        confirmEcho: (echoId: string) => {
          const { echoes, confirmedEchoIds } = get();
          const updatedEchoes = echoes.map((echo) =>
            echo.id === echoId ? { ...echo, isConfirmed: true } : echo
          );
          const newConfirmedIds = new Set(confirmedEchoIds);
          newConfirmedIds.add(echoId);
          set({ echoes: updatedEchoes, confirmedEchoIds: newConfirmedIds }, false, 'confirmEcho');
        },

        /**
         * Confirm all echoes
         */
        confirmAllEchoes: () => {
          const { echoes } = get();
          const updatedEchoes = echoes.map((echo) => ({ ...echo, isConfirmed: true }));
          const allIds = new Set(echoes.map((e) => e.id));
          set({ echoes: updatedEchoes, confirmedEchoIds: allIds }, false, 'confirmAllEchoes');
        },

        /**
         * Set active echo category tab
         */
        setActiveEchoCategory: (category: EchoCategory) => {
          set({ activeEchoCategory: category }, false, 'setActiveEchoCategory');
        },

        /**
         * Set echo loading state
         */
        setEchoLoading: (loading: boolean) => {
          set({ echoLoading: loading }, false, 'setEchoLoading');
        },

        /**
         * Set echo error state
         */
        setEchoError: (error: string | null) => {
          set({ echoError: error, echoLoading: false }, false, 'setEchoError');
        },

        /**
         * Set echo streaming content
         */
        setEchoStreamingContent: (content: string | null) => {
          set({ echoStreamingContent: content }, false, 'setEchoStreamingContent');
        },

        /**
         * Append to echo streaming content
         */
        appendEchoStreamingContent: (chunk: string) => {
          const { echoStreamingContent } = get();
          set(
            { echoStreamingContent: (echoStreamingContent || '') + chunk },
            false,
            'appendEchoStreamingContent'
          );
        },

        /**
         * Clear all echoes
         */
        clearEchoes: () => {
          set(
            {
              echoes: [],
              confirmedEchoIds: new Set<string>(),
              echoLoading: false,
              echoError: null,
              echoStreamingContent: null,
              activeEchoCategory: 'complications',
            },
            false,
            'clearEchoes'
          );
        },

        /**
         * Reset all content state
         */
        resetContent: () => {
          set(initialContentState, false, 'resetContent');
        },
      }),
      {
        name: 'dagger-content-storage',
        // Persist frame, outline, scene, NPC, adversary, item, and echo state
        partialize: (state) => ({
          selectedFrame: state.selectedFrame,
          frameConfirmed: state.frameConfirmed,
          currentOutline: state.currentOutline,
          outlineConfirmed: state.outlineConfirmed,
          scenes: state.scenes,
          currentSceneId: state.currentSceneId,
          npcs: state.npcs,
          confirmedNPCIds: Array.from(state.confirmedNPCIds), // Convert Set to Array for serialization
          selectedAdversaries: state.selectedAdversaries,
          confirmedAdversaryIds: Array.from(state.confirmedAdversaryIds), // Convert Set to Array for serialization
          adversaryFilters: state.adversaryFilters,
          selectedItems: state.selectedItems,
          confirmedItemIds: Array.from(state.confirmedItemIds), // Convert Set to Array for serialization
          itemFilters: state.itemFilters,
          echoes: state.echoes,
          confirmedEchoIds: Array.from(state.confirmedEchoIds), // Convert Set to Array for serialization
          activeEchoCategory: state.activeEchoCategory,
        }),
        // Custom storage to handle Set serialization
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // Convert confirmedNPCIds back to Set
            if (parsed.state?.confirmedNPCIds) {
              parsed.state.confirmedNPCIds = new Set(parsed.state.confirmedNPCIds);
            }
            // Convert confirmedAdversaryIds back to Set
            if (parsed.state?.confirmedAdversaryIds) {
              parsed.state.confirmedAdversaryIds = new Set(parsed.state.confirmedAdversaryIds);
            }
            // Convert confirmedItemIds back to Set
            if (parsed.state?.confirmedItemIds) {
              parsed.state.confirmedItemIds = new Set(parsed.state.confirmedItemIds);
            }
            // Convert confirmedEchoIds back to Set
            if (parsed.state?.confirmedEchoIds) {
              parsed.state.confirmedEchoIds = new Set(parsed.state.confirmedEchoIds);
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
    { name: 'ContentStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Check if a frame is selected
 */
export const selectHasSelectedFrame = (state: ContentState): boolean =>
  state.selectedFrame !== null;

/**
 * Check if the selected frame is confirmed
 */
export const selectIsFrameConfirmed = (state: ContentState): boolean => state.frameConfirmed;

/**
 * Check if the selected frame is a custom frame
 */
export const selectIsCustomFrame = (state: ContentState): boolean =>
  state.selectedFrame !== null && isCustomFrame(state.selectedFrame);

/**
 * Get the selected frame name (or null)
 */
export const selectFrameName = (state: ContentState): string | null =>
  state.selectedFrame?.name ?? null;

/**
 * Get frame themes (handles both DB frames and custom frames)
 */
export const selectFrameThemes = (state: ContentState): string[] => {
  if (!state.selectedFrame) return [];
  return state.selectedFrame.themes ?? [];
};

/**
 * Check if user can proceed to outline phase
 */
export const selectCanProceedToOutline = (state: ContentState): boolean =>
  state.selectedFrame !== null && state.frameConfirmed;

/**
 * Get frame loading status
 */
export const selectFramesStatus = (
  state: ContentState
): { loading: boolean; error: string | null; hasFrames: boolean } => ({
  loading: state.framesLoading,
  error: state.framesError,
  hasFrames: state.availableFrames.length > 0,
});

// =============================================================================
// Outline Selectors
// =============================================================================

/**
 * Check if an outline exists
 */
export const selectHasOutline = (state: ContentState): boolean =>
  state.currentOutline !== null;

/**
 * Check if the outline is confirmed
 */
export const selectIsOutlineConfirmed = (state: ContentState): boolean =>
  state.outlineConfirmed;

/**
 * Get outline title (or null)
 */
export const selectOutlineTitle = (state: ContentState): string | null =>
  state.currentOutline?.title ?? null;

/**
 * Get scene count from outline
 */
export const selectSceneCount = (state: ContentState): number =>
  state.currentOutline?.scenes.length ?? 0;

/**
 * Get all scene briefs
 */
export const selectSceneBriefs = (state: ContentState): SceneBrief[] =>
  state.currentOutline?.scenes ?? [];

/**
 * Get a specific scene brief by ID
 */
export const selectSceneBriefById = (
  state: ContentState,
  sceneId: string
): SceneBrief | undefined =>
  state.currentOutline?.scenes.find((s) => s.id === sceneId);

/**
 * Check if outline is complete (has all expected scenes)
 */
export const selectIsOutlineComplete = (
  state: ContentState,
  expectedSceneCount: number
): boolean =>
  state.currentOutline !== null && isOutlineComplete(state.currentOutline, expectedSceneCount);

/**
 * Check if user can proceed to scene editor
 */
export const selectCanProceedToScenes = (state: ContentState): boolean =>
  state.currentOutline !== null && state.outlineConfirmed;

/**
 * Get outline loading status
 */
export const selectOutlineStatus = (
  state: ContentState
): { loading: boolean; error: string | null; hasOutline: boolean } => ({
  loading: state.outlineLoading,
  error: state.outlineError,
  hasOutline: state.currentOutline !== null,
});

/**
 * Get outline summary for display
 */
export const selectOutlineSummary = (
  state: ContentState
): { title: string; sceneCount: number; isConfirmed: boolean } | null => {
  if (!state.currentOutline) return null;
  return {
    title: state.currentOutline.title,
    sceneCount: state.currentOutline.scenes.length,
    isConfirmed: state.outlineConfirmed,
  };
};

// =============================================================================
// Scene Selectors (Phase 3.3)
// =============================================================================

/**
 * Get all scenes
 */
export const selectScenes = (state: ContentState): Scene[] => state.scenes;

/**
 * Get current scene
 */
export const selectCurrentScene = (state: ContentState): Scene | null =>
  state.scenes.find((s) => s.brief.id === state.currentSceneId) ?? null;

/**
 * Get current scene ID
 */
export const selectCurrentSceneId = (state: ContentState): string | null =>
  state.currentSceneId;

/**
 * Get scene by ID
 */
export const selectSceneById = (state: ContentState, sceneId: string): Scene | undefined =>
  state.scenes.find((s) => s.brief.id === sceneId);

/**
 * Get count of confirmed scenes
 */
export const selectConfirmedSceneCount = (state: ContentState): number =>
  state.scenes.filter((s) => s.status === 'confirmed').length;

/**
 * Check if all scenes are confirmed
 */
export const selectAllScenesConfirmed = (state: ContentState): boolean =>
  state.scenes.length > 0 && state.scenes.every((s) => s.status === 'confirmed');

/**
 * Get scene loading/error status
 */
export const selectSceneStatus = (
  state: ContentState
): { loading: boolean; error: string | null; streamingContent: string | null } => ({
  loading: state.sceneLoading,
  error: state.sceneError,
  streamingContent: state.sceneStreamingContent,
});

/**
 * Check if user can proceed to NPC phase
 */
export const selectCanProceedToNPCs = (state: ContentState): boolean =>
  state.scenes.length > 0 && state.scenes.every((s) => s.status === 'confirmed');

/**
 * Get navigation state for current scene
 */
export const selectSceneNavigation = (
  state: ContentState
): { canGoPrevious: boolean; canGoNext: boolean; currentIndex: number } => {
  const currentIndex = state.scenes.findIndex((s) => s.brief.id === state.currentSceneId);
  if (currentIndex === -1) {
    return { canGoPrevious: false, canGoNext: false, currentIndex: -1 };
  }

  const canGoPrevious = currentIndex > 0;
  const canGoNext =
    currentIndex < state.scenes.length - 1 &&
    (state.scenes[currentIndex].status === 'confirmed' ||
      state.scenes[currentIndex].status === 'draft');

  return { canGoPrevious, canGoNext, currentIndex };
};

// =============================================================================
// NPC Selectors (Phase 3.4)
// =============================================================================

/**
 * Get all NPCs
 */
export const selectNPCs = (state: ContentState): CompiledNPC[] => state.npcs;

/**
 * Get confirmed NPC IDs
 */
export const selectConfirmedNPCIds = (state: ContentState): Set<string> =>
  state.confirmedNPCIds;

/**
 * Get NPC by ID
 */
export const selectNPCById = (state: ContentState, npcId: string): CompiledNPC | undefined =>
  state.npcs.find((n) => n.id === npcId);

/**
 * Get count of confirmed NPCs
 */
export const selectConfirmedNPCCount = (state: ContentState): number =>
  state.confirmedNPCIds.size;

/**
 * Check if all NPCs are confirmed
 */
export const selectAllNPCsConfirmed = (state: ContentState): boolean =>
  state.npcs.length > 0 && state.confirmedNPCIds.size === state.npcs.length;

/**
 * Get NPC loading/error status
 */
export const selectNPCStatus = (
  state: ContentState
): {
  loading: boolean;
  error: string | null;
  streamingContent: string | null;
  refiningNPCId: string | null;
} => ({
  loading: state.npcLoading,
  error: state.npcError,
  streamingContent: state.npcStreamingContent,
  refiningNPCId: state.refiningNPCId,
});

/**
 * Check if user can proceed to adversaries phase
 */
export const selectCanProceedToAdversaries = (state: ContentState): boolean =>
  state.npcs.length > 0 && state.confirmedNPCIds.size === state.npcs.length;

/**
 * Get NPC summary for display
 */
export const selectNPCSummary = (
  state: ContentState
): { total: number; confirmed: number; pending: number } => ({
  total: state.npcs.length,
  confirmed: state.confirmedNPCIds.size,
  pending: state.npcs.length - state.confirmedNPCIds.size,
});

/**
 * Get NPCs by role
 */
export const selectNPCsByRole = (
  state: ContentState,
  role: CompiledNPC['role']
): CompiledNPC[] => state.npcs.filter((n) => n.role === role);

/**
 * Get NPCs appearing in a specific scene
 */
export const selectNPCsByScene = (
  state: ContentState,
  sceneId: string
): CompiledNPC[] => state.npcs.filter((n) => n.sceneAppearances.includes(sceneId));

// =============================================================================
// Adversary Selectors (Phase 4.1)
// =============================================================================

/**
 * Get all available adversaries
 */
export const selectAvailableAdversaries = (state: ContentState): DaggerheartAdversary[] =>
  state.availableAdversaries;

/**
 * Get selected adversaries
 */
export const selectSelectedAdversaries = (state: ContentState): SelectedAdversary[] =>
  state.selectedAdversaries;

/**
 * Get confirmed adversary IDs
 */
export const selectConfirmedAdversaryIds = (state: ContentState): Set<string> =>
  state.confirmedAdversaryIds;

/**
 * Get filtered adversaries based on current filters
 */
export const selectFilteredAdversaries = (state: ContentState): DaggerheartAdversary[] => {
  const { availableAdversaries, adversaryFilters } = state;
  let filteredAdversaries = availableAdversaries;

  // Filter by tier
  if (adversaryFilters.tier !== undefined) {
    filteredAdversaries = filteredAdversaries.filter((a) => a.tier === adversaryFilters.tier);
  }

  // Filter by type
  if (adversaryFilters.type) {
    filteredAdversaries = filteredAdversaries.filter(
      (a) => a.type?.toLowerCase() === adversaryFilters.type?.toLowerCase()
    );
  }

  // Filter by search term
  if (adversaryFilters.searchTerm) {
    const term = adversaryFilters.searchTerm.toLowerCase();
    filteredAdversaries = filteredAdversaries.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.type?.toLowerCase().includes(term)
    );
  }

  return filteredAdversaries;
};

/**
 * Get count of selected adversaries
 */
export const selectSelectedAdversaryCount = (state: ContentState): number =>
  state.selectedAdversaries.reduce((sum, sa) => sum + sa.quantity, 0);

/**
 * Get count of confirmed adversaries
 */
export const selectConfirmedAdversaryCount = (state: ContentState): number =>
  state.confirmedAdversaryIds.size;

/**
 * Check if all selected adversaries are confirmed
 */
export const selectAllAdversariesConfirmed = (state: ContentState): boolean =>
  state.selectedAdversaries.length > 0 &&
  state.confirmedAdversaryIds.size === state.selectedAdversaries.length;

/**
 * Get adversary loading/error status
 */
export const selectAdversaryStatus = (
  state: ContentState
): { loading: boolean; error: string | null } => ({
  loading: state.adversaryLoading,
  error: state.adversaryError,
});

/**
 * Check if user can proceed to items phase
 */
export const selectCanProceedToItems = (state: ContentState): boolean =>
  state.selectedAdversaries.length > 0 &&
  state.confirmedAdversaryIds.size === state.selectedAdversaries.length;

/**
 * Get adversary summary for display
 */
export const selectAdversarySummary = (
  state: ContentState
): { total: number; selected: number; confirmed: number; pending: number } => ({
  total: state.availableAdversaries.length,
  selected: state.selectedAdversaries.length,
  confirmed: state.confirmedAdversaryIds.size,
  pending: state.selectedAdversaries.length - state.confirmedAdversaryIds.size,
});

/**
 * Get available adversary types for filtering
 */
export const selectAvailableAdversaryTypes = (state: ContentState): string[] =>
  state.availableAdversaryTypes;

/**
 * Get current adversary filters
 */
export const selectAdversaryFilters = (state: ContentState): AdversaryFilterOptions =>
  state.adversaryFilters;

/**
 * Check if an adversary is selected
 */
export const selectIsAdversarySelected = (
  state: ContentState,
  adversaryName: string
): boolean => state.selectedAdversaries.some((sa) => sa.adversary.name === adversaryName);

/**
 * Get selected adversary by name
 */
export const selectSelectedAdversaryByName = (
  state: ContentState,
  adversaryName: string
): SelectedAdversary | undefined =>
  state.selectedAdversaries.find((sa) => sa.adversary.name === adversaryName);

// =============================================================================
// Item Selectors (Phase 4.2)
// =============================================================================

/**
 * Get all available items
 */
export const selectAvailableItems = (state: ContentState): UnifiedItem[] =>
  state.availableItems;

/**
 * Get selected items
 */
export const selectSelectedItems = (state: ContentState): SelectedItem[] =>
  state.selectedItems;

/**
 * Get confirmed item IDs
 */
export const selectConfirmedItemIds = (state: ContentState): Set<string> =>
  state.confirmedItemIds;

/**
 * Get filtered items based on current filters
 */
export const selectFilteredItems = (state: ContentState): UnifiedItem[] => {
  const { availableItems, itemFilters } = state;
  let filteredItems = availableItems;

  // Filter by tier (only for weapons/armor)
  if (itemFilters.tier !== undefined) {
    filteredItems = filteredItems.filter((item) => {
      if (item.category === 'weapon') {
        return item.data.tier === itemFilters.tier;
      }
      if (item.category === 'armor') {
        return item.data.tier === itemFilters.tier;
      }
      // Items and consumables don't have tiers, include them all
      return true;
    });
  }

  // Filter by category
  if (itemFilters.category) {
    filteredItems = filteredItems.filter((item) => item.category === itemFilters.category);
  }

  // Filter by search term
  if (itemFilters.searchTerm) {
    const term = itemFilters.searchTerm.toLowerCase();
    filteredItems = filteredItems.filter((item) => {
      if (item.data.name.toLowerCase().includes(term)) return true;
      // Check description for items and consumables
      if ((item.category === 'item' || item.category === 'consumable') &&
          item.data.description?.toLowerCase().includes(term)) {
        return true;
      }
      // Check weapon category for weapons
      if (item.category === 'weapon' &&
          item.data.weapon_category?.toLowerCase().includes(term)) {
        return true;
      }
      return false;
    });
  }

  return filteredItems;
};

/**
 * Get count of selected items
 */
export const selectSelectedItemCount = (state: ContentState): number =>
  state.selectedItems.reduce((sum, si) => sum + si.quantity, 0);

/**
 * Get count of confirmed items
 */
export const selectConfirmedItemCount = (state: ContentState): number =>
  state.confirmedItemIds.size;

/**
 * Check if all selected items are confirmed
 */
export const selectAllItemsConfirmed = (state: ContentState): boolean =>
  state.selectedItems.length > 0 &&
  state.confirmedItemIds.size === state.selectedItems.length;

/**
 * Get item loading/error status
 */
export const selectItemStatus = (
  state: ContentState
): { loading: boolean; error: string | null } => ({
  loading: state.itemLoading,
  error: state.itemError,
});

/**
 * Check if user can proceed to echoes phase
 */
export const selectCanProceedToEchoes = (state: ContentState): boolean =>
  state.selectedItems.length > 0 &&
  state.confirmedItemIds.size === state.selectedItems.length;

/**
 * Get item summary for display
 */
export const selectItemSummary = (
  state: ContentState
): { total: number; selected: number; confirmed: number; pending: number } => ({
  total: state.availableItems.length,
  selected: state.selectedItems.length,
  confirmed: state.confirmedItemIds.size,
  pending: state.selectedItems.length - state.confirmedItemIds.size,
});

/**
 * Get available item categories for filtering
 */
export const selectAvailableItemCategories = (state: ContentState): ItemCategory[] =>
  state.availableItemCategories;

/**
 * Get current item filters
 */
export const selectItemFilters = (state: ContentState): ItemFilterOptions =>
  state.itemFilters;

/**
 * Check if an item is selected
 */
export const selectIsItemSelected = (
  state: ContentState,
  itemName: string,
  category: ItemCategory
): boolean =>
  state.selectedItems.some(
    (si) => si.item.data.name === itemName && si.item.category === category
  );

/**
 * Get selected item by name and category
 */
export const selectSelectedItemByKey = (
  state: ContentState,
  itemName: string,
  category: ItemCategory
): SelectedItem | undefined =>
  state.selectedItems.find(
    (si) => si.item.data.name === itemName && si.item.category === category
  );

// =============================================================================
// Echo Selectors (Phase 4.3)
// =============================================================================

/**
 * Get all echoes
 */
export const selectEchoes = (state: ContentState): Echo[] => state.echoes;

/**
 * Get echoes by category
 */
export const selectEchoesByCategory = (
  state: ContentState,
  category: EchoCategory
): Echo[] => state.echoes.filter((e) => e.category === category);

/**
 * Get confirmed echo IDs
 */
export const selectConfirmedEchoIds = (state: ContentState): Set<string> =>
  state.confirmedEchoIds;

/**
 * Get echo by ID
 */
export const selectEchoById = (state: ContentState, echoId: string): Echo | undefined =>
  state.echoes.find((e) => e.id === echoId);

/**
 * Get count of confirmed echoes
 */
export const selectConfirmedEchoCount = (state: ContentState): number =>
  state.confirmedEchoIds.size;

/**
 * Check if all echoes are confirmed
 */
export const selectAllEchoesConfirmed = (state: ContentState): boolean =>
  state.echoes.length > 0 && state.confirmedEchoIds.size === state.echoes.length;

/**
 * Get echo loading/error status
 */
export const selectEchoStatus = (
  state: ContentState
): {
  loading: boolean;
  error: string | null;
  streamingContent: string | null;
  activeCategory: EchoCategory;
} => ({
  loading: state.echoLoading,
  error: state.echoError,
  streamingContent: state.echoStreamingContent,
  activeCategory: state.activeEchoCategory,
});

/**
 * Get echo summary for display
 */
export const selectEchoSummary = (
  state: ContentState
): { total: number; confirmed: number; pending: number; byCategory: Record<EchoCategory, number> } => {
  const byCategory: Record<EchoCategory, number> = {
    complications: 0,
    rumors: 0,
    discoveries: 0,
    intrusions: 0,
    wonders: 0,
  };

  state.echoes.forEach((echo) => {
    byCategory[echo.category]++;
  });

  return {
    total: state.echoes.length,
    confirmed: state.confirmedEchoIds.size,
    pending: state.echoes.length - state.confirmedEchoIds.size,
    byCategory,
  };
};

/**
 * Get active echo category
 */
export const selectActiveEchoCategory = (state: ContentState): EchoCategory =>
  state.activeEchoCategory;

/**
 * Check if user can proceed to complete phase
 */
export const selectCanProceedToComplete = (state: ContentState): boolean =>
  state.echoes.length > 0 && state.confirmedEchoIds.size === state.echoes.length;
