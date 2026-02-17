/**
 * Tool call dispatcher for Sage Codex
 *
 * Receives parsed tool_use blocks from the stream parser and:
 * 1. Emits tool:start / tool:end SSE events
 * 2. Executes the tool handler (or returns a placeholder for unknown tools)
 * 3. Constructs Anthropic-format tool_result blocks for the next API turn
 *
 * This is the "basic" dispatcher from issue #145. Full tool implementations
 * (content generation, DB queries, etc.) come in later issues.
 */

import type { SageEvent } from '@dagger-app/shared-types';
import type { CollectedToolUse } from './stream-parser.js';

// =============================================================================
// Types
// =============================================================================

/** A tool result formatted for the Anthropic Messages API */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/** A tool handler function */
export type ToolHandler = (
  input: Record<string, unknown>
) => Promise<{ result: unknown; isError: boolean }>;

/** Result from dispatching all tool calls */
export interface DispatchResult {
  events: SageEvent[];
  toolResults: ToolResultBlock[];
}

// =============================================================================
// Tool Registry
// =============================================================================

const toolHandlers = new Map<string, ToolHandler>();

/**
 * Register a tool handler by name.
 *
 * Handlers are called when Claude invokes a tool with the matching name.
 */
export function registerToolHandler(
  name: string,
  handler: ToolHandler
): void {
  toolHandlers.set(name, handler);
}

/**
 * Clear all registered handlers (for testing).
 */
export function clearToolHandlers(): void {
  toolHandlers.clear();
}

// =============================================================================
// Dispatch
// =============================================================================

/**
 * Dispatch all collected tool_use blocks sequentially.
 *
 * For each tool call:
 * 1. Emit a tool:start event
 * 2. Execute the handler (or return "unknown tool" error)
 * 3. Emit a tool:end event
 * 4. Build a tool_result block for the next Anthropic turn
 *
 * Returns all events and tool results for the caller to send.
 */
export async function dispatchToolCalls(
  toolUseBlocks: CollectedToolUse[]
): Promise<DispatchResult> {
  const events: SageEvent[] = [];
  const toolResults: ToolResultBlock[] = [];

  for (const toolUse of toolUseBlocks) {
    events.push({
      type: 'tool:start',
      data: {
        toolUseId: toolUse.id,
        toolName: toolUse.name,
        input: toolUse.input,
      },
    });

    const { result, isError } = await executeToolHandler(toolUse);

    events.push({
      type: 'tool:end',
      data: {
        toolUseId: toolUse.id,
        toolName: toolUse.name,
        result,
        isError,
      },
    });

    toolResults.push({
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: typeof result === 'string' ? result : JSON.stringify(result),
      ...(isError && { is_error: true }),
    });
  }

  return { events, toolResults };
}

/**
 * Execute a single tool handler, catching any errors.
 */
async function executeToolHandler(
  toolUse: CollectedToolUse
): Promise<{ result: unknown; isError: boolean }> {
  const handler = toolHandlers.get(toolUse.name);

  if (!handler) {
    return {
      result: `Unknown tool: "${toolUse.name}". This tool is not yet implemented.`,
      isError: true,
    };
  }

  try {
    return await handler(toolUse.input);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Tool execution failed';
    return {
      result: `Tool "${toolUse.name}" failed: ${errorMessage}`,
      isError: true,
    };
  }
}
