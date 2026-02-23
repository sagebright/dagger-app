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

/** Frame selection confirmed via chat (sets active frame without replacing gallery) */
export interface PanelFrameSelectedEvent {
  type: 'panel:frame_selected';
  data: {
    frameId: string;
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
// Entity Panel Events (Inscribing Wave 2 & 3 entity data)
// =============================================================================

/** NPCs populated for a scene section */
export interface PanelEntityNPCsEvent {
  type: 'panel:entity_npcs';
  data: {
    sceneArcId: string;
    npcs: NPCCardData[];
  };
}

/** Adversaries populated for a scene section */
export interface PanelEntityAdversariesEvent {
  type: 'panel:entity_adversaries';
  data: {
    sceneArcId: string;
    adversaries: AdversaryCardData[];
  };
}

/** Items populated for a scene section */
export interface PanelEntityItemsEvent {
  type: 'panel:entity_items';
  data: {
    sceneArcId: string;
    items: ItemCardData[];
  };
}

/** Portent categories populated for a scene section */
export interface PanelEntityPortentsEvent {
  type: 'panel:entity_portents';
  data: {
    sceneArcId: string;
    categories: PortentCategoryData[];
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
  /** Optional entity data for Wave 2 / Wave 3 entity sections */
  entityNPCs?: NPCCardData[];
  entityAdversaries?: AdversaryCardData[];
  entityItems?: ItemCardData[];
  entityPortents?: PortentCategoryData[];
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

// =============================================================================
// Entity Card Data Types (Inscribing Wave 2 & 3)
// =============================================================================

/** NPC role for card color coding */
export type NPCCardRole =
  | 'ally'
  | 'neutral'
  | 'antagonist'
  | 'quest-giver'
  | 'bystander'
  | 'leader'
  | 'oracle'
  | 'scout'
  | 'informant';

/** Lightweight NPC data for entity cards in the accordion */
export interface NPCCardData {
  id: string;
  name: string;
  role: NPCCardRole;
  description: string;
  sceneAppearances: string[];
  isEnriched: boolean;
}

/** Full NPC detail data for drill-in view */
export interface NPCDetailData extends NPCCardData {
  backstory: string;
  voice: string;
  motivation: string;
  secret: string;
}

/** Adversary type for badge color coding */
export type AdversaryCardType =
  | 'bruiser'
  | 'minion'
  | 'leader'
  | 'solo'
  | 'skulk'
  | 'horde'
  | 'environment';

/** Lightweight adversary data for entity cards */
export interface AdversaryCardData {
  id: string;
  name: string;
  type: AdversaryCardType;
  difficulty: number;
  quantity: number;
  sceneAppearances: string[];
  stats: {
    hp: number;
    stress: number;
    attack: string;
    damage: string;
  };
}

/** Full adversary detail data for drill-in view */
export interface AdversaryDetailData extends AdversaryCardData {
  description: string;
  traits: string[];
  moves: Array<{ name: string; description: string }>;
}

/** Item category for type labels */
export type ItemCardCategory = 'weapon' | 'armor' | 'item' | 'consumable';

/** Lightweight item data for entity cards */
export interface ItemCardData {
  id: string;
  name: string;
  category: ItemCardCategory;
  tier: number;
  statLine: string;
  sceneAppearances: string[];
}

/** Portent category for accordion grouping */
export type PortentCategoryId =
  | 'items_clues'
  | 'environmental'
  | 'social'
  | 'magical'
  | 'future_threads';

/** A single portent entry with trigger/benefit/complication */
export interface PortentEntry {
  id: string;
  title: string;
  sceneBadge: string;
  trigger: string;
  benefit: string;
  complication: string;
}

/** Portent category card data for the accordion */
export interface PortentCategoryData {
  category: PortentCategoryId;
  label: string;
  entries: PortentEntry[];
}

/** Labels for portent categories */
export const PORTENT_CATEGORY_LABELS: Record<PortentCategoryId, string> = {
  items_clues: 'Items & Clues',
  environmental: 'Environmental Shifts',
  social: 'Social Openings',
  magical: 'Magical Effects',
  future_threads: 'Future Threads',
};

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
// Cross-Section Propagation Events
// =============================================================================

/** A section in a propagation update (deterministic or semantic) */
export interface PropagationSectionUpdate {
  sectionId: string;
  replacementCount: number;
}

/** Deterministic propagation completed (literal name replacements) */
export interface PanelPropagationDeterministicEvent {
  type: 'panel:propagation_deterministic';
  data: {
    sceneArcId: string;
    oldName: string;
    newName: string;
    updatedSections: PropagationSectionUpdate[];
    totalReplacements: number;
  };
}

/** Semantic propagation hint queued for LLM review */
export interface PanelPropagationSemanticEvent {
  type: 'panel:propagation_semantic';
  data: {
    sceneArcId: string;
    entityName: string;
    changeType: string;
    affectedSectionIds: string[];
    suggestedAction: string;
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
  | PanelFrameSelectedEvent
  | PanelSceneArcsEvent
  | PanelSceneArcEvent
  | PanelNameEvent
  | PanelSectionsEvent
  | PanelSectionEvent
  | PanelWave3InvalidatedEvent
  | PanelBalanceWarningEvent
  | PanelSceneConfirmedEvent
  | PanelEntityNPCsEvent
  | PanelEntityAdversariesEvent
  | PanelEntityItemsEvent
  | PanelEntityPortentsEvent
  | PanelPropagationDeterministicEvent
  | PanelPropagationSemanticEvent
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
  stage: string;
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
