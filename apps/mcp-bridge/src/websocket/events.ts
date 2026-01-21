/**
 * WebSocket Event Handlers
 *
 * Provides typed event emission and handling for WebSocket communication
 * between the frontend and MCP Bridge.
 */

import type { WebSocket } from 'ws';
import type {
  ServerEvent,
  ClientEvent,
  DialUpdate,
  InlineWidget,
  DialId,
  DialConfidence,
  UserMessageEvent,
  DialUpdateEvent,
  DialConfirmEvent,
  OutlineGenerateEvent,
  OutlineFeedbackEvent,
  OutlineConfirmEvent,
  OutlineEditSceneEvent,
  OutlineClientEvent,
  OutlineServerEvent,
  Outline,
  SceneBrief,
  // Scene types
  SceneGenerateEvent,
  SceneFeedbackEvent,
  SceneConfirmEvent,
  SceneNavigateEvent,
  SceneClientEvent,
  SceneServerEvent,
  SceneDraft,
  // NPC types
  NPCCompileEvent,
  NPCRefineEvent,
  NPCConfirmEvent,
  NPCClientEvent,
  NPCServerEvent,
  NPC,
  // Adversary types
  AdversaryLoadEvent,
  AdversarySelectEvent,
  AdversaryDeselectEvent,
  AdversaryUpdateQuantityEvent,
  AdversaryConfirmEvent,
  AdversaryClientEvent,
  AdversaryServerEvent,
  SelectedAdversary,
  DaggerheartAdversary,
  // Item types
  ItemLoadEvent,
  ItemSelectEvent,
  ItemDeselectEvent,
  ItemUpdateQuantityEvent,
  ItemConfirmEvent,
  ItemClientEvent,
  ItemServerEvent,
  SelectedItem,
  UnifiedItem,
  ItemCategory,
  // Echo types
  EchoGenerateEvent,
  EchoEditEvent,
  EchoConfirmEvent,
  EchoRegenerateEvent,
  EchoClientEvent,
  EchoServerEvent,
  Echo,
  EchoCategory,
} from '@dagger-app/shared-types';

// Combined event types that include dial, outline, scene, NPC, adversary, item, and echo events
type AllClientEvents = ClientEvent | OutlineClientEvent | SceneClientEvent | NPCClientEvent | AdversaryClientEvent | ItemClientEvent | EchoClientEvent;
type AllServerEvents = ServerEvent | OutlineServerEvent | SceneServerEvent | NPCServerEvent | AdversaryServerEvent | ItemServerEvent | EchoServerEvent;

// =============================================================================
// Event Handlers Configuration
// =============================================================================

/**
 * Handlers for client events
 */
export interface ClientEventHandlers {
  onUserMessage?: (payload: UserMessageEvent['payload']) => Promise<void> | void;
  onDialUpdate?: (payload: DialUpdateEvent['payload']) => Promise<void> | void;
  onDialConfirm?: (payload: DialConfirmEvent['payload']) => Promise<void> | void;
  // Outline events
  onOutlineGenerate?: (payload: OutlineGenerateEvent['payload']) => Promise<void> | void;
  onOutlineFeedback?: (payload: OutlineFeedbackEvent['payload']) => Promise<void> | void;
  onOutlineConfirm?: (payload: OutlineConfirmEvent['payload']) => Promise<void> | void;
  onOutlineEditScene?: (payload: OutlineEditSceneEvent['payload']) => Promise<void> | void;
  // Scene events
  onSceneGenerate?: (payload: SceneGenerateEvent['payload']) => Promise<void> | void;
  onSceneFeedback?: (payload: SceneFeedbackEvent['payload']) => Promise<void> | void;
  onSceneConfirm?: (payload: SceneConfirmEvent['payload']) => Promise<void> | void;
  onSceneNavigate?: (payload: SceneNavigateEvent['payload']) => Promise<void> | void;
  // NPC events
  onNPCCompile?: (payload: NPCCompileEvent['payload']) => Promise<void> | void;
  onNPCRefine?: (payload: NPCRefineEvent['payload']) => Promise<void> | void;
  onNPCConfirm?: (payload: NPCConfirmEvent['payload']) => Promise<void> | void;
  // Adversary events
  onAdversaryLoad?: (payload: AdversaryLoadEvent['payload']) => Promise<void> | void;
  onAdversarySelect?: (payload: AdversarySelectEvent['payload']) => Promise<void> | void;
  onAdversaryDeselect?: (payload: AdversaryDeselectEvent['payload']) => Promise<void> | void;
  onAdversaryUpdateQuantity?: (payload: AdversaryUpdateQuantityEvent['payload']) => Promise<void> | void;
  onAdversaryConfirm?: (payload: AdversaryConfirmEvent['payload']) => Promise<void> | void;
  // Item events
  onItemLoad?: (payload: ItemLoadEvent['payload']) => Promise<void> | void;
  onItemSelect?: (payload: ItemSelectEvent['payload']) => Promise<void> | void;
  onItemDeselect?: (payload: ItemDeselectEvent['payload']) => Promise<void> | void;
  onItemUpdateQuantity?: (payload: ItemUpdateQuantityEvent['payload']) => Promise<void> | void;
  onItemConfirm?: (payload: ItemConfirmEvent['payload']) => Promise<void> | void;
  // Echo events
  onEchoGenerate?: (payload: EchoGenerateEvent['payload']) => Promise<void> | void;
  onEchoEdit?: (payload: EchoEditEvent['payload']) => Promise<void> | void;
  onEchoConfirm?: (payload: EchoConfirmEvent['payload']) => Promise<void> | void;
  onEchoRegenerate?: (payload: EchoRegenerateEvent['payload']) => Promise<void> | void;
}

