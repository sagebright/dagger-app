/**
 * Content Generation Types
 *
 * Types for Phase 3+ content generation including:
 * - Frames (adventure framework selection/creation)
 * - Outlines (scene briefs)
 * - Scenes (full scene content)
 * - NPCs (compiled characters)
 */

import type { DaggerheartFrame } from './database.js';

// =============================================================================
// Frame Types
// =============================================================================

/**
 * A custom frame created through chat (not from Supabase)
 */
export interface FrameDraft {
  /** Client-generated ID for custom frames */
  id: string;
  name: string;
  description: string;
  themes: string[];
  typicalAdversaries: string[];
  lore: string;
  /** Marks this as a user-created frame vs DB frame */
  isCustom: true;
}

/**
 * Selected frame can be either from Supabase or custom
 */
export type SelectedFrame = DaggerheartFrame | FrameDraft;

/**
 * Type guard to check if a frame is custom
 */
export function isCustomFrame(frame: SelectedFrame): frame is FrameDraft {
  return 'isCustom' in frame && frame.isCustom === true;
}

// =============================================================================
// MCP Tool: generate_frame_draft
// =============================================================================

/**
 * Input for the generate_frame_draft MCP tool
 */
export interface GenerateFrameInput {
  /** The user's description/preferences for the custom frame */
  userMessage: string;
  /** Current dial settings for context */
  dialsSummary: {
    partySize: number;
    partyTier: 1 | 2 | 3 | 4;
    sceneCount: number;
    tone: string | null;
    themes: string[];
  };
  /** Existing frames for reference (avoid duplicates) */
  existingFrameNames?: string[];
}

/**
 * Output from the generate_frame_draft MCP tool
 */
export interface GenerateFrameOutput {
  /** The assistant's response message */
  assistantMessage: string;
  /** The generated frame draft (if successful) */
  frameDraft?: Omit<FrameDraft, 'id' | 'isCustom'>;
  /** Whether the draft is ready for confirmation */
  isComplete: boolean;
  /** Follow-up questions if more info needed */
  followUpQuestion?: string;
}

// =============================================================================
// WebSocket Events for Content
// =============================================================================

/**
 * WebSocket event types for content generation (client → server)
 */
export type ContentClientEventType =
  | 'content:frame_select'
  | 'content:frame_create'
  | 'content:frame_confirm';

/**
 * WebSocket event types for content generation (server → client)
 */
export type ContentServerEventType =
  | 'content:frames_loaded'
  | 'content:frame_draft_start'
  | 'content:frame_draft_chunk'
  | 'content:frame_draft_complete'
  | 'content:frame_confirmed';

// -----------------------------------------------------------------------------
// Client Events (Frontend → Bridge)
// -----------------------------------------------------------------------------

/**
 * User selects an existing frame from the database
 */
export interface FrameSelectEvent {
  type: 'content:frame_select';
  payload: {
    frameId: string;
  };
}

/**
 * User requests a custom frame via chat
 */
export interface FrameCreateEvent {
  type: 'content:frame_create';
  payload: {
    userMessage: string;
    dialsSummary: GenerateFrameInput['dialsSummary'];
  };
}

/**
 * User confirms the selected/created frame
 */
export interface FrameConfirmEvent {
  type: 'content:frame_confirm';
  payload: {
    frame: SelectedFrame;
  };
}

/**
 * Union of all content client events
 */
export type ContentClientEvent = FrameSelectEvent | FrameCreateEvent | FrameConfirmEvent;

// -----------------------------------------------------------------------------
// Server Events (Bridge → Frontend)
// -----------------------------------------------------------------------------

/**
 * Existing frames loaded from database
 */
export interface FramesLoadedEvent {
  type: 'content:frames_loaded';
  payload: {
    frames: DaggerheartFrame[];
  };
}

/**
 * Frame draft generation starting
 */
export interface FrameDraftStartEvent {
  type: 'content:frame_draft_start';
  payload: {
    messageId: string;
  };
}

/**
 * Streaming chunk of frame draft response
 */
export interface FrameDraftChunkEvent {
  type: 'content:frame_draft_chunk';
  payload: {
    messageId: string;
    chunk: string;
  };
}

