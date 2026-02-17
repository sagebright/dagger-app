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

// =============================================================================
// Inscribing Panel Events
// =============================================================================

/** All 9 sections populated by set_wave tool (one wave at a time) */
export interface PanelSectionsEvent {
  type: 'panel:sections';
  data: {
    sceneArcId: string;
    wave: WaveNumber;
    sections: InscribingSectionData[];
  };
}

/** Single section update by update_section tool */
export interface PanelSectionEvent {
  type: 'panel:section';
  data: {
    sceneArcId: string;
    sectionId: InscribingSectionId;
    content: string;
    streaming: boolean;
  };
}

/** Wave 3 has been invalidated due to Wave 1-2 changes */
export interface PanelWave3InvalidatedEvent {
  type: 'panel:wave3_invalidated';
  data: {
    sceneArcId: string;
    reason: string;
  };
}

/** Game balance warning emitted by warn_balance tool */
export interface PanelBalanceWarningEvent {
  type: 'panel:balance_warning';
  data: {
    sceneArcId: string;
    message: string;
    sectionId?: InscribingSectionId;
  };
}

/** Scene confirmation event — all 9 sections locked */
export interface PanelSceneConfirmedEvent {
  type: 'panel:scene_confirmed';
  data: {
    sceneArcId: string;
  };
}

// =============================================================================
// Inscribing Data Types
// =============================================================================

/** Wave numbers for the 3-wave generation lifecycle */
export type WaveNumber = 1 | 2 | 3;

/** The 9 section identifiers for Inscribing */
export type InscribingSectionId =
  | 'overview'
  | 'setup'
  | 'developments'
  | 'npcs_present'
  | 'adversaries'
  | 'items'
  | 'transitions'
  | 'portents'
  | 'gm_notes';

/** Lightweight section data for the accordion panel */
export interface InscribingSectionData {
  id: InscribingSectionId;
  label: string;
  content: string;
  wave: WaveNumber;
  /** Whether this section has a drill-in detail view */
  hasDetail: boolean;
}

/** Wave groupings for the 9 sections */
export const WAVE_SECTIONS: Record<WaveNumber, InscribingSectionId[]> = {
  1: ['overview', 'setup', 'developments'],
  2: ['npcs_present', 'adversaries', 'items'],
  3: ['transitions', 'portents', 'gm_notes'],
};

/** Human-readable labels for each section */
export const SECTION_LABELS: Record<InscribingSectionId, string> = {
  overview: 'Overview',
  setup: 'Setup',
  developments: 'Developments',
  npcs_present: 'NPCs Present',
  adversaries: 'Adversaries',
  items: 'Items',
  transitions: 'Transitions',
  portents: 'Portents',
  gm_notes: 'GM Notes',
};

/** Sections that support narrative drill-in detail views */
export const NARRATIVE_SECTIONS: InscribingSectionId[] = [
  'setup',
  'developments',
  'transitions',
];

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
  | PanelSectionsEvent
  | PanelSectionEvent
  | PanelWave3InvalidatedEvent
  | PanelBalanceWarningEvent
  | PanelSceneConfirmedEvent
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