// =============================================================================
// Core Event Emission
// =============================================================================

/**
 * Send a typed event to a WebSocket client
 */
export function emitToClient(ws: WebSocket, event: AllServerEvents): void {
  if (ws.readyState === 1) {
    // 1 = OPEN
    ws.send(JSON.stringify(event));
  }
}

// =============================================================================
// Server Event Emitters
// =============================================================================

/**
 * Emit connected event
 */
export function emitConnected(ws: WebSocket, message: string): void {
  emitToClient(ws, {
    type: 'connected',
    payload: { message },
  });
}

/**
 * Emit assistant response start (for streaming)
 */
export function emitAssistantStart(ws: WebSocket, messageId: string): void {
  emitToClient(ws, {
    type: 'chat:assistant_start',
    payload: { messageId },
  });
}

/**
 * Emit streaming chunk of assistant response
 */
export function emitAssistantChunk(ws: WebSocket, messageId: string, chunk: string): void {
  emitToClient(ws, {
    type: 'chat:assistant_chunk',
    payload: { messageId, chunk },
  });
}

/**
 * Emit assistant response complete
 */
export function emitAssistantComplete(
  ws: WebSocket,
  messageId: string,
  dialUpdates?: DialUpdate[],
  inlineWidgets?: InlineWidget[]
): void {
  const payload: { messageId: string; dialUpdates?: DialUpdate[]; inlineWidgets?: InlineWidget[] } =
    { messageId };

  if (dialUpdates) {
    payload.dialUpdates = dialUpdates;
  }
  if (inlineWidgets) {
    payload.inlineWidgets = inlineWidgets;
  }

  emitToClient(ws, {
    type: 'chat:assistant_complete',
    payload,
  });
}

/**
 * Emit dial value updated (confirmed change)
 */
export function emitDialUpdated(
  ws: WebSocket,
  dialId: DialId,
  value: unknown,
  source: 'user' | 'assistant'
): void {
  emitToClient(ws, {
    type: 'dial:updated',
    payload: { dialId, value, source },
  });
}

/**
 * Emit dial suggestion from assistant
 */
export function emitDialSuggestion(
  ws: WebSocket,
  dialId: DialId,
  value: unknown,
  confidence: DialConfidence,
  reason?: string
): void {
  const payload: { dialId: DialId; value: unknown; confidence: DialConfidence; reason?: string } = {
    dialId,
    value,
    confidence,
  };

  if (reason) {
    payload.reason = reason;
  }

  emitToClient(ws, {
    type: 'dial:suggestion',
    payload,
  });
}

/**
 * Emit error event
 */
export function emitError(ws: WebSocket, code: string, message: string): void {
  emitToClient(ws, {
    type: 'error',
    payload: { code, message },
  });
}

