/**
 * Content Generation Types
 *
 * Types for Phase 3+ content generation including:
 * - Frames (adventure framework selection/creation)
 * - Outlines (scene briefs)
 * - Scenes (full scene content)
 * - NPCs (compiled characters)
 */

import type { DaggerheartFrame, DaggerheartAdversary } from './database.js';

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
    pillarBalance: string | null;
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

// =============================================================================
// Scene Types (Phase 3.3)
// =============================================================================

/**
 * Extracted NPC from a scene
 */
export interface ExtractedNPC {
  /** NPC name */
  name: string;
  /** Role in the scene/story */
  role: string;
  /** Scene where NPC appears */
  sceneId: string;
  /** Optional description */
  description?: string;
}

/**
 * Extracted adversary from a scene
 */
export interface ExtractedAdversary {
  /** Adversary name */
  name: string;
  /** Type (minion, standard, solo, etc.) */
  type: string;
  /** Suggested tier */
  tier: number;
  /** Scene where adversary appears */
  sceneId: string;
  /** Optional notes */
  notes?: string;
}

/**
 * Extracted item from a scene
 */
export interface ExtractedItem {
  /** Item name */
  name: string;
  /** Suggested tier for the item */
  suggestedTier: number;
  /** Scene where item is found */
  sceneId: string;
  /** Optional description */
  description?: string;
}

/**
 * Key moment within a scene
 */
export interface KeyMoment {
  /** Moment title */
  title: string;
  /** Description of what happens */
  description: string;
}

/**
 * Full scene draft with all content sections
 */
export interface SceneDraft {
  /** Scene identifier */
  sceneId: string;
  /** Scene number (1-indexed) */
  sceneNumber: number;
  /** Scene title */
  title: string;
  /** Opening text/hook */
  introduction: string;
  /** Key moments/beats in the scene */
  keyMoments: KeyMoment[];
  /** How the scene concludes or transitions */
  resolution: string;
  /** GM guidance based on party tier */
  tierGuidance: string;
  /** Tone guidance notes */
  toneNotes?: string;
  /** Whether this is the climactic scene */
  isClimactic?: boolean;

  // Scene-type specific content
  /** Combat-specific notes (initiative, tactics) */
  combatNotes?: string;
  /** Environment description for exploration */
  environmentDetails?: string;
  /** Discovery opportunities in the scene */
  discoveryOpportunities?: string[];
  /** Social challenges and approaches */
  socialChallenges?: string;
  /** Puzzle mechanics and hints */
  puzzleDetails?: string;
  /** Major revelation content */
  revelationContent?: string;

  /** Entities extracted for later phases */
  extractedEntities: {
    npcs: ExtractedNPC[];
    adversaries: ExtractedAdversary[];
    items: ExtractedItem[];
  };
}

/**
 * Scene status in the workflow
 */
export type SceneStatus = 'pending' | 'generating' | 'draft' | 'confirmed';

/**
 * Full scene with workflow state
 */
export interface Scene {
  /** Scene brief from outline */
  brief: SceneBrief;
  /** Current draft (if generated) */
  draft: SceneDraft | null;
  /** Scene status */
  status: SceneStatus;
  /** When the scene was confirmed */
  confirmedAt?: string;
}

// =============================================================================
// MCP Tool: generate_scene_draft
// =============================================================================

/**
 * Input for the generate_scene_draft MCP tool
 */
export interface GenerateSceneInput {
  /** The scene brief to expand */
  sceneBrief: SceneBrief;
  /** The adventure frame for context */
  frame: SelectedFrame;
  /** The full outline for narrative continuity */
  outline: Outline;
  /** Current dial settings */
  dialsSummary: {
    partySize: number;
    partyTier: 1 | 2 | 3 | 4;
    sceneCount: number;
    sessionLength: string;
    tone: string | null;
    themes: string[];
    pillarBalance: string | null;
    lethality: string | null;
  };
  /** User feedback for revision */
  feedback?: string;
  /** Previous draft (if revising) */
  previousDraft?: SceneDraft;
}

/**
 * Output from the generate_scene_draft MCP tool
 */
