/**
 * NPC Selectors
 *
 * Pure selector functions for deriving NPC-related state from ContentState.
 * These selectors follow the pattern: (state: ContentState) => T
 */

import type { ContentState } from '../contentStore';
import type { CompiledNPC } from '@dagger-app/shared-types';

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