// =============================================================================
// Outline Event Emitters
// =============================================================================

/**
 * Emit outline draft start event
 */
export function emitOutlineDraftStart(ws: WebSocket, messageId: string): void {
  emitToClient(ws, {
    type: 'outline:draft_start',
    payload: { messageId },
  });
}

/**
 * Emit outline draft streaming chunk
 */
export function emitOutlineDraftChunk(ws: WebSocket, messageId: string, chunk: string): void {
  emitToClient(ws, {
    type: 'outline:draft_chunk',
    payload: { messageId, chunk },
  });
}

/**
 * Emit outline draft complete
 */
export function emitOutlineDraftComplete(
  ws: WebSocket,
  messageId: string,
  isComplete: boolean,
  outline?: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>,
  followUpQuestion?: string
): void {
  const payload: {
    messageId: string;
    isComplete: boolean;
    outline?: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>;
    followUpQuestion?: string;
  } = { messageId, isComplete };

  if (outline) {
    payload.outline = outline;
  }
  if (followUpQuestion) {
    payload.followUpQuestion = followUpQuestion;
  }

  emitToClient(ws, {
    type: 'outline:draft_complete',
    payload,
  });
}

/**
 * Emit outline confirmed event
 */
export function emitOutlineConfirmed(ws: WebSocket, outline: Outline): void {
  emitToClient(ws, {
    type: 'outline:confirmed',
    payload: { outline },
  });
}

/**
 * Emit scene brief updated event
 */
export function emitSceneBriefUpdated(ws: WebSocket, scene: SceneBrief): void {
  emitToClient(ws, {
    type: 'outline:scene_updated',
    payload: { scene },
  });
}

// =============================================================================
// Scene Event Emitters (Phase 3.3)
// =============================================================================

/**
 * Emit scene draft start event
 */
export function emitSceneDraftStart(ws: WebSocket, sceneId: string, messageId: string): void {
  emitToClient(ws, {
    type: 'scene:draft_start',
    payload: { sceneId, messageId },
  });
}

/**
 * Emit scene draft streaming chunk
 */
export function emitSceneDraftChunk(
  ws: WebSocket,
  sceneId: string,
  messageId: string,
  chunk: string
): void {
  emitToClient(ws, {
    type: 'scene:draft_chunk',
    payload: { sceneId, messageId, chunk },
  });
}

/**
 * Emit scene draft complete
 */
export function emitSceneDraftComplete(
  ws: WebSocket,
  sceneId: string,
  messageId: string,
  isComplete: boolean,
  sceneDraft?: SceneDraft,
  followUpQuestion?: string
): void {
  const payload: {
    sceneId: string;
    messageId: string;
    isComplete: boolean;
    sceneDraft?: SceneDraft;
    followUpQuestion?: string;
  } = { sceneId, messageId, isComplete };

  if (sceneDraft) {
    payload.sceneDraft = sceneDraft;
  }
  if (followUpQuestion) {
    payload.followUpQuestion = followUpQuestion;
  }

  emitToClient(ws, {
    type: 'scene:draft_complete',
    payload,
  });
}

/**
 * Emit scene confirmed event
 */
export function emitSceneConfirmed(ws: WebSocket, sceneId: string, sceneDraft: SceneDraft): void {
  emitToClient(ws, {
    type: 'scene:confirmed',
    payload: { sceneId, sceneDraft },
  });
}

/**
 * Emit scene error event
 */
export function emitSceneError(ws: WebSocket, sceneId: string, code: string, message: string): void {
  emitToClient(ws, {
    type: 'scene:error',
    payload: { sceneId, code, message },
  });
}

// =============================================================================
// NPC Event Emitters (Phase 3.4)
// =============================================================================

/**
 * Emit NPC compile start event
 */
export function emitNPCCompileStart(ws: WebSocket, messageId: string, totalScenes: number): void {
  emitToClient(ws, {
    type: 'npc:compile_start',
    payload: { messageId, totalScenes },
  });
}

/**
 * Emit NPC compile streaming chunk
 */
export function emitNPCCompileChunk(ws: WebSocket, messageId: string, chunk: string): void {
  emitToClient(ws, {
    type: 'npc:compile_chunk',
    payload: { messageId, chunk },
  });
}