export interface GenerateSceneOutput {
  /** The assistant's response message */
  assistantMessage: string;
  /** The generated scene draft */
  sceneDraft?: SceneDraft;
  /** Whether the draft is complete */
  isComplete: boolean;
  /** Follow-up questions if needed */
  followUpQuestion?: string;
}

// =============================================================================
// WebSocket Events for Scene
// =============================================================================

/**
 * WebSocket event types for scene generation (client → server)
 */
export type SceneClientEventType =
  | 'scene:generate'
  | 'scene:feedback'
  | 'scene:confirm'
  | 'scene:navigate';

/**
 * WebSocket event types for scene generation (server → client)
 */
export type SceneServerEventType =
  | 'scene:draft_start'
  | 'scene:draft_chunk'
  | 'scene:draft_complete'
  | 'scene:confirmed'
  | 'scene:error';

// -----------------------------------------------------------------------------
// Client Events (Frontend → Bridge)
// -----------------------------------------------------------------------------

/**
 * User requests scene generation
 */
export interface SceneGenerateEvent {
  type: 'scene:generate';
  payload: {
    sceneId: string;
    sceneBrief: SceneBrief;
    frame: SelectedFrame;
    outline: Outline;
    dialsSummary: GenerateSceneInput['dialsSummary'];
  };
}

/**
 * User provides feedback on scene draft
 */
export interface SceneFeedbackEvent {
  type: 'scene:feedback';
  payload: {
    sceneId: string;
    feedback: string;
    currentDraft: SceneDraft;
  };
}

/**
 * User confirms scene draft
 */
export interface SceneConfirmEvent {
  type: 'scene:confirm';
  payload: {
    sceneId: string;
    sceneDraft: SceneDraft;
  };
}

/**
 * User navigates between scenes
 */
export interface SceneNavigateEvent {
  type: 'scene:navigate';
  payload: {
    targetSceneId: string;
    direction: 'next' | 'previous' | 'direct';
  };
}

/**
 * Union of all scene client events
 */
export type SceneClientEvent =
  | SceneGenerateEvent
  | SceneFeedbackEvent
  | SceneConfirmEvent
  | SceneNavigateEvent;

// -----------------------------------------------------------------------------
// Server Events (Bridge → Frontend)
// -----------------------------------------------------------------------------

/**
 * Scene generation starting
 */
export interface SceneDraftStartEvent {
  type: 'scene:draft_start';
  payload: {
    sceneId: string;
    messageId: string;
  };
}

/**
 * Streaming chunk of scene content
 */
export interface SceneDraftChunkEvent {
  type: 'scene:draft_chunk';
  payload: {
    sceneId: string;
    messageId: string;
    chunk: string;
  };
}

/**
 * Scene generation complete
 */
export interface SceneDraftCompleteEvent {
  type: 'scene:draft_complete';
  payload: {
    sceneId: string;
    messageId: string;
    sceneDraft?: SceneDraft;
    isComplete: boolean;
    followUpQuestion?: string;
  };
}

/**
 * Scene confirmed
 */
export interface SceneConfirmedEvent {
  type: 'scene:confirmed';
  payload: {
    sceneId: string;
    sceneDraft: SceneDraft;
  };
}

/**
 * Scene error
 */
export interface SceneErrorEvent {
  type: 'scene:error';
  payload: {
    sceneId: string;
    code: string;
    message: string;
  };
}

/**
 * Union of all scene server events
 */
export type SceneServerEvent =
  | SceneDraftStartEvent
  | SceneDraftChunkEvent
  | SceneDraftCompleteEvent
  | SceneConfirmedEvent
  | SceneErrorEvent;

// =============================================================================
// Scene API Types
// =============================================================================

/**
 * Request to generate a scene
 */
export interface GenerateSceneRequest {
  sceneId: string;
  sceneBrief: SceneBrief;
  frame: SelectedFrame;
  outline: Outline;
  dialsSummary: GenerateSceneInput['dialsSummary'];
  feedback?: string;
  previousDraft?: SceneDraft;
}

/**
 * Response from scene generation
 */
export interface GenerateSceneResponse {
  sceneId: string;
  messageId: string;
  content: string;
  sceneDraft?: SceneDraft;
  isComplete: boolean;
  followUpQuestion?: string;
}

