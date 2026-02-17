/**
 * SSE event parsing and dispatching for Sage Codex streaming
 *
 * Provides two core utilities:
 * 1. parseSSEBuffer — Parses raw SSE text into typed event objects
 * 2. dispatchEvent — Routes parsed events to the appropriate callback
 *
 * Extracted from useSageStream to keep each module under 500 lines
 * and allow independent testing of parsing logic.
 */

import type {
  ChatStartEvent,
  ChatDeltaEvent,
  ChatEndEvent,
  ToolStartEvent,
  ToolEndEvent,
  PanelSparkEvent,
  PanelComponentEvent,
  PanelFramesEvent,
  PanelSceneArcsEvent,
  PanelSceneArcEvent,
  PanelNameEvent,
  PanelSectionsEvent,
  PanelSectionEvent,
  PanelWave3InvalidatedEvent,
  PanelBalanceWarningEvent,
  PanelSceneConfirmedEvent,
  PanelEntityNPCsEvent,
  PanelEntityAdversariesEvent,
  PanelEntityItemsEvent,
  PanelEntityPortentsEvent,
  UIReadyEvent,
  SageErrorEvent,
} from '@dagger-app/shared-types';
import type { SageStreamCallbacks } from './useSageStream';

// =============================================================================
// Types
// =============================================================================

export interface ParsedSSELine {
  eventType: string;
  data: unknown;
}

// =============================================================================
// SSE Line Parser
// =============================================================================

/**
 * Parse buffered SSE text into individual events.
 *
 * Each event is separated by a double newline. Within each event:
 * - "event: <type>" sets the event type
 * - "data: <json>" sets the data payload
 */
export function parseSSEBuffer(buffer: string): {
  events: ParsedSSELine[];
  remaining: string;
} {
  const events: ParsedSSELine[] = [];
  const blocks = buffer.split('\n\n');

  // Last element may be incomplete; keep it as remaining
  const remaining = blocks.pop() ?? '';

  for (const block of blocks) {
    if (!block.trim()) continue;

    let eventType = 'message';
    let dataStr = '';

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        eventType = line.slice('event:'.length).trim();
      } else if (line.startsWith('data:')) {
        dataStr = line.slice('data:'.length).trim();
      }
    }

    if (!dataStr) continue;

    try {
      events.push({ eventType, data: JSON.parse(dataStr) });
    } catch {
      events.push({ eventType, data: dataStr });
    }
  }

  return { events, remaining };
}

// =============================================================================
// Event Dispatcher
// =============================================================================

/**
 * Dispatch a parsed SSE event to the appropriate callback.
 *
 * Routes event types to their corresponding callback functions
 * in the SageStreamCallbacks interface.
 */
export function dispatchEvent(
  eventType: string,
  data: unknown,
  callbacks: SageStreamCallbacks
): void {
  switch (eventType) {
    case 'chat:start':
      callbacks.onChatStart?.(data as ChatStartEvent['data']);
      break;
    case 'chat:delta':
      callbacks.onChatDelta?.(data as ChatDeltaEvent['data']);
      break;
    case 'chat:end':
      callbacks.onChatEnd?.(data as ChatEndEvent['data']);
      break;
    case 'tool:start':
      callbacks.onToolStart?.(data as ToolStartEvent['data']);
      break;
    case 'tool:end':
      callbacks.onToolEnd?.(data as ToolEndEvent['data']);
      break;
    case 'panel:spark':
      callbacks.onPanelSpark?.(data as PanelSparkEvent['data']);
      break;
    case 'panel:component':
      callbacks.onPanelComponent?.(data as PanelComponentEvent['data']);
      break;
    case 'panel:frames':
      callbacks.onPanelFrames?.(data as PanelFramesEvent['data']);
      break;
    case 'panel:scene_arcs':
      callbacks.onPanelSceneArcs?.(data as PanelSceneArcsEvent['data']);
      break;
    case 'panel:scene_arc':
      callbacks.onPanelSceneArc?.(data as PanelSceneArcEvent['data']);
      break;
    case 'panel:name':
      callbacks.onPanelName?.(data as PanelNameEvent['data']);
      break;
    case 'panel:sections':
      callbacks.onPanelSections?.(data as PanelSectionsEvent['data']);
      break;
    case 'panel:section':
      callbacks.onPanelSection?.(data as PanelSectionEvent['data']);
      break;
    case 'panel:wave3_invalidated':
      callbacks.onPanelWave3Invalidated?.(data as PanelWave3InvalidatedEvent['data']);
      break;
    case 'panel:balance_warning':
      callbacks.onPanelBalanceWarning?.(data as PanelBalanceWarningEvent['data']);
      break;
    case 'panel:scene_confirmed':
      callbacks.onPanelSceneConfirmed?.(data as PanelSceneConfirmedEvent['data']);
      break;
    case 'panel:entity_npcs':
      callbacks.onPanelEntityNPCs?.(data as PanelEntityNPCsEvent['data']);
      break;
    case 'panel:entity_adversaries':
      callbacks.onPanelEntityAdversaries?.(data as PanelEntityAdversariesEvent['data']);
      break;
    case 'panel:entity_items':
      callbacks.onPanelEntityItems?.(data as PanelEntityItemsEvent['data']);
      break;
    case 'panel:entity_portents':
      callbacks.onPanelEntityPortents?.(data as PanelEntityPortentsEvent['data']);
      break;
    case 'ui:ready':
      callbacks.onUIReady?.(data as UIReadyEvent['data']);
      break;
    case 'error':
      callbacks.onError?.(data as SageErrorEvent['data']);
      break;
  }
}