/**
 * Emit NPC compile complete
 */
export function emitNPCCompileComplete(
  ws: WebSocket,
  messageId: string,
  isComplete: boolean,
  npcs?: NPC[],
  followUpQuestion?: string
): void {
  const payload: {
    messageId: string;
    isComplete: boolean;
    npcs?: NPC[];
    followUpQuestion?: string;
  } = { messageId, isComplete };

  if (npcs) {
    payload.npcs = npcs;
  }
  if (followUpQuestion) {
    payload.followUpQuestion = followUpQuestion;
  }

  emitToClient(ws, {
    type: 'npc:compile_complete',
    payload,
  });
}

/**
 * Emit NPC refined event
 */
export function emitNPCRefined(ws: WebSocket, npc: NPC): void {
  emitToClient(ws, {
    type: 'npc:refined',
    payload: { npc },
  });
}

/**
 * Emit NPC confirmed event
 */
export function emitNPCConfirmed(ws: WebSocket, npcId: string): void {
  emitToClient(ws, {
    type: 'npc:confirmed',
    payload: { npcId },
  });
}

/**
 * Emit NPC error event
 */
export function emitNPCError(ws: WebSocket, code: string, message: string): void {
  emitToClient(ws, {
    type: 'npc:error',
    payload: { code, message },
  });
}

// =============================================================================
// Adversary Event Emitters (Phase 4.1)
// =============================================================================

/**
 * Emit adversaries loaded from database
 */
export function emitAdversaryLoaded(
  ws: WebSocket,
  adversaries: DaggerheartAdversary[],
  availableTypes: string[]
): void {
  emitToClient(ws, {
    type: 'adversary:loaded',
    payload: { adversaries, availableTypes },
  });
}

/**
 * Emit adversary selected
 */
export function emitAdversarySelected(ws: WebSocket, adversaryId: string, quantity: number): void {
  emitToClient(ws, {
    type: 'adversary:selected',
    payload: { adversaryId, quantity },
  });
}

/**
 * Emit adversary deselected
 */
export function emitAdversaryDeselected(ws: WebSocket, adversaryId: string): void {
  emitToClient(ws, {
    type: 'adversary:deselected',
    payload: { adversaryId },
  });
}

/**
 * Emit adversaries confirmed
 */
export function emitAdversaryConfirmed(ws: WebSocket, selections: SelectedAdversary[]): void {
  emitToClient(ws, {
    type: 'adversary:confirmed',
    payload: { selections },
  });
}

/**
 * Emit adversary error
 */
export function emitAdversaryError(ws: WebSocket, code: string, message: string): void {
  emitToClient(ws, {
    type: 'adversary:error',
    payload: { code, message },
  });
}

// =============================================================================
// Item Event Emitters (Phase 4.2)
// =============================================================================

/**
 * Emit items loaded from database
 */
export function emitItemLoaded(
  ws: WebSocket,
  items: UnifiedItem[],
  availableCategories: ItemCategory[]
): void {
  emitToClient(ws, {
    type: 'item:loaded',
    payload: { items, availableCategories },
  });
}

/**
 * Emit item selected
 */
export function emitItemSelected(
  ws: WebSocket,
  itemId: string,
  category: ItemCategory,
  quantity: number
): void {
  emitToClient(ws, {
    type: 'item:selected',
    payload: { itemId, category, quantity },
  });
}

/**
 * Emit item deselected
 */
export function emitItemDeselected(ws: WebSocket, itemId: string, category: ItemCategory): void {
  emitToClient(ws, {
    type: 'item:deselected',
    payload: { itemId, category },
  });
}

/**
 * Emit items confirmed
 */
export function emitItemConfirmed(ws: WebSocket, selections: SelectedItem[]): void {
  emitToClient(ws, {
    type: 'item:confirmed',
    payload: { selections },
  });
}

/**
 * Emit item error
 */
export function emitItemError(ws: WebSocket, code: string, message: string): void {
  emitToClient(ws, {
    type: 'item:error',
    payload: { code, message },
  });
}

// =============================================================================
// Echo Event Emitters (Phase 4.3)
// =============================================================================

/**
 * Emit echo generation start event
 */
