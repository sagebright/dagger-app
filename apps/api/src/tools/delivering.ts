/**
 * Delivering stage tool handlers
 *
 * Implements the tool handlers for the Delivering stage:
 * - finalize_adventure: Marks the adventure as complete
 *
 * These handlers are registered with the tool dispatcher and called
 * when Claude invokes the corresponding tools during conversation.
 */

import { registerToolHandler } from '../services/tool-dispatcher.js';
import type { SageEvent } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

interface FinalizeAdventureInput {
  title: string;
  summary: string;
}

// =============================================================================
// Pending Events Queue
// =============================================================================

let pendingEvents: SageEvent[] = [];

/**
 * Get and clear all pending events from delivering tool handlers.
 */
export function drainPendingEvents(): SageEvent[] {
  const events = [...pendingEvents];
  pendingEvents = [];
  return events;
}

// =============================================================================
// Tool Handlers
// =============================================================================

/**
 * Register all Delivering stage tool handlers.
 *
 * Called once at server startup to wire up the handlers.
 */
export function registerDeliveringTools(): void {
  registerToolHandler('finalize_adventure', handleFinalizeAdventure);
}

/**
 * Handle the finalize_adventure tool call.
 *
 * Marks the adventure as complete and queues a ui:ready event
 * so the frontend enables the download button.
 */
async function handleFinalizeAdventure(
  input: Record<string, unknown>
): Promise<{ result: unknown; isError: boolean }> {
  const finalizeInput = input as unknown as FinalizeAdventureInput;

  if (!finalizeInput.title) {
    return {
      result: 'title is required for finalize_adventure',
      isError: true,
    };
  }

  // Queue the ui:ready event for the frontend
  pendingEvents.push({
    type: 'ui:ready',
    data: {
      stage: 'delivering',
      summary: finalizeInput.summary ?? 'Adventure finalized',
    },
  });

  return {
    result: {
      status: 'adventure_finalized',
      title: finalizeInput.title,
      summary: finalizeInput.summary ?? '',
    },
    isError: false,
  };
}
