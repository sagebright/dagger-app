/**
 * Context assembler for Sage Codex
 *
 * Builds the complete Anthropic Messages API request payload by combining:
 * - T0: System prompt (base persona + stage augmentation)
 * - T1-T3: Serialized adventure state
 * - T5: Compressed conversation history
 * - Tools: Stage-appropriate tool definitions
 * - Current user message
 *
 * This is the single point of assembly for all LLM requests.
 */

import type {
  AdventureState,
  SageMessage,
  ToolDefinition,
  Stage,
} from '@dagger-app/shared-types';
import type { AnthropicMessage, StreamOptions } from './anthropic.js';
import { buildSystemPrompt } from './system-prompt.js';
import { serializeForLLM } from './state-serializer.js';
import { compressConversationHistory } from './conversation-history.js';
import { getToolsForStage } from '../tools/definitions.js';

// =============================================================================
// Types
// =============================================================================

export interface AssemblePayloadParams {
  /** The current adventure state */
  state: AdventureState;
  /** The current stage (may differ from state.stage during transitions) */
  stage: Stage;
  /** Conversation history from the message store */
  conversationHistory: SageMessage[];
  /** The current user message */
  userMessage: string;
  /** The scene arc ID currently being worked on */
  activeSceneId?: string;
}

export interface AssembledPayload {
  /** Ready-to-send StreamOptions for the Anthropic service */
  streamOptions: StreamOptions;
  /** Metadata about what was assembled */
  metadata: {
    systemPromptLength: number;
    stateContextLength: number;
    messageCount: number;
    compressedMessageCount: number;
    droppedMessageCount: number;
    toolCount: number;
    tiersIncluded: string[];
  };
}

// =============================================================================
// Assembly
// =============================================================================

/**
 * Assemble the complete Anthropic API payload for a chat turn.
 *
 * Combines all context tiers into a single StreamOptions object
 * ready to pass to createStreamingMessage().
 */
export function assembleAnthropicPayload(
  params: AssemblePayloadParams
): AssembledPayload {
  const {
    state,
    stage,
    conversationHistory,
    userMessage,
    activeSceneId,
  } = params;

  // T0: Build system prompt (persona + stage augmentation)
  const baseSystemPrompt = buildSystemPrompt(stage);

  // T1-T3: Serialize adventure state as compact text
  const serializedState = serializeForLLM(state, stage, { activeSceneId });

  // Combine system prompt with state context
  const systemPrompt = serializedState.text
    ? `${baseSystemPrompt}\n\n--- ADVENTURE STATE ---\n${serializedState.text}`
    : baseSystemPrompt;

  // T5: Compress conversation history
  const compressed = compressConversationHistory(conversationHistory);

  // Add the current user message
  const messages: AnthropicMessage[] = [
    ...compressed.messages,
    { role: 'user', content: userMessage },
  ];

  // Get stage-appropriate tools
  const tools: ToolDefinition[] = getToolsForStage(stage);

  const streamOptions: StreamOptions = {
    messages,
    tools,
    systemPrompt,
  };

  return {
    streamOptions,
    metadata: {
      systemPromptLength: systemPrompt.length,
      stateContextLength: serializedState.characterCount,
      messageCount: messages.length,
      compressedMessageCount: compressed.compressedCount,
      droppedMessageCount: compressed.droppedCount,
      toolCount: tools.length,
      tiersIncluded: serializedState.tiersIncluded,
    },
  };
}