export function emitEchoGenerateStart(
  ws: WebSocket,
  messageId: string,
  categories: EchoCategory[]
): void {
  emitToClient(ws, {
    type: 'echo:generate_start',
    payload: { messageId, categories },
  });
}

/**
 * Emit echo generation streaming chunk
 */
export function emitEchoGenerateChunk(ws: WebSocket, messageId: string, chunk: string): void {
  emitToClient(ws, {
    type: 'echo:generate_chunk',
    payload: { messageId, chunk },
  });
}

/**
 * Emit echo generation complete
 */
export function emitEchoGenerateComplete(
  ws: WebSocket,
  messageId: string,
  echoes: Echo[],
  isComplete: boolean,
  followUpQuestion?: string
): void {
  const payload: {
    messageId: string;
    echoes: Echo[];
    isComplete: boolean;
    followUpQuestion?: string;
  } = { messageId, echoes, isComplete };

  if (followUpQuestion) {
    payload.followUpQuestion = followUpQuestion;
  }

  emitToClient(ws, {
    type: 'echo:generate_complete',
    payload,
  });
}

/**
 * Emit echo updated event
 */
export function emitEchoUpdated(ws: WebSocket, echo: Echo): void {
  emitToClient(ws, {
    type: 'echo:updated',
    payload: { echo },
  });
}

/**
 * Emit echo confirmed event
 */
export function emitEchoConfirmed(ws: WebSocket, echoId: string): void {
  emitToClient(ws, {
    type: 'echo:confirmed',
    payload: { echoId },
  });
}

/**
 * Emit echo error event
 */
export function emitEchoError(ws: WebSocket, code: string, message: string): void {
  emitToClient(ws, {
    type: 'echo:error',
    payload: { code, message },
  });
}

// =============================================================================
// Client Event Handler
// =============================================================================

/**
 * Handle incoming client events with typed handlers
 */