// =============================================================================
// NPC Types (Phase 3.4)
// =============================================================================

/**
 * NPC role in the adventure
 */
export type NPCRole = 'ally' | 'neutral' | 'quest-giver' | 'antagonist' | 'bystander';

/**
 * A compiled NPC extracted from scenes and enriched with details
 */
export interface NPC {
  /** Unique identifier */
  id: string;
  /** NPC name */
  name: string;
  /** Role in the adventure */
  role: NPCRole;
  /** Brief description of the NPC */
  description: string;
  /** Physical appearance */
  appearance: string;
  /** Personality traits and behavior */
  personality: string;
  /** What drives this NPC */
  motivations: string[];
  /** Connections to other NPCs or story elements */
  connections: string[];
  /** Scene IDs where this NPC appears */
  sceneAppearances: string[];
}

/**
 * Extraction context for an NPC
 */
export interface NPCExtractionContext {
  /** Scene where NPC was found */
  sceneId: string;
  /** Context/excerpt where NPC was mentioned */
  context: string;
}

/**
 * Compiled NPC with metadata about extraction and confirmation
 */
export interface CompiledNPC extends NPC {
  /** Whether the NPC has been confirmed by the user */
  isConfirmed: boolean;
  /** Sources from which NPC was extracted */
  extractedFrom: NPCExtractionContext[];
  /** When NPC was first created */
  createdAt: string;
  /** When NPC was last updated */
  updatedAt: string;
}

// =============================================================================
// MCP Tool: compile_npcs
// =============================================================================

/**
 * Scene data for NPC compilation
 */
export interface SceneNPCData {
  sceneId: string;
  title: string;
  extractedNPCs: ExtractedNPC[];
}

/**
 * Input for the compile_npcs MCP tool
 */
export interface CompileNPCsInput {
  /** Scenes with extracted NPC data */
  scenes: SceneNPCData[];
  /** Adventure frame for context */
  frame: SelectedFrame;
  /** Dial settings for context */
  dialsSummary: {
    partySize: number;
    partyTier: 1 | 2 | 3 | 4;
    tone: string | null;
    themes: string[];
  };
  /** Optional user feedback for refinement */
  feedback?: string;
  /** Previous NPCs (if refining) */
  previousNPCs?: NPC[];
}

/**
 * Output from the compile_npcs MCP tool
 */
export interface CompileNPCsOutput {
  /** The assistant's response message */
  assistantMessage: string;
  /** Compiled NPCs */
  npcs?: NPC[];
  /** Whether compilation is complete */
  isComplete: boolean;
  /** Follow-up question if more info needed */
  followUpQuestion?: string;
}

// =============================================================================
// WebSocket Events for NPC
// =============================================================================

/**
 * WebSocket event types for NPC compilation (client → server)
 */
export type NPCClientEventType = 'npc:compile' | 'npc:refine' | 'npc:confirm';

/**
 * WebSocket event types for NPC compilation (server → client)
 */
export type NPCServerEventType =
  | 'npc:compile_start'
  | 'npc:compile_chunk'
  | 'npc:compile_complete'
  | 'npc:refined'
  | 'npc:confirmed'
  | 'npc:error';

// -----------------------------------------------------------------------------
// Client Events (Frontend → Bridge)
// -----------------------------------------------------------------------------

/**
 * User requests NPC compilation from confirmed scenes
 */
export interface NPCCompileEvent {
  type: 'npc:compile';
  payload: {
    sceneIds: string[];
  };
}

/**
 * User requests refinement of a specific NPC
 */
export interface NPCRefineEvent {
  type: 'npc:refine';
  payload: {
    npcId: string;
    feedback: string;
  };
}

/**
 * User confirms an NPC
 */
export interface NPCConfirmEvent {
  type: 'npc:confirm';
  payload: {
    npcId: string;
  };
}

/**
 * Union of all NPC client events
 */
export type NPCClientEvent = NPCCompileEvent | NPCRefineEvent | NPCConfirmEvent;

// -----------------------------------------------------------------------------
// Server Events (Bridge → Frontend)
// -----------------------------------------------------------------------------

