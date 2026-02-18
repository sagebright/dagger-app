/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Types for communication between the frontend, API server, and Claude.
 */

import type { DialsState, DialId, ReferencePoint } from './dials.js';

// =============================================================================
// Chat Messages
// =============================================================================

/**
 * Role of a message in the conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * A chat message in the conversation
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  /** Associated dial updates from this message */
  dialUpdates?: DialUpdate[];
  /** Inline widgets to render in the message */
  inlineWidgets?: InlineWidget[];
}

// =============================================================================
// Dial Updates
// =============================================================================

/**
 * Confidence level for dial suggestions
 */
export type DialConfidence = 'high' | 'medium' | 'low';

/**
 * A suggested or applied dial update
 */
export interface DialUpdate {
  dialId: DialId;
  value: unknown;
  confidence: DialConfidence;
  /** Human-readable reason for the suggestion */
  reason?: string;
}

// =============================================================================
// Inline Widgets
// =============================================================================

/**
 * Types of inline widgets that can be rendered in chat
 */
export type InlineWidgetType =
  | 'reference_cards'
  | 'number_stepper'
  | 'tier_select'
  | 'session_length'
  | 'spectrum_slider'
  | 'theme_chips';

/**
 * Base inline widget structure
 */
export interface InlineWidgetBase {
  type: InlineWidgetType;
  dialId: DialId;
}

/**
 * Reference cards widget for conceptual dials
 */
export interface ReferenceCardsWidget extends InlineWidgetBase {
  type: 'reference_cards';
  references: ReferencePoint[];
}

/**
 * Number stepper widget for numeric dials
 */
export interface NumberStepperWidget extends InlineWidgetBase {
  type: 'number_stepper';
  min: number;
  max: number;
  currentValue?: number;
}

/**
 * Tier select widget for party tier
 */
export interface TierSelectWidget extends InlineWidgetBase {
  type: 'tier_select';
  currentValue?: 1 | 2 | 3 | 4;
}

/**
 * Session length select widget
 */
export interface SessionLengthWidget extends InlineWidgetBase {
  type: 'session_length';
  currentValue?: string;
}

/**
 * Spectrum slider for conceptual dials
 */
export interface SpectrumSliderWidget extends InlineWidgetBase {
  type: 'spectrum_slider';
  leftLabel: string;
  rightLabel: string;
  currentValue?: number;
}

/**
 * Theme chips for multi-select themes
 */
export interface ThemeChipsWidget extends InlineWidgetBase {
  type: 'theme_chips';
  selectedThemes?: string[];
}

/**
 * Union type of all inline widgets
 */
export type InlineWidget =
  | ReferenceCardsWidget
  | NumberStepperWidget
  | TierSelectWidget
  | SessionLengthWidget
  | SpectrumSliderWidget
  | ThemeChipsWidget;

// =============================================================================
// MCP Tool: process_dial_input
// =============================================================================

/**
 * Input for the process_dial_input MCP tool
 */
export interface ProcessDialInput {
  /** The user's natural language message */
  userMessage: string;
  /** Current state of all dials */
  currentDials: Omit<DialsState, 'confirmedDials'> & { confirmedDials: DialId[] };
  /** Conversation history for context */
  conversationHistory: ChatMessage[];
  /** Which dial is currently being discussed (optional) */
  currentDialFocus?: DialId;
}

/**
 * Output from the process_dial_input MCP tool
 */
export interface ProcessDialOutput {
  /** The assistant's response message */
  assistantMessage: string;
  /** Suggested dial updates based on user input */
  dialUpdates?: DialUpdate[];
  /** Reference points to show the user */
  suggestedReferences?: ReferencePoint[];
  /** Next dial to focus on in conversation */
  nextDialFocus?: DialId;
  /** Inline widgets to render in the response */
  inlineWidgets?: InlineWidget[];
}

// =============================================================================
// WebSocket Events
// =============================================================================

/**
 * WebSocket event types for frontend → bridge communication
 */
export type ClientEventType = 'chat:user_message' | 'dial:update' | 'dial:confirm';

/**
 * WebSocket event types for bridge → frontend communication
 */