export async function handleClientEvent(
  ws: WebSocket,
  event: AllClientEvents,
  handlers: ClientEventHandlers
): Promise<void> {
  switch (event.type) {
    case 'chat:user_message':
      if (handlers.onUserMessage) {
        await handlers.onUserMessage(event.payload);
      }
      break;

    case 'dial:update':
      if (handlers.onDialUpdate) {
        await handlers.onDialUpdate(event.payload);
      }
      break;

    case 'dial:confirm':
      if (handlers.onDialConfirm) {
        await handlers.onDialConfirm(event.payload);
      }
      break;

    // Outline events
    case 'outline:generate':
      if (handlers.onOutlineGenerate) {
        await handlers.onOutlineGenerate((event as OutlineGenerateEvent).payload);
      }
      break;

    case 'outline:feedback':
      if (handlers.onOutlineFeedback) {
        await handlers.onOutlineFeedback((event as OutlineFeedbackEvent).payload);
      }
      break;

    case 'outline:confirm':
      if (handlers.onOutlineConfirm) {
        await handlers.onOutlineConfirm((event as OutlineConfirmEvent).payload);
      }
      break;

    case 'outline:edit_scene':
      if (handlers.onOutlineEditScene) {
        await handlers.onOutlineEditScene((event as OutlineEditSceneEvent).payload);
      }
      break;

    // Scene events
    case 'scene:generate':
      if (handlers.onSceneGenerate) {
        await handlers.onSceneGenerate((event as SceneGenerateEvent).payload);
      }
      break;

    case 'scene:feedback':
      if (handlers.onSceneFeedback) {
        await handlers.onSceneFeedback((event as SceneFeedbackEvent).payload);
      }
      break;

    case 'scene:confirm':
      if (handlers.onSceneConfirm) {
        await handlers.onSceneConfirm((event as SceneConfirmEvent).payload);
      }
      break;

    case 'scene:navigate':
      if (handlers.onSceneNavigate) {
        await handlers.onSceneNavigate((event as SceneNavigateEvent).payload);
      }
      break;

    // NPC events
    case 'npc:compile':
      if (handlers.onNPCCompile) {
        await handlers.onNPCCompile((event as NPCCompileEvent).payload);
      }
      break;

    case 'npc:refine':
      if (handlers.onNPCRefine) {
        await handlers.onNPCRefine((event as NPCRefineEvent).payload);
      }
      break;

    case 'npc:confirm':
      if (handlers.onNPCConfirm) {
        await handlers.onNPCConfirm((event as NPCConfirmEvent).payload);
      }
      break;

    // Adversary events
    case 'adversary:load':
      if (handlers.onAdversaryLoad) {
        await handlers.onAdversaryLoad((event as AdversaryLoadEvent).payload);
      }
      break;

    case 'adversary:select':
      if (handlers.onAdversarySelect) {
        await handlers.onAdversarySelect((event as AdversarySelectEvent).payload);
      }
      break;

    case 'adversary:deselect':
      if (handlers.onAdversaryDeselect) {
        await handlers.onAdversaryDeselect((event as AdversaryDeselectEvent).payload);
      }
      break;

    case 'adversary:update_quantity':
      if (handlers.onAdversaryUpdateQuantity) {
        await handlers.onAdversaryUpdateQuantity((event as AdversaryUpdateQuantityEvent).payload);
      }
      break;

    case 'adversary:confirm':
      if (handlers.onAdversaryConfirm) {
        await handlers.onAdversaryConfirm((event as AdversaryConfirmEvent).payload);
      }
      break;

    // Item events
    case 'item:load':
      if (handlers.onItemLoad) {
        await handlers.onItemLoad((event as ItemLoadEvent).payload);
      }
      break;

    case 'item:select':
      if (handlers.onItemSelect) {
        await handlers.onItemSelect((event as ItemSelectEvent).payload);
      }
      break;

    case 'item:deselect':
      if (handlers.onItemDeselect) {
        await handlers.onItemDeselect((event as ItemDeselectEvent).payload);
      }
      break;

    case 'item:update_quantity':
      if (handlers.onItemUpdateQuantity) {
        await handlers.onItemUpdateQuantity((event as ItemUpdateQuantityEvent).payload);
      }
      break;

    case 'item:confirm':
      if (handlers.onItemConfirm) {
        await handlers.onItemConfirm((event as ItemConfirmEvent).payload);
      }
      break;

    // Echo events
    case 'echo:generate':
      if (handlers.onEchoGenerate) {
        await handlers.onEchoGenerate((event as EchoGenerateEvent).payload);
      }
      break;

    case 'echo:edit':
      if (handlers.onEchoEdit) {
        await handlers.onEchoEdit((event as EchoEditEvent).payload);
      }
      break;

    case 'echo:confirm':
      if (handlers.onEchoConfirm) {
        await handlers.onEchoConfirm((event as EchoConfirmEvent).payload);
      }
      break;

    case 'echo:regenerate':
      if (handlers.onEchoRegenerate) {
        await handlers.onEchoRegenerate((event as EchoRegenerateEvent).payload);
      }
      break;

    default:
      emitError(ws, 'UNKNOWN_EVENT', `Unknown event type: ${(event as { type: string }).type}`);
  }
}

/**
 * Parse and validate incoming WebSocket message as ClientEvent
 */
export function parseClientEvent(data: Buffer | string): AllClientEvents | null {
  try {
    const parsed = JSON.parse(data.toString());

    // Basic validation
    if (!parsed || typeof parsed !== 'object' || !parsed.type || !parsed.payload) {
      return null;
    }

    // Validate known event types
    const validTypes = [
      'chat:user_message',
      'dial:update',
      'dial:confirm',
      // Outline events
      'outline:generate',
      'outline:feedback',
      'outline:confirm',
      'outline:edit_scene',
      // Scene events
      'scene:generate',
      'scene:feedback',
      'scene:confirm',
      'scene:navigate',
      // NPC events
      'npc:compile',
      'npc:refine',
      'npc:confirm',
      // Adversary events
      'adversary:load',
      'adversary:select',
      'adversary:deselect',
      'adversary:update_quantity',
      'adversary:confirm',
      // Item events
      'item:load',
      'item:select',
      'item:deselect',
      'item:update_quantity',
      'item:confirm',
      // Echo events
      'echo:generate',
      'echo:edit',
      'echo:confirm',
      'echo:regenerate',
    ];
    if (!validTypes.includes(parsed.type)) {
      return null;
    }

    return parsed as AllClientEvents;
  } catch {
    return null;
  }
}
