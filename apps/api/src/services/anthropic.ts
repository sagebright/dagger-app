/**
 * Anthropic Messages API service for Sage Codex
 *
 * Wraps the Anthropic SDK to provide streaming message calls.
 * Returns the raw async iterable of stream events for the caller
 * (stream-parser.ts) to process into SSE events.
 *
 * Design decisions:
 * - Singleton client pattern (same as Supabase)
 * - System prompt is NOT sent from the frontend (security requirement)
 * - Model and max_tokens are configurable per call
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ToolDefinition } from '@sage-codex/shared-types';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;
const PLACEHOLDER_SYSTEM_PROMPT =
  'You are the Sage, keeper of the Codex — an AI guide for generating ' +
  'Daggerheart TTRPG adventures. Be helpful, creative, and thematically rich. ' +
  'Respond conversationally while staying focused on the adventure creation process.';

// =============================================================================
// Types
// =============================================================================

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

export type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string | AnthropicContentBlock[]; is_error?: boolean };

export interface StreamOptions {
  messages: AnthropicMessage[];
  tools?: ToolDefinition[];
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
}

// =============================================================================
// Client Singleton
// =============================================================================

let anthropicClient: Anthropic | null = null;

/**
 * Get or create the Anthropic client singleton.
 *
 * Requires ANTHROPIC_API_KEY to be set in the environment.
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Reset the client singleton (for testing).
 */
export function resetAnthropicClient(): void {
  anthropicClient = null;
}

// =============================================================================
// Streaming API
// =============================================================================

/**
 * Convert ToolDefinition[] to the Anthropic SDK tool format.
 */
function formatToolsForApi(
  tools: ToolDefinition[]
): Anthropic.Messages.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Messages.Tool.InputSchema,
  }));
}

/**
 * Create a streaming message request to the Anthropic Messages API.
 *
 * Returns an async iterable of raw stream events. The caller is
 * responsible for parsing these into application-level SSE events.
 */
export async function createStreamingMessage(
  options: StreamOptions
): Promise<AsyncIterable<Anthropic.MessageStreamEvent>> {
  const {
    messages,
    tools,
    systemPrompt = PLACEHOLDER_SYSTEM_PROMPT,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
  } = options;

  const client = getAnthropicClient();

  const requestParams: Anthropic.Messages.MessageCreateParamsStreaming = {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages as Anthropic.Messages.MessageParam[],
    stream: true,
  };

  if (tools && tools.length > 0) {
    requestParams.tools = formatToolsForApi(tools);
  }

  const stream = client.messages.stream(requestParams);

  return stream;
}
