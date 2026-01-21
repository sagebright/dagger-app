/**
 * Persistence Layer
 *
 * Coordinates state collection and restoration across all stores,
 * and manages auto-save subscriptions.
 */

import type {
  WebAdventure,
  DialId,
  PartyTier,
  SessionLength,
  ThemeOption,
  SelectedFrame,
  Outline,
  Scene,
  CompiledNPC,
  SelectedAdversary,
  SelectedItem,
  Echo,
} from '@dagger-app/shared-types';
import { useAdventureStore } from './adventureStore';
import { useDialsStore } from './dialsStore';
import { useContentStore } from './contentStore';
import {
  adventureService,
  type FullSnapshot,
  type DialsSnapshot,
} from '../services/adventureService';

// =============================================================================
// Snapshot Collection
// =============================================================================

/**
 * Collect a full snapshot of all store state
 *
 * Returns null if no session is active.
 */
export function collectSnapshot(): FullSnapshot | null {
  const adventure = useAdventureStore.getState();
  const dials = useDialsStore.getState();
  const content = useContentStore.getState();

  // No session active
  if (!adventure.sessionId) {
    return null;
  }

  // Collect dial values
  const dialsSnapshot: DialsSnapshot = {
    partySize: dials.partySize,
    partyTier: dials.partyTier,
    sceneCount: dials.sceneCount,
    sessionLength: dials.sessionLength,
    tone: dials.tone,
    pillarBalance: dials.pillarBalance,
    npcDensity: dials.npcDensity,
    lethality: dials.lethality,
    emotionalRegister: dials.emotionalRegister,
    themes: dials.themes,
  };

  return {
    // Adventure state
    sessionId: adventure.sessionId,
    adventureName: adventure.adventureName,
    currentPhase: adventure.currentPhase,
    phaseHistory: adventure.phaseHistory,

    // Dial values
    dials: dialsSnapshot,
    confirmedDials: Array.from(dials.confirmedDials),

    // Content state
    selectedFrame: content.selectedFrame,
    frameConfirmed: content.frameConfirmed,
    currentOutline: content.currentOutline,
    outlineConfirmed: content.outlineConfirmed,
    scenes: content.scenes,
    currentSceneId: content.currentSceneId,
    npcs: content.npcs,
    confirmedNPCIds: Array.from(content.confirmedNPCIds),
    selectedAdversaries: content.selectedAdversaries,
    confirmedAdversaryIds: Array.from(content.confirmedAdversaryIds),
    selectedItems: content.selectedItems,
    confirmedItemIds: Array.from(content.confirmedItemIds),
    echoes: content.echoes,
    confirmedEchoIds: Array.from(content.confirmedEchoIds),
  };
}

// =============================================================================
// Snapshot Restoration
// =============================================================================

/**
 * Restore state from a WebAdventure record
 *
 * Updates all 3 stores with the data from the database record.
 */
export function restoreFromSnapshot(webAdventure: WebAdventure): void {
  // Restore adventure store
  restoreAdventureStore(webAdventure);

  // Restore dials store
  restoreDialsStore(webAdventure);

  // Restore content store
  restoreContentStore(webAdventure);
}

/**
 * Restore adventure store state
 */
function restoreAdventureStore(adventure: WebAdventure): void {
  // Use setState directly for batch update
  useAdventureStore.setState({
    sessionId: adventure.session_id,
    adventureName: adventure.adventure_name,
    currentPhase: adventure.current_phase,
    phaseHistory: adventure.phase_history,
    createdAt: new Date(adventure.created_at),
  });
}

/**
 * Restore dials store state
 */
function restoreDialsStore(adventure: WebAdventure): void {
  const dials = adventure.dials as DialsSnapshot | null;
  if (!dials) return;

  // Build the confirmed dials set
  const confirmedDials = new Set<DialId>(adventure.confirmed_dials as DialId[]);

  useDialsStore.setState({
    partySize: dials.partySize ?? 4,
    partyTier: (dials.partyTier ?? 1) as PartyTier,
    sceneCount: dials.sceneCount ?? 4,
    sessionLength: (dials.sessionLength ?? '3-4 hours') as SessionLength,
    tone: dials.tone ?? null,
    pillarBalance: dials.pillarBalance ?? null,
    npcDensity: dials.npcDensity ?? null,
    lethality: dials.lethality ?? null,
    emotionalRegister: dials.emotionalRegister ?? null,
    themes: (dials.themes ?? []) as ThemeOption[],
    confirmedDials,
  });
}

/**
 * Restore content store state
 */
function restoreContentStore(adventure: WebAdventure): void {
  // Build Sets from arrays
  const confirmedNPCIds = new Set<string>(adventure.confirmed_npc_ids);
  const confirmedAdversaryIds = new Set<string>(adventure.confirmed_adversary_ids);
  const confirmedItemIds = new Set<string>(adventure.confirmed_item_ids);
  const confirmedEchoIds = new Set<string>(adventure.confirmed_echo_ids);

  useContentStore.setState({
    selectedFrame: adventure.selected_frame as unknown as SelectedFrame | null,
    frameConfirmed: adventure.frame_confirmed,
    currentOutline: adventure.current_outline as unknown as Outline | null,
    outlineConfirmed: adventure.outline_confirmed,
    scenes: (adventure.scenes ?? []) as unknown as Scene[],
    currentSceneId: adventure.current_scene_id,
    npcs: (adventure.npcs ?? []) as unknown as CompiledNPC[],
    confirmedNPCIds,
    selectedAdversaries: (adventure.selected_adversaries ?? []) as unknown as SelectedAdversary[],
    confirmedAdversaryIds,
    selectedItems: (adventure.selected_items ?? []) as unknown as SelectedItem[],
    confirmedItemIds,
    echoes: (adventure.echoes ?? []) as unknown as Echo[],
    confirmedEchoIds,
  });
}

// =============================================================================
// Auto-Save Subscription
// =============================================================================

/** Unsubscribe functions for store subscriptions */
let unsubscribers: Array<() => void> = [];

/**
 * Queue save function - called on any store change
 */
function queueSave(): void {
  const snapshot = collectSnapshot();
  if (snapshot) {
    adventureService.queueSave(snapshot);
  }
}

/**
 * Initialize persistence - subscribe to all store changes
 *
 * Call this once on app load to enable auto-save.
 */
export function initializePersistence(): void {
  // Clean up any existing subscriptions
  cleanup();

  // Subscribe to adventure store changes
  const unsubAdventure = useAdventureStore.subscribe(queueSave);
  unsubscribers.push(unsubAdventure);

  // Subscribe to dials store changes
  const unsubDials = useDialsStore.subscribe(queueSave);
  unsubscribers.push(unsubDials);

  // Subscribe to content store changes
  const unsubContent = useContentStore.subscribe(queueSave);
  unsubscribers.push(unsubContent);
}

/**
 * Clean up persistence subscriptions
 *
 * Call this when the app is unmounting or when you want to stop auto-save.
 */
export function cleanup(): void {
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
}
