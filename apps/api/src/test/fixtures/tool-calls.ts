/**
 * Sample Anthropic tool_use block fixtures for testing
 *
 * Provides realistic tool invocation objects for testing
 * how the API handles Claude's tool_use responses.
 */

// =============================================================================
// Types
// =============================================================================

interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface TextBlock {
  type: 'text';
  text: string;
}

type ContentBlock = TextBlock | ToolUseBlock;

// =============================================================================
// Tool Use Blocks
// =============================================================================

/** Tool call for generating a frame draft */
export const GENERATE_FRAME_TOOL_USE: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_fixture_frame_001',
  name: 'generate_frame_draft',
  input: {
    name: 'The Hollow Vigil',
    description: 'A cursed monastery adventure',
    themes: ['corruption', 'redemption'],
    typicalAdversaries: ['undead', 'cultist'],
    lore: 'Once a beacon of healing, now consumed by shadow.',
  },
};

/** Tool call for generating an outline */
export const GENERATE_OUTLINE_TOOL_USE: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_fixture_outline_001',
  name: 'generate_outline_draft',
  input: {
    title: 'The Hollow Vigil',
    sceneCount: 4,
    summary: 'An investigation into a corrupted monastery.',
  },
};

/** Tool call for generating a scene */
export const GENERATE_SCENE_TOOL_USE: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_fixture_scene_001',
  name: 'generate_scene_draft',
  input: {
    sceneNumber: 1,
    title: 'Arrival at the Monastery',
    sceneType: 'exploration',
  },
};

/** Tool call for compiling NPCs */
export const COMPILE_NPCS_TOOL_USE: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_fixture_npcs_001',
  name: 'compile_npcs',
  input: {
    sceneIds: ['scene-brief-001', 'scene-brief-002'],
  },
};

/** Tool call for querying adversaries */
export const QUERY_ADVERSARIES_TOOL_USE: ToolUseBlock = {
  type: 'tool_use',
  id: 'toolu_fixture_adversary_001',
  name: 'query_adversaries',
  input: {
    tier: 2,
    type: 'undead',
  },
};

// =============================================================================
// Complete Response Fixtures (text + tool_use)
// =============================================================================

/** Response with text followed by a tool call */
export const TEXT_WITH_TOOL_RESPONSE: ContentBlock[] = [
  {
    type: 'text',
    text: 'Let me generate a frame draft based on your description.',
  },
  GENERATE_FRAME_TOOL_USE,
];

/** Response with only text (no tool call) */
export const TEXT_ONLY_RESPONSE: ContentBlock[] = [
  {
    type: 'text',
    text: 'The adventure frame looks great! Would you like to proceed to outline generation?',
  },
];

/** Response with only a tool call (no text) */
export const TOOL_ONLY_RESPONSE: ContentBlock[] = [
  GENERATE_SCENE_TOOL_USE,
];

/** Response with multiple tool calls */
export const MULTI_TOOL_RESPONSE: ContentBlock[] = [
  {
    type: 'text',
    text: 'I will compile the NPCs and query matching adversaries.',
  },
  COMPILE_NPCS_TOOL_USE,
  QUERY_ADVERSARIES_TOOL_USE,
];

// =============================================================================
// Tool Result Fixtures
// =============================================================================

/** Successful tool result */
export const SUCCESSFUL_TOOL_RESULT = {
  type: 'tool_result' as const,
  tool_use_id: 'toolu_fixture_frame_001',
  content: JSON.stringify({
    success: true,
    frame: {
      name: 'The Hollow Vigil',
      description: 'A cursed monastery adventure',
    },
  }),
};

/** Failed tool result */
export const FAILED_TOOL_RESULT = {
  type: 'tool_result' as const,
  tool_use_id: 'toolu_fixture_frame_001',
  content: JSON.stringify({
    success: false,
    error: 'Frame generation failed: insufficient context',
  }),
  is_error: true,
};
