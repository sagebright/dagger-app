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
// Panel Events (tool-driven UI updates)
// =============================================================================

/** Spark content has been set by the set_spark tool */
export interface PanelSparkEvent {
  type: 'panel:spark';
  data: {
    name: string;
    vision: string;
  };
}

/** A component selection has been set by the set_component tool */
export interface PanelComponentEvent {
  type: 'panel:component';
  data: {
    componentId: string;
    value: string | number | string[];
    confirmed: boolean;
  };
}

/** Frame gallery data populated by the query_frames / select_frame tools */
export interface PanelFramesEvent {
  type: 'panel:frames';
  data: {
    frames: FrameCardData[];
    activeFrameId: string | null;
  };
}

/** All scene arcs populated by set_all_scene_arcs tool (Weaving entry) */
export interface PanelSceneArcsEvent {
  type: 'panel:scene_arcs';
  data: {
    sceneArcs: SceneArcData[];
    activeSceneIndex: number;
  };
}

/** Single scene arc update by set_scene_arc tool (Weaving revision) */
export interface PanelSceneArcEvent {
  type: 'panel:scene_arc';
  data: {
    sceneIndex: number;
    sceneArc: SceneArcData;
    streaming: boolean;
  };
}

/** Adventure name suggestion from suggest_adventure_name tool */
export interface PanelNameEvent {
  type: 'panel:name';
  data: {
    name: string;
    reason?: string;
  };
}

/** Lightweight scene arc data for the Weaving panel */
export interface SceneArcData {
  id: string;
  sceneNumber: number;
  title: string;
  subtitle?: string;
  description: string;
  confirmed: boolean;
}

/** Lightweight frame data for gallery cards */
export interface FrameCardData {
  id: string;
  name: string;
  pitch: string;
  themes: string[];
  sections: FrameDetailSection[];
}

/** A collapsible section within the frame detail panel */
export interface FrameDetailSection {
  key: string;
  label: string;
  content: string;
  pills?: string[];
  expandedByDefault?: boolean;
}

// =============================================================================
// UI Events (stage readiness signals)
// =============================================================================

/** The current stage is ready for advancement */
export interface UIReadyEvent {
  type: 'ui:ready';
  data: {
    stage: string;
    summary: string;
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
  | PanelSparkEvent
  | PanelComponentEvent
  | PanelFramesEvent
  | PanelSceneArcsEvent
  | PanelSceneArcEvent
  | PanelNameEvent
  | UIReadyEvent
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