/**
 * NPC compilation starting
 */
export interface NPCCompileStartEvent {
  type: 'npc:compile_start';
  payload: {
    messageId: string;
    totalScenes: number;
  };
}

/**
 * Streaming chunk of NPC compilation
 */
export interface NPCCompileChunkEvent {
  type: 'npc:compile_chunk';
  payload: {
    messageId: string;
    chunk: string;
  };
}

/**
 * NPC compilation complete
 */
export interface NPCCompileCompleteEvent {
  type: 'npc:compile_complete';
  payload: {
    messageId: string;
    npcs?: NPC[];
    isComplete: boolean;
    followUpQuestion?: string;
  };
}

/**
 * NPC refined after feedback
 */
export interface NPCRefinedEvent {
  type: 'npc:refined';
  payload: {
    npc: NPC;
  };
}

/**
 * NPC confirmed
 */
export interface NPCConfirmedEvent {
  type: 'npc:confirmed';
  payload: {
    npcId: string;
  };
}

/**
 * NPC error
 */
export interface NPCErrorEvent {
  type: 'npc:error';
  payload: {
    code: string;
    message: string;
  };
}

/**
 * Union of all NPC server events
 */
export type NPCServerEvent =
  | NPCCompileStartEvent
  | NPCCompileChunkEvent
  | NPCCompileCompleteEvent
  | NPCRefinedEvent
  | NPCConfirmedEvent
  | NPCErrorEvent;

// =============================================================================
// NPC API Types
// =============================================================================

/**
 * Request to compile NPCs from scenes
 */
