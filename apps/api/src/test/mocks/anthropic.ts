/**
 * Mock factory for Anthropic Messages API
 *
 * Provides configurable mocks for:
 * - Streaming message responses (text deltas, tool_use blocks)
 * - Non-streaming message responses
 * - Token usage tracking
 *
 * Usage:
 *   import { mockAnthropicStream, mockAnthropicMessage } from '../test/mocks/anthropic';
 *
 *   vi.mock('@anthropic-ai/sdk', () => ({
 *     default: vi.fn(() => createMockAnthropicClient()),
 *   }));
 */

import { vi } from 'vitest';

// =============================================================================
// Types
// =============================================================================

/** Configuration for a streaming text response */
interface StreamTextConfig {
  textChunks: string[];
  inputTokens?: number;
  outputTokens?: number;
  stopReason?: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  model?: string;
}

/** Configuration for a tool_use block in a response */
interface ToolUseConfig {
  id?: string;
  name: string;
  input: Record<string, unknown>;
}

/** Configuration for a complete message response */
interface MessageConfig {
  content?: Array<TextBlock | ToolUseBlock>;
  inputTokens?: number;
  outputTokens?: number;
  stopReason?: string;
  model?: string;
  id?: string;
}

interface TextBlock {
  type: 'text';
  text: string;
}

interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

interface StreamEvent {
  type: string;
  [key: string]: unknown;
}

// =============================================================================
// Stream Event Builders
// =============================================================================

function buildMessageStartEvent(config: {
  id: string;
  model: string;
  inputTokens: number;
}): StreamEvent {
  return {
    type: 'message_start',
    message: {
      id: config.id,
      type: 'message',
      role: 'assistant',
      content: [],
      model: config.model,
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: config.inputTokens, output_tokens: 0 },
    },
  };
}

function buildContentBlockStartEvent(
  index: number,
  block: TextBlock | ToolUseBlock
): StreamEvent {
  return {
    type: 'content_block_start',
    index,
    content_block: block.type === 'text'
      ? { type: 'text', text: '' }
      : { type: 'tool_use', id: block.id, name: block.name, input: '' },
  };
}

function buildTextDeltaEvent(index: number, text: string): StreamEvent {
  return {
    type: 'content_block_delta',
    index,
    delta: { type: 'text_delta', text },
  };
}

function buildInputJsonDeltaEvent(
  index: number,
  partialJson: string
): StreamEvent {
  return {
    type: 'content_block_delta',
    index,
    delta: { type: 'input_json_delta', partial_json: partialJson },
  };
}

function buildContentBlockStopEvent(index: number): StreamEvent {
  return {
    type: 'content_block_stop',
    index,
  };
}

function buildMessageDeltaEvent(config: {
  stopReason: string;
  outputTokens: number;
}): StreamEvent {
  return {
    type: 'message_delta',
    delta: { stop_reason: config.stopReason, stop_sequence: null },
    usage: { output_tokens: config.outputTokens },
  };
}

function buildMessageStopEvent(): StreamEvent {
  return { type: 'message_stop' };
}

// =============================================================================
// Mock Factories
// =============================================================================

let toolUseIdCounter = 0;

function generateToolUseId(): string {
  toolUseIdCounter += 1;
  return `toolu_test_${toolUseIdCounter.toString().padStart(4, '0')}`;
}

/**
 * Create a mock async iterable that yields streaming events for a text response.
 *
 * Simulates the Anthropic streaming API by yielding events in order:
 * message_start -> content_block_start -> text deltas -> content_block_stop -> message_delta -> message_stop
 */