export type ServerEventType =
  | 'connected'
  | 'chat:assistant_start'
  | 'chat:assistant_chunk'
  | 'chat:assistant_complete'
  | 'dial:updated'
  | 'dial:suggestion'
  | 'error';

// -----------------------------------------------------------------------------
// Client Events (Frontend → Bridge)
// -----------------------------------------------------------------------------

/**
 * User sends a chat message
 */
export interface UserMessageEvent {
  type: 'chat:user_message';
  payload: {
    content: string;
    currentDials: Omit<DialsState, 'confirmedDials'> & { confirmedDials: DialId[] };
  };
}

/**
 * User manually updates a dial value
 */
export interface DialUpdateEvent {
  type: 'dial:update';
  payload: {
    dialId: DialId;
    value: unknown;
  };
}

/**
 * User confirms a dial suggestion
 */
export interface DialConfirmEvent {
  type: 'dial:confirm';
  payload: {
    dialId: DialId;
    accepted: boolean;
  };
}

/**
 * Union of all client events (dial events only - outline events in content.ts)
 */
export type ClientEvent = UserMessageEvent | DialUpdateEvent | DialConfirmEvent;

// Note: OutlineClientEvent union is defined in content.ts and should be used separately
// or combined with ClientEvent where outline events are needed

// -----------------------------------------------------------------------------
// Server Events (Bridge → Frontend)
// -----------------------------------------------------------------------------

/**
 * Connection established
 */
export interface ConnectedEvent {
  type: 'connected';
  payload: {
    message: string;
  };
}

/**
 * Assistant response starting (for streaming)
 */
export interface AssistantStartEvent {
  type: 'chat:assistant_start';
  payload: {
    messageId: string;
  };
}

/**
 * Streaming chunk of assistant response
 */
export interface AssistantChunkEvent {
  type: 'chat:assistant_chunk';
  payload: {
    messageId: string;
    chunk: string;
  };
}

/**
 * Assistant response complete
 */
export interface AssistantCompleteEvent {
  type: 'chat:assistant_complete';
  payload: {
    messageId: string;
    dialUpdates?: DialUpdate[];
    inlineWidgets?: InlineWidget[];
  };
}

/**
 * Dial value updated (confirmed)
 */
export interface DialUpdatedEvent {
  type: 'dial:updated';
  payload: {
    dialId: DialId;
    value: unknown;
    source: 'user' | 'assistant';
  };
}

/**
 * Dial suggestion from assistant
 */
export interface DialSuggestionEvent {
  type: 'dial:suggestion';
  payload: {
    dialId: DialId;
    value: unknown;
    confidence: DialConfidence;
    reason?: string;
  };
}

/**
 * Error event
 */
export interface ErrorEvent {
  type: 'error';
  payload: {
    code: string;
    message: string;
  };
}

/**
 * Union of all server events
 */
export type ServerEvent =
  | ConnectedEvent
  | AssistantStartEvent
  | AssistantChunkEvent
  | AssistantCompleteEvent
  | DialUpdatedEvent
  | DialSuggestionEvent
  | ErrorEvent;

// =============================================================================
// Conversation Context
// =============================================================================

/**
 * Conversation context for multi-turn dial tuning
 */
export interface ConversationContext {
  /** Unique session identifier */
  sessionId: string;
  /** Current phase in the workflow */
  currentPhase: 'dial-tuning';
  /** Messages in this conversation */
  messages: ChatMessage[];
  /** Current dial being discussed */
  currentDialFocus?: DialId;
  /** Order in which dials have been discussed */
  dialDiscussionOrder: DialId[];
  /** Dials that still need discussion */
  remainingDials: DialId[];
}

// =============================================================================
// API Types
// =============================================================================

/**
 * Request body for chat endpoint
 */
export interface ChatRequest {
  message: string;
  sessionId?: string;
  currentDials: Omit<DialsState, 'confirmedDials'> & { confirmedDials: DialId[] };
  conversationHistory?: ChatMessage[];
}

/**
 * Response from chat endpoint
 */
export interface ChatResponse {
  messageId: string;
  content: string;
  dialUpdates?: DialUpdate[];
  inlineWidgets?: InlineWidget[];
  nextDialFocus?: DialId;
}
