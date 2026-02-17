/**
 * Sage Codex SSE Event Types
 *
 * Discriminated union for all Server-Sent Events emitted by the
 * POST /api/chat endpoint. Each event has a `type` field that
 * determines the shape of its `data` payload.
 *
 * Event categories:
 *   chat:*    - Streaming text from Claude
 *   tool:*    - Tool invocation lifecycle
 *   session:* - Session metadata updates
 *   error     - Error notification
 */

// =============================================================================
// Chat Events
// =============================================================================

/** Signals the start of a new assistant message */
export interface ChatStartEvent {
  type: 'chat:start';
  data: {
    messageId: string;
  };
}

/** A chunk of streaming text from the assistant */
export interface ChatDeltaEvent {
  type: 'chat:delta';
  data: {
    messageId: string;
    content: string;
  };
}

/** Signals the end of the assistant message */
export interface ChatEndEvent {
  type: 'chat:end';
  data: {
    messageId: string;
    inputTokens: number;
    outputTokens: number;
  };
}

// =============================================================================
// Tool Events
// =============================================================================

/** A tool invocation has started */
export interface ToolStartEvent {
  type: 'tool:start';
  data: {
    toolUseId: string;
    toolName: string;
    input: Record<string, unknown>;
  };
}

/** A tool invocation has completed */
export interface ToolEndEvent {
  type: 'tool:end';
  data: {
    toolUseId: string;
    toolName: string;
    result: unknown;
    isError: boolean;
  };
}

// =============================================================================
// Session Events
// =============================================================================

/** Session stage has been updated */
export interface SessionStageEvent {
  type: 'session:stage';
  data: {
    sessionId: string;
    stage: string;
  };
}

// =============================================================================
// Error Events
// =============================================================================

/** An error occurred during processing */
export interface SageErrorEvent {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}

// =============================================================================
// Discriminated Union
// =============================================================================

/** All possible SSE event types from the chat endpoint */
export type SageEvent =
  | ChatStartEvent
  | ChatDeltaEvent
  | ChatEndEvent
  | ToolStartEvent
  | ToolEndEvent
  | SessionStageEvent
  | SageErrorEvent;

/** Extract the event type string union */
export type SageEventType = SageEvent['type'];

// =============================================================================
// Tool Definition
// =============================================================================

/**
 * Defines a tool that can be invoked by Claude during conversation.
 *
 * Follows the Anthropic tool definition schema. The handler function
 * executes server-side when Claude invokes the tool.
 */
export interface ToolDefinition {
  /** Unique tool name (must match what Claude sees) */
  name: string;
  /** Human-readable description for Claude's context */
  description: string;
  /** JSON Schema describing the tool's input parameters */
  inputSchema: Record<string, unknown>;
}

// =============================================================================
// Chat Request / Response
// =============================================================================

/** Body for POST /api/chat (Sage Codex streaming endpoint) */
export interface SageChatRequest {
  /** The user's message content */
  message: string;
  /** The active session ID */
  sessionId: string;
}

/** A stored message record from sage_messages */
export interface SageMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls: Record<string, unknown>[] | null;
  token_count: number | null;
  created_at: string;
}

/** A token usage record from sage_usage */
export interface SageUsageRecord {
  id: string;
  session_id: string;
  message_id: string;
  input_tokens: number;
  output_tokens: number;
  model: string;
  created_at: string;
}