export function mockAnthropicStream(config: StreamTextConfig): AsyncIterable<StreamEvent> {
  const {
    textChunks,
    inputTokens = 100,
    outputTokens = 50,
    stopReason = 'end_turn',
    model = 'claude-sonnet-4-20250514',
  } = config;

  const messageId = `msg_test_${Date.now()}`;

  const events: StreamEvent[] = [
    buildMessageStartEvent({ id: messageId, model, inputTokens }),
    buildContentBlockStartEvent(0, { type: 'text', text: '' }),
    ...textChunks.map((chunk) => buildTextDeltaEvent(0, chunk)),
    buildContentBlockStopEvent(0),
    buildMessageDeltaEvent({ stopReason, outputTokens }),
    buildMessageStopEvent(),
  ];

  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event;
      }
    },
  };
}

/**
 * Create a mock async iterable that yields streaming events including tool_use blocks.
 *
 * Useful for testing tool invocation responses from the Anthropic API.
 */
export function mockAnthropicToolStream(config: {
  textChunks?: string[];
  toolUse: ToolUseConfig;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
}): AsyncIterable<StreamEvent> {
  const {
    textChunks = [],
    toolUse,
    inputTokens = 100,
    outputTokens = 75,
    model = 'claude-sonnet-4-20250514',
  } = config;

  const messageId = `msg_test_${Date.now()}`;
  const toolId = toolUse.id ?? generateToolUseId();
  const toolBlock: ToolUseBlock = {
    type: 'tool_use',
    id: toolId,
    name: toolUse.name,
    input: toolUse.input,
  };

  const events: StreamEvent[] = [
    buildMessageStartEvent({ id: messageId, model, inputTokens }),
  ];

  // Add text content blocks if provided
  if (textChunks.length > 0) {
    events.push(buildContentBlockStartEvent(0, { type: 'text', text: '' }));
    for (const chunk of textChunks) {
      events.push(buildTextDeltaEvent(0, chunk));
    }
    events.push(buildContentBlockStopEvent(0));
  }

  // Add tool_use block
  const toolIndex = textChunks.length > 0 ? 1 : 0;
  events.push(buildContentBlockStartEvent(toolIndex, toolBlock));
  events.push(buildInputJsonDeltaEvent(toolIndex, JSON.stringify(toolUse.input)));
  events.push(buildContentBlockStopEvent(toolIndex));

  events.push(buildMessageDeltaEvent({ stopReason: 'tool_use', outputTokens }));
  events.push(buildMessageStopEvent());

  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event;
      }
    },
  };
}

/**
 * Create a non-streaming mock message response.
 *
 * Useful for testing non-streaming API calls.
 */
export function mockAnthropicMessage(config: MessageConfig = {}): {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<TextBlock | ToolUseBlock>;
  model: string;
  stop_reason: string;
  usage: TokenUsage;
} {
  const {
    content = [{ type: 'text', text: 'Mock response from Claude' }],
    inputTokens = 100,
    outputTokens = 50,
    stopReason = 'end_turn',
    model = 'claude-sonnet-4-20250514',
    id = `msg_test_${Date.now()}`,
  } = config;

  return {
    id,
    type: 'message',
    role: 'assistant',
    content,
    model,
    stop_reason: stopReason,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
  };
}

/**
 * Build a tool_use content block for use in message configs.
 */
export function buildToolUseBlock(config: ToolUseConfig): ToolUseBlock {
  return {
    type: 'tool_use',
    id: config.id ?? generateToolUseId(),
    name: config.name,
    input: config.input,
  };
}

/**
 * Create a mock Anthropic client with spied methods.
 *
 * Usage:
 *   vi.mock('@anthropic-ai/sdk', () => ({
 *     default: vi.fn(() => createMockAnthropicClient()),
 *   }));
 */
export function createMockAnthropicClient(): {
  messages: {
    create: ReturnType<typeof vi.fn>;
    stream: ReturnType<typeof vi.fn>;
  };
} {
  return {
    messages: {
      create: vi.fn(),
      stream: vi.fn(),
    },
  };
}

/**
 * Reset the tool_use ID counter between tests.
 * Call this in afterEach if you need deterministic IDs.
 */
export function resetToolUseIdCounter(): void {
  toolUseIdCounter = 0;
}
