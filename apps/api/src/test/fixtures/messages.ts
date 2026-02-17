/**
 * Sample chat message fixtures for testing
 *
 * Provides realistic message objects for testing chat endpoints,
 * conversation history, and streaming responses.
 */

// =============================================================================
// Types
// =============================================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// =============================================================================
// User Message Fixtures
// =============================================================================

/** Simple user greeting */
export const USER_GREETING: ChatMessage = {
  role: 'user',
  content: 'I want to create a dark fantasy adventure with themes of corruption and redemption.',
};

/** User providing dial tuning input */
export const USER_DIAL_INPUT: ChatMessage = {
  role: 'user',
  content: 'I think 4 players at tier 2 with 4 scenes would be perfect. The tone should be mysterious and tense.',
};

/** User requesting a frame */
export const USER_FRAME_REQUEST: ChatMessage = {
  role: 'user',
  content: 'I like the Hollow Vigil frame. Can you tell me more about it?',
};

/** User providing scene feedback */
export const USER_SCENE_FEEDBACK: ChatMessage = {
  role: 'user',
  content: 'The introduction is great, but I want more tension in the approach to the monastery. Maybe add some environmental hazards.',
};

/** User confirming content */
export const USER_CONFIRMATION: ChatMessage = {
  role: 'user',
  content: 'This looks perfect. Let\'s confirm it and move on.',
};

// =============================================================================
// Assistant Message Fixtures
// =============================================================================

/** Assistant welcome message */
export const ASSISTANT_WELCOME: ChatMessage = {
  role: 'assistant',
  content: 'Welcome, storyteller! I am the Sage, keeper of the Codex. Let us weave a tale together. Tell me about the adventure you envision.',
};

/** Assistant dial tuning response */
export const ASSISTANT_DIAL_RESPONSE: ChatMessage = {
  role: 'assistant',
  content: 'Excellent choices! A party of 4 at Tier 2 gives us room for meaningful combat encounters and social intrigue. With 4 scenes and a mysterious tone, we can build a satisfying arc of discovery and confrontation. Shall we discuss the pillar balance next?',
};

/** Long streaming response for chunk testing */
export const ASSISTANT_LONG_RESPONSE: ChatMessage = {
  role: 'assistant',
  content: 'The Hollow Vigil is a framework centered around a corrupted monastery perched atop a forgotten hill. Its bells still ring at midnight, calling to those brave enough to investigate. The adventure explores themes of faith tested by darkness, redemption for past failures, and the corruption that seeps into even the most sacred places. Players will navigate both physical dangers and moral dilemmas as they uncover the truth behind the monastery\'s fall.',
};

// =============================================================================
// Conversation History Fixtures
// =============================================================================

/** A short conversation about dial tuning */
export const DIAL_TUNING_CONVERSATION: ChatMessage[] = [
  ASSISTANT_WELCOME,
  USER_GREETING,
  ASSISTANT_DIAL_RESPONSE,
  USER_DIAL_INPUT,
];

/** A conversation about frame selection */
export const FRAME_SELECTION_CONVERSATION: ChatMessage[] = [
  ...DIAL_TUNING_CONVERSATION,
  {
    role: 'assistant',
    content: 'Now let us choose a frame for your adventure. I have several options that match your themes of corruption and redemption.',
  },
  USER_FRAME_REQUEST,
];

// =============================================================================
// Streaming Chunk Fixtures
// =============================================================================

/** Text chunks simulating a streaming response */
export const STREAMING_TEXT_CHUNKS = [
  'The ',
  'monastery ',
  'looms ahead, ',
  'its broken spires ',
  'reaching toward ',
  'a darkened sky. ',
  'No birds sing here.',
];

/** Text chunks for a tool-use prefixed response */
export const STREAMING_TOOL_PREFIX_CHUNKS = [
  'Let me ',
  'generate ',
  'the scene ',
  'for you...',
];
