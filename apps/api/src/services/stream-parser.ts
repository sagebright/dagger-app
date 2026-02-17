/**
 * Stream parser for Anthropic Messages API events
 *
 * Converts raw Anthropic stream events into SageEvent objects
 * that can be serialized as SSE events to the frontend.
 *
 * Responsibilities:
 * - Track message ID and content block indices
 * - Route text_delta events to chat:delta SSE events
 * - Collect tool_use blocks for dispatch after stream ends
 * - Accumulate token usage from message_start and message_delta
 * - Accumulate full text for message storage
 */

import type { SageEvent } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

/** A collected tool_use block from the stream */
export interface CollectedToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** Result of parsing the complete stream */
export interface ParsedStreamResult {
  /** The Anthropic message ID */
  messageId: string;
  /** All SSE events generated during parsing */
  events: SageEvent[];
  /** Tool invocations collected from the stream */
  toolUseBlocks: CollectedToolUse[];
  /** Total input tokens reported */
  inputTokens: number;
  /** Total output tokens reported */
  outputTokens: number;
  /** The full accumulated text content */
  fullText: string;
  /** The model that generated the response */
  model: string;
  /** The stop reason from the API */
  stopReason: string | null;
}

// =============================================================================
// Content Block Tracking
// =============================================================================

interface TextBlockState {
  type: 'text';
  text: string;
}

interface ToolUseBlockState {
  type: 'tool_use';
  id: string;
  name: string;
  inputJson: string;
}

type ContentBlockState = TextBlockState | ToolUseBlockState;

// =============================================================================
// Stream Parser
// =============================================================================

/** A stream event with at minimum a type field */
export type StreamEvent = { type: string } & Record<string, unknown>;

/**
 * Parse a raw Anthropic stream into SageEvents and collected tool_use blocks.
 *
 * Iterates the async stream once, building up events and metadata.
 * Returns a complete result after the stream ends.
 *
 * Accepts any async iterable yielding objects with a `type` field.
 * The Anthropic SDK MessageStream is async-iterable and compatible.
 */
export async function parseAnthropicStream(
  stream: AsyncIterable<StreamEvent> | AsyncIterable<{ type: string }>
): Promise<ParsedStreamResult> {
  let messageId = '';
  let model = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let stopReason: string | null = null;
  const events: SageEvent[] = [];
  const toolUseBlocks: CollectedToolUse[] = [];
  const contentBlocks: Map<number, ContentBlockState> = new Map();

  for await (const rawEvent of stream) {
    const event = rawEvent as StreamEvent;
    switch (event.type) {
      case 'message_start':
        ({ messageId, model, inputTokens } = handleMessageStart(event));
        events.push({ type: 'chat:start', data: { messageId } });
        break;

      case 'content_block_start':
        handleContentBlockStart(event, contentBlocks);
        break;

      case 'content_block_delta':
        handleContentBlockDelta(event, contentBlocks, events, messageId);
        break;

      case 'content_block_stop':
        handleContentBlockStop(event, contentBlocks, toolUseBlocks);
        break;

      case 'message_delta':
        ({ stopReason, outputTokens } = handleMessageDelta(
          event,
          outputTokens
        ));
        break;

      case 'message_stop':
        // Stream is complete; no additional action needed
        break;
    }
  }

  const fullText = buildFullText(contentBlocks);

  events.push({
    type: 'chat:end',
    data: { messageId, inputTokens, outputTokens },
  });

  return {
    messageId,
    events,
    toolUseBlocks,
    inputTokens,
    outputTokens,
    fullText,
    model,
    stopReason,
  };
}

// =============================================================================
// Event Handlers (extracted for clarity and testability)
// =============================================================================

function handleMessageStart(event: Record<string, unknown>): {
  messageId: string;
  model: string;
  inputTokens: number;
} {
  const message = event.message as Record<string, unknown>;
  const usage = message.usage as Record<string, number>;
  return {
    messageId: message.id as string,
    model: message.model as string,
    inputTokens: usage.input_tokens,
  };
}

function handleContentBlockStart(
  event: Record<string, unknown>,
  contentBlocks: Map<number, ContentBlockState>
): void {
  const index = event.index as number;
  const block = event.content_block as Record<string, unknown>;

  if (block.type === 'text') {
    contentBlocks.set(index, { type: 'text', text: '' });
  } else if (block.type === 'tool_use') {
    contentBlocks.set(index, {
      type: 'tool_use',
      id: block.id as string,
      name: block.name as string,
      inputJson: '',
    });
  }
}

function handleContentBlockDelta(
  event: Record<string, unknown>,
  contentBlocks: Map<number, ContentBlockState>,
  events: SageEvent[],
  messageId: string
): void {
  const index = event.index as number;
  const delta = event.delta as Record<string, unknown>;
  const block = contentBlocks.get(index);

  if (!block) return;

  if (delta.type === 'text_delta' && block.type === 'text') {
    const text = delta.text as string;
    block.text += text;
    events.push({
      type: 'chat:delta',
      data: { messageId, content: text },
    });
  } else if (delta.type === 'input_json_delta' && block.type === 'tool_use') {
    block.inputJson += delta.partial_json as string;
  }
}

function handleContentBlockStop(
  event: Record<string, unknown>,
  contentBlocks: Map<number, ContentBlockState>,
  toolUseBlocks: CollectedToolUse[]
): void {
  const index = event.index as number;
  const block = contentBlocks.get(index);

  if (!block) return;

  if (block.type === 'tool_use') {
    let parsedInput: Record<string, unknown> = {};
    try {
      parsedInput = JSON.parse(block.inputJson) as Record<string, unknown>;
    } catch {
      parsedInput = { _raw: block.inputJson };
    }
    toolUseBlocks.push({
      id: block.id,
      name: block.name,
      input: parsedInput,
    });
  }
}

function handleMessageDelta(
  event: Record<string, unknown>,
  currentOutputTokens: number
): { stopReason: string | null; outputTokens: number } {
  const delta = event.delta as Record<string, unknown>;
  const usage = event.usage as Record<string, number> | undefined;
  return {
    stopReason: (delta.stop_reason as string) ?? null,
    outputTokens: usage?.output_tokens ?? currentOutputTokens,
  };
}

function buildFullText(
  contentBlocks: Map<number, ContentBlockState>
): string {
  const textParts: string[] = [];
  for (const [, block] of contentBlocks) {
    if (block.type === 'text') {
      textParts.push(block.text);
    }
  }
  return textParts.join('');
}