export interface CompileNPCsRequest {
  sceneIds: string[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Response from NPC compilation
 */
export interface CompileNPCsResponse {
  messageId: string;
  content: string;
  npcs?: NPC[];
  isComplete: boolean;
  followUpQuestion?: string;
}

// =============================================================================
// Adversary Types (Phase 4.1)
// =============================================================================

/**
 * A selected adversary for the adventure with assignment metadata
 */
export interface SelectedAdversary {
  /** The adversary from the database */
  adversary: DaggerheartAdversary;
  /** Number of this adversary to include */
  quantity: number;
  /** Scene IDs where this adversary appears (optional) */
  assignedScenes?: string[];
  /** GM notes for this adversary */
  notes?: string;
}

/**
 * Filter options for adversary queries
 */
export interface AdversaryFilterOptions {
  /** Filter by tier (1-4) */
  tier?: number;
  /** Filter by type (beast, humanoid, undead, etc.) */
  type?: string;
  /** Search by name */
  searchTerm?: string;
}

// =============================================================================
// WebSocket Events for Adversary
// =============================================================================

/**
 * WebSocket event types for adversary selection (client -> server)
 */
export type AdversaryClientEventType =
  | 'adversary:load'
  | 'adversary:select'
  | 'adversary:deselect'
  | 'adversary:update_quantity'
  | 'adversary:confirm';

/**
 * WebSocket event types for adversary selection (server -> client)
 */
export type AdversaryServerEventType =
  | 'adversary:loaded'
  | 'adversary:selected'
  | 'adversary:deselected'
  | 'adversary:confirmed'
  | 'adversary:error';

// -----------------------------------------------------------------------------
// Client Events (Frontend -> Bridge)
// -----------------------------------------------------------------------------

/**
 * User requests adversaries to be loaded
 */
export interface AdversaryLoadEvent {
  type: 'adversary:load';
  payload: {
    filters: AdversaryFilterOptions;
  };
}

/**
 * User selects an adversary
 */
export interface AdversarySelectEvent {
  type: 'adversary:select';
  payload: {
    adversaryId: string;
    quantity?: number;
  };
}

/**
 * User deselects an adversary
 */
export interface AdversaryDeselectEvent {
  type: 'adversary:deselect';
  payload: {
    adversaryId: string;
  };
}

/**
 * User updates quantity for selected adversary
 */
export interface AdversaryUpdateQuantityEvent {
  type: 'adversary:update_quantity';
  payload: {
    adversaryId: string;
    quantity: number;
  };
}

/**
 * User confirms all selected adversaries
 */
export interface AdversaryConfirmEvent {
  type: 'adversary:confirm';
  payload: {
    selections: SelectedAdversary[];
  };
}

/**
 * Union of all adversary client events
 */
export type AdversaryClientEvent =
  | AdversaryLoadEvent
  | AdversarySelectEvent
  | AdversaryDeselectEvent
  | AdversaryUpdateQuantityEvent
  | AdversaryConfirmEvent;

// -----------------------------------------------------------------------------
// Server Events (Bridge -> Frontend)
// -----------------------------------------------------------------------------

/**
 * Adversaries loaded from database
 */
export interface AdversaryLoadedEvent {
  type: 'adversary:loaded';
  payload: {
    adversaries: DaggerheartAdversary[];
    availableTypes: string[];
  };
}

/**
 * Adversary selected
 */
export interface AdversarySelectedEvent {
  type: 'adversary:selected';
  payload: {
    adversaryId: string;
    quantity: number;
  };
}

/**
 * Adversary deselected
 */
export interface AdversaryDeselectedEvent {
  type: 'adversary:deselected';
  payload: {
    adversaryId: string;
  };
}

/**
 * Adversaries confirmed
 */
export interface AdversaryConfirmedEvent {
  type: 'adversary:confirmed';
  payload: {
    selections: SelectedAdversary[];
  };
}

/**
 * Adversary error
 */
export interface AdversaryErrorEvent {
  type: 'adversary:error';
  payload: {
    code: string;
    message: string;
  };
}

/**
 * Union of all adversary server events
 */
export type AdversaryServerEvent =
  | AdversaryLoadedEvent
  | AdversarySelectedEvent
  | AdversaryDeselectedEvent
  | AdversaryConfirmedEvent
  | AdversaryErrorEvent;

// =============================================================================
// Adversary API Types
// =============================================================================

/**
 * Request to get adversaries
 */
export interface GetAdversariesRequest {
  tier?: number;
  type?: string;
  limit?: number;
}

/**
 * Response with adversaries list
 */
export interface GetAdversariesResponse {
  adversaries: DaggerheartAdversary[];
  availableTypes: string[];
}

/**
 * Response with adversary types
 */
export interface GetAdversaryTypesResponse {
  types: string[];
}

// =============================================================================
// Item Types (Phase 4.2)
// =============================================================================

import type {
  DaggerheartItem,
  DaggerheartWeapon,
  DaggerheartArmor,
  DaggerheartConsumable,
} from './database.js';

/**
 * Unified item category for display
 */
export type ItemCategory = 'item' | 'weapon' | 'armor' | 'consumable';

/**
 * Unified item type combining all item categories
 * Uses discriminated union pattern for type safety
 */
export type UnifiedItem =
  | { category: 'item'; data: DaggerheartItem }
  | { category: 'weapon'; data: DaggerheartWeapon }
  | { category: 'armor'; data: DaggerheartArmor }
  | { category: 'consumable'; data: DaggerheartConsumable };

/**
 * A selected item for the adventure with assignment metadata
 */
export interface SelectedItem {
  /** The unified item */
  item: UnifiedItem;
  /** Number of this item to include */
  quantity: number;
  /** Scene IDs where this item appears (optional) */
  assignedScenes?: string[];
  /** GM notes for this item */
  notes?: string;
}

/**
 * Filter options for item queries
 */
export interface ItemFilterOptions {
  /** Filter by tier (1-4) - only applies to weapons/armor */
  tier?: number;
  /** Filter by category */
  category?: ItemCategory;
  /** Search by name */
  searchTerm?: string;
}

// =============================================================================
// WebSocket Events for Item
// =============================================================================

/**
 * WebSocket event types for item selection (client -> server)
 */
export type ItemClientEventType =
  | 'item:load'
  | 'item:select'
  | 'item:deselect'
  | 'item:update_quantity'
  | 'item:confirm';

/**
 * WebSocket event types for item selection (server -> client)
 */
export type ItemServerEventType =
  | 'item:loaded'
  | 'item:selected'
  | 'item:deselected'
  | 'item:confirmed'
  | 'item:error';

// -----------------------------------------------------------------------------
// Client Events (Frontend -> Bridge)
// -----------------------------------------------------------------------------

/**
 * User requests items to be loaded
 */
export interface ItemLoadEvent {
  type: 'item:load';
  payload: {
    filters: ItemFilterOptions;
  };
}

/**
 * User selects an item
 */
export interface ItemSelectEvent {
  type: 'item:select';
  payload: {
    itemId: string;
    category: ItemCategory;
    quantity?: number;
  };
}

/**
 * User deselects an item
 */
export interface ItemDeselectEvent {
  type: 'item:deselect';
  payload: {
    itemId: string;
    category: ItemCategory;
  };
}

/**
 * User updates quantity for selected item
 */
export interface ItemUpdateQuantityEvent {
  type: 'item:update_quantity';
  payload: {
    itemId: string;
    category: ItemCategory;
    quantity: number;
  };
}

/**
 * User confirms all selected items
 */
export interface ItemConfirmEvent {
  type: 'item:confirm';
  payload: {
    selections: SelectedItem[];
  };
}

/**
 * Union of all item client events
 */
export type ItemClientEvent =
  | ItemLoadEvent
  | ItemSelectEvent
  | ItemDeselectEvent
  | ItemUpdateQuantityEvent
  | ItemConfirmEvent;

// -----------------------------------------------------------------------------
// Server Events (Bridge -> Frontend)
// -----------------------------------------------------------------------------

/**
 * Items loaded from database
 */
export interface ItemLoadedEvent {
  type: 'item:loaded';
  payload: {
    items: UnifiedItem[];
    availableCategories: ItemCategory[];
  };
}

/**
 * Item selected
 */
export interface ItemSelectedEvent {
  type: 'item:selected';
  payload: {
    itemId: string;
    category: ItemCategory;
    quantity: number;
  };
}

/**
 * Item deselected
 */
export interface ItemDeselectedEvent {
  type: 'item:deselected';
  payload: {
    itemId: string;
    category: ItemCategory;
  };
}

/**
 * Items confirmed
 */
export interface ItemConfirmedEvent {
  type: 'item:confirmed';
  payload: {
    selections: SelectedItem[];
  };
}

/**
 * Item error
 */
export interface ItemErrorEvent {
  type: 'item:error';
  payload: {
    code: string;
    message: string;
  };
}

/**
 * Union of all item server events
 */
export type ItemServerEvent =
  | ItemLoadedEvent
  | ItemSelectedEvent
  | ItemDeselectedEvent
  | ItemConfirmedEvent
  | ItemErrorEvent;

// =============================================================================
// Item API Types
// =============================================================================

/**
 * Request to get items
 */
export interface GetItemsRequest {
  tier?: number;
  category?: ItemCategory;
  limit?: number;
}

/**
 * Response with unified items list
 */
export interface GetItemsResponse {
  items: UnifiedItem[];
  availableCategories: ItemCategory[];
}

// =============================================================================
// Echo Types (Phase 4.3)
// =============================================================================

/**
 * The five categories of GM creativity tools
 */
export type EchoCategory = 'complications' | 'rumors' | 'discoveries' | 'intrusions' | 'wonders';

/**
 * An individual echo/prompt for GMs
 */
export interface Echo {
  /** Unique identifier */
  id: string;
  /** Echo category */
  category: EchoCategory;
  /** Short descriptive title */
  title: string;
  /** Full echo content/description */
  content: string;
  /** Optional tags for filtering */
  tags?: string[];
  /** Whether the echo has been confirmed */
  isConfirmed: boolean;
  /** When the echo was created */
  createdAt: string;
}

// =============================================================================
// MCP Tool: generate_echoes
// =============================================================================

/**
 * Input for the generate_echoes MCP tool
 */
export interface GenerateEchoesInput {
  /** Adventure frame for context */
  frame: SelectedFrame;
  /** The adventure outline */
  outline: Outline;
  /** Compiled NPCs for reference */
  npcs: NPC[];
  /** Dial settings for context */
  dialsSummary: {
    partySize: number;
    partyTier: 1 | 2 | 3 | 4;
    tone: string | null;
    themes: string[];
  };
  /** Specific categories to generate (defaults to all) */
  categories?: EchoCategory[];
  /** Optional feedback for regeneration */
  feedback?: string;
}

/**
 * Output from the generate_echoes MCP tool
 */
export interface GenerateEchoesOutput {
  /** The assistant's response message */
  assistantMessage: string;
  /** Generated echoes */
  echoes: Echo[];
  /** Whether generation is complete */
  isComplete: boolean;
  /** Follow-up question if needed */
  followUpQuestion?: string;
}

// =============================================================================
// WebSocket Events for Echo
// =============================================================================

/**
 * WebSocket event types for echo generation (client → server)
 */
export type EchoClientEventType =
  | 'echo:generate'
  | 'echo:edit'
  | 'echo:confirm'
  | 'echo:regenerate';

/**
 * WebSocket event types for echo generation (server → client)
 */
export type EchoServerEventType =
  | 'echo:generate_start'
  | 'echo:generate_chunk'
  | 'echo:generate_complete'
  | 'echo:updated'
  | 'echo:confirmed'
  | 'echo:error';

// -----------------------------------------------------------------------------
// Client Events (Frontend → Bridge)
// -----------------------------------------------------------------------------

/**
 * User requests echo generation
 */
export interface EchoGenerateEvent {
  type: 'echo:generate';
  payload: {
    categories?: EchoCategory[];
  };
}

/**
 * User edits an echo
 */
export interface EchoEditEvent {
  type: 'echo:edit';
  payload: {
    echoId: string;
    updates: Partial<Pick<Echo, 'title' | 'content' | 'tags'>>;
  };
}

/**
 * User confirms an echo
 */
export interface EchoConfirmEvent {
  type: 'echo:confirm';
  payload: {
    echoId: string;
  };
}

/**
 * User requests regeneration of a specific echo
 */
export interface EchoRegenerateEvent {
  type: 'echo:regenerate';
  payload: {
    echoId: string;
    feedback?: string;
  };
}

/**
 * Union of all echo client events
 */
export type EchoClientEvent =
  | EchoGenerateEvent
  | EchoEditEvent
  | EchoConfirmEvent
  | EchoRegenerateEvent;

// -----------------------------------------------------------------------------
// Server Events (Bridge → Frontend)
// -----------------------------------------------------------------------------

/**
 * Echo generation starting
 */
export interface EchoGenerateStartEvent {
  type: 'echo:generate_start';
  payload: {
    messageId: string;
    categories: EchoCategory[];
  };
}

/**
 * Streaming chunk of echo generation
 */
export interface EchoGenerateChunkEvent {
  type: 'echo:generate_chunk';
  payload: {
    messageId: string;
    chunk: string;
  };
}

/**
 * Echo generation complete
 */
export interface EchoGenerateCompleteEvent {
  type: 'echo:generate_complete';
  payload: {
    messageId: string;
    echoes: Echo[];
    isComplete: boolean;
    followUpQuestion?: string;
  };
}

/**
 * Echo updated after edit
 */
export interface EchoUpdatedEvent {
  type: 'echo:updated';
  payload: {
    echo: Echo;
  };
}

/**
 * Echo confirmed
 */
export interface EchoConfirmedEvent {
  type: 'echo:confirmed';
  payload: {
    echoId: string;
  };
}

/**
 * Echo error
 */
export interface EchoErrorEvent {
  type: 'echo:error';
  payload: {
    code: string;
    message: string;
  };
}

/**
 * Union of all echo server events
 */
export type EchoServerEvent =
  | EchoGenerateStartEvent
  | EchoGenerateChunkEvent
  | EchoGenerateCompleteEvent
  | EchoUpdatedEvent
  | EchoConfirmedEvent
  | EchoErrorEvent;

// =============================================================================
// Echo API Types
// =============================================================================

/**
 * Request to generate echoes
 */
export interface GenerateEchoesRequest {
  categories?: EchoCategory[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Response from echo generation
 */
export interface GenerateEchoesResponse {
  messageId: string;
  content: string;
  echoes: Echo[];
  isComplete: boolean;
  followUpQuestion?: string;
}