/**
 * Frame draft generation complete
 */
export interface FrameDraftCompleteEvent {
  type: 'content:frame_draft_complete';
  payload: {
    messageId: string;
    frameDraft?: Omit<FrameDraft, 'id' | 'isCustom'>;
    isComplete: boolean;
    followUpQuestion?: string;
  };
}

/**
 * Frame confirmed and saved
 */
export interface FrameConfirmedEvent {
  type: 'content:frame_confirmed';
  payload: {
    frame: SelectedFrame;
  };
}

/**
 * Union of all content server events
 */
export type ContentServerEvent =
  | FramesLoadedEvent
  | FrameDraftStartEvent
  | FrameDraftChunkEvent
  | FrameDraftCompleteEvent
  | FrameConfirmedEvent;

// =============================================================================
// API Types
// =============================================================================

/**
 * Request to get all frames
 */
export interface GetFramesRequest {
  /** Optional theme filter */
  themes?: string[];
}

/**
 * Response with frames list
 */
export interface GetFramesResponse {
  frames: DaggerheartFrame[];
}

/**
 * Request to generate a custom frame
 */
export interface GenerateFrameRequest {
  userMessage: string;
  dialsSummary: GenerateFrameInput['dialsSummary'];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Response from frame generation
 */
export interface GenerateFrameResponse {
  messageId: string;
  content: string;
  frameDraft?: Omit<FrameDraft, 'id' | 'isCustom'>;
  isComplete: boolean;
  followUpQuestion?: string;
}

// =============================================================================
// Outline Types (Phase 3.2)
// =============================================================================

/**
 * A single scene brief in the adventure outline
 */
export interface SceneBrief {
  /** Unique identifier for this scene brief */
  id: string;
  /** Scene number/order (1-indexed) */
  sceneNumber: number;
  /** Compelling scene title */
  title: string;
  /** Brief description of what happens in this scene */
  description: string;
  /** Key elements/moments in the scene */
  keyElements: string[];
  /** Suggested location/environment */
  location?: string;
  /** Suggested adversaries or NPCs */
  characters?: string[];
  /** Scene type: combat, exploration, social, puzzle, etc */
  sceneType?: 'combat' | 'exploration' | 'social' | 'puzzle' | 'revelation' | 'mixed';
}

/**
 * The complete adventure outline
 */
export interface Outline {
  /** Unique identifier for this outline */
  id: string;
  /** Adventure title */
  title: string;
  /** Brief summary of the entire adventure arc */
  summary: string;
  /** The scene briefs (3-6 scenes based on sceneCount dial) */
  scenes: SceneBrief[];
  /** Whether the outline is a draft or confirmed */
  isConfirmed: boolean;
  /** Timestamp when outline was created */
  createdAt: string;
  /** Timestamp when outline was last updated */
  updatedAt: string;
}

/**
 * Type guard to check if outline is complete (has all scenes)
 */
export function isOutlineComplete(outline: Outline, expectedSceneCount: number): boolean {
  return outline.scenes.length === expectedSceneCount && outline.scenes.every((s) => s.title && s.description);
}

// =============================================================================
// MCP Tool: generate_outline_draft
// =============================================================================

/**
 * Input for the generate_outline_draft MCP tool
 */
export interface GenerateOutlineInput {
  /** The selected frame for context */
  frame: SelectedFrame;
  /** Current dial settings */
  dialsSummary: {
    partySize: number;
    partyTier: 1 | 2 | 3 | 4;
    sceneCount: number;
    sessionLength: string;
    tone: string | null;
    themes: string[];
    combatExplorationBalance: string | null;
    lethality: string | null;
  };
  /** Optional user feedback for regeneration */
  feedback?: string;
  /** Previous outline (if regenerating) */
  previousOutline?: Outline;
  /** Conversation history for context */
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Output from the generate_outline_draft MCP tool
 */
export interface GenerateOutlineOutput {
  /** The assistant's response message */
  assistantMessage: string;
  /** The generated outline (if successful) */
  outline?: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>;
  /** Whether the outline is ready for confirmation */
  isComplete: boolean;
  /** Follow-up questions if more info needed */
  followUpQuestion?: string;
}

// =============================================================================
// WebSocket Events for Outline
// =============================================================================

/**
 * WebSocket event types for outline generation (client → server)
 */
export type OutlineClientEventType =
  | 'outline:generate'
  | 'outline:feedback'
  | 'outline:confirm'
  | 'outline:edit_scene';

/**
 * WebSocket event types for outline generation (server → client)
 */
export type OutlineServerEventType =
  | 'outline:draft_start'
  | 'outline:draft_chunk'
  | 'outline:draft_complete'
  | 'outline:confirmed'
  | 'outline:error'
  | 'outline:scene_updated';

// -----------------------------------------------------------------------------
// Client Events (Frontend → Bridge)
// -----------------------------------------------------------------------------

/**
 * User requests outline generation
 */
export interface OutlineGenerateEvent {
  type: 'outline:generate';
  payload: {
    frame: SelectedFrame;
    dialsSummary: GenerateOutlineInput['dialsSummary'];
  };
}

/**
 * User provides feedback on the outline
 */
export interface OutlineFeedbackEvent {
  type: 'outline:feedback';
  payload: {
    feedback: string;
    currentOutline: Outline;
  };
}

/**
 * User confirms the outline
 */
export interface OutlineConfirmEvent {
  type: 'outline:confirm';
  payload: {
    outline: Outline;
  };
}

/**
 * User edits a specific scene brief
 */
export interface OutlineEditSceneEvent {
  type: 'outline:edit_scene';
  payload: {
    sceneId: string;
    updates: Partial<Omit<SceneBrief, 'id' | 'sceneNumber'>>;
  };
}

/**
 * Union of all outline client events
 */
export type OutlineClientEvent =
  | OutlineGenerateEvent
  | OutlineFeedbackEvent
  | OutlineConfirmEvent
  | OutlineEditSceneEvent;

// -----------------------------------------------------------------------------
// Server Events (Bridge → Frontend)
// -----------------------------------------------------------------------------

/**
 * Outline generation starting
 */
export interface OutlineDraftStartEvent {
  type: 'outline:draft_start';
  payload: {
    messageId: string;
  };
}

/**
 * Streaming chunk of outline response
 */
export interface OutlineDraftChunkEvent {
  type: 'outline:draft_chunk';
  payload: {
    messageId: string;
    chunk: string;
  };
}

/**
 * Outline generation complete
 */
export interface OutlineDraftCompleteEvent {
  type: 'outline:draft_complete';
  payload: {
    messageId: string;
    outline?: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>;
    isComplete: boolean;
    followUpQuestion?: string;
  };
}

/**
 * Outline confirmed
 */
export interface OutlineConfirmedEvent {
  type: 'outline:confirmed';
  payload: {
    outline: Outline;
  };
}

/**
 * Outline error
 */
export interface OutlineErrorEvent {
  type: 'outline:error';
  payload: {
    code: string;
    message: string;
  };
}

/**
 * Scene brief updated
 */
export interface OutlineSceneUpdatedEvent {
  type: 'outline:scene_updated';
  payload: {
    scene: SceneBrief;
  };
}

/**
 * Union of all outline server events
 */
export type OutlineServerEvent =
  | OutlineDraftStartEvent
  | OutlineDraftChunkEvent
  | OutlineDraftCompleteEvent
  | OutlineConfirmedEvent
  | OutlineErrorEvent
  | OutlineSceneUpdatedEvent;

// =============================================================================
// Outline API Types
// =============================================================================

/**
 * Request to generate an outline
 */
export interface GenerateOutlineRequest {
  frame: SelectedFrame;
  dialsSummary: GenerateOutlineInput['dialsSummary'];
  feedback?: string;
  previousOutline?: Outline;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Response from outline generation
 */
export interface GenerateOutlineResponse {
  messageId: string;
  content: string;
  outline?: Omit<Outline, 'id' | 'isConfirmed' | 'createdAt' | 'updatedAt'>;
  isComplete: boolean;
  followUpQuestion?: string;
}
