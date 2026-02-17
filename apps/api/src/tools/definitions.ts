/**
 * Tool definitions for each stage of the Sage Codex Unfolding
 *
 * Tools are grouped by availability:
 * - Universal tools: available in all stages
 * - Stage-specific tools: only available during their respective stage
 *
 * Each definition follows the Anthropic tool schema and is used by
 * the context-assembler to build the API request.
 */

import type { ToolDefinition } from '@dagger-app/shared-types';
import type { Stage } from '@dagger-app/shared-types';

// =============================================================================
// Universal Tools (available in all stages)
// =============================================================================

const SIGNAL_READY: ToolDefinition = {
  name: 'signal_ready',
  description:
    'Signal that the current stage is complete and the adventure is ready ' +
    'to advance to the next stage. Only call this when all required work ' +
    'for the current stage has been confirmed by the user.',
  inputSchema: {
    type: 'object',
    properties: {
      stage: {
        type: 'string',
        description: 'The current stage being completed',
        enum: ['invoking', 'attuning', 'binding', 'weaving', 'inscribing'],
      },
      summary: {
        type: 'string',
        description: 'Brief summary of what was accomplished in this stage',
      },
    },
    required: ['stage', 'summary'],
  },
};

const SUGGEST_ADVENTURE_NAME: ToolDefinition = {
  name: 'suggest_adventure_name',
  description:
    'Suggest or update the adventure name based on the current state of ' +
    'the conversation. Can be called at any stage when a fitting name emerges.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The suggested adventure name',
      },
      reason: {
        type: 'string',
        description: 'Why this name fits the adventure',
      },
    },
    required: ['name'],
  },
};

const UNIVERSAL_TOOLS: ToolDefinition[] = [SIGNAL_READY, SUGGEST_ADVENTURE_NAME];

// =============================================================================
// Invoking Tools
// =============================================================================

const SET_SPARK: ToolDefinition = {
  name: 'set_spark',
  description:
    'Capture the user\'s initial adventure vision (the "spark"). ' +
    'Call this once the user has shared enough context about what ' +
    'kind of adventure they want to create.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Working name for the adventure',
      },
      vision: {
        type: 'string',
        description: 'Summary of the user\'s vision for the adventure',
      },
    },
    required: ['name', 'vision'],
  },
};

const INVOKING_TOOLS: ToolDefinition[] = [SET_SPARK];

// =============================================================================
// Attuning Tools
// =============================================================================

const SET_COMPONENT: ToolDefinition = {
  name: 'set_component',
  description:
    'Set a single adventure component value during the Attuning stage. ' +
    'Components: span, scenes, members, tier, tenor, pillars, chorus, threads. ' +
    'Call this each time the user confirms a component selection.',
  inputSchema: {
    type: 'object',
    properties: {
      componentId: {
        type: 'string',
        description: 'The component identifier',
        enum: ['span', 'scenes', 'members', 'tier', 'tenor', 'pillars', 'chorus', 'threads'],
      },
      value: {
        description: 'The selected value (type depends on component)',
      },
      confirmed: {
        type: 'boolean',
        description: 'Whether the user has confirmed this selection',
      },
    },
    required: ['componentId', 'value'],
  },
};

const ATTUNING_TOOLS: ToolDefinition[] = [SET_COMPONENT];

// =============================================================================
// Binding Tools
// =============================================================================

const SELECT_FRAME: ToolDefinition = {
  name: 'select_frame',
  description:
    'Select an existing frame from the database or set a custom frame. ' +
    'Call this when the user has chosen their thematic framework.',
  inputSchema: {
    type: 'object',
    properties: {
      frameId: {
        type: 'string',
        description: 'Database frame ID (for existing frames)',
      },
      name: {
        type: 'string',
        description: 'Frame name',
      },
      description: {
        type: 'string',
        description: 'Frame description',
      },
      themes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Thematic elements',
      },
      typicalAdversaries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Typical adversary types',
      },
      lore: {
        type: 'string',
        description: 'Background lore',
      },
      isCustom: {
        type: 'boolean',
        description: 'Whether this is a user-created frame',
      },
    },
    required: ['name', 'description'],
  },
};

const QUERY_FRAMES: ToolDefinition = {
  name: 'query_frames',
  description:
    'Query the Daggerheart frames database to find frames matching ' +
    'the adventure\'s themes and components.',
  inputSchema: {
    type: 'object',
    properties: {
      themes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Theme keywords to search for',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default 5)',
      },
    },
  },
};

const BINDING_TOOLS: ToolDefinition[] = [SELECT_FRAME, QUERY_FRAMES];

// =============================================================================
// Weaving Tools
// =============================================================================

const SET_ALL_SCENE_ARCS: ToolDefinition = {
  name: 'set_all_scene_arcs',
  description:
    'Populate all scene arcs at once when entering the Weaving stage. ' +
    'Call this immediately upon entering Weaving to fill every scene tab ' +
    'in the panel with initial arc content.',
  inputSchema: {
    type: 'object',
    properties: {
      sceneArcs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sceneNumber: { type: 'number' },
            title: { type: 'string' },
            subtitle: { type: 'string' },
            description: { type: 'string' },
            keyElements: { type: 'array', items: { type: 'string' } },
            location: { type: 'string' },
            sceneType: {
              type: 'string',
              enum: ['exploration', 'social', 'combat', 'puzzle', 'mixed'],
            },
          },
          required: ['id', 'sceneNumber', 'title', 'description'],
        },
        description: 'The scene arc briefs (one per scene)',
      },
    },
    required: ['sceneArcs'],
  },
};

const SET_SCENE_ARC: ToolDefinition = {
  name: 'set_scene_arc',
  description:
    'Update a single scene arc during revision. Call this when the user ' +
    'requests changes to a specific scene and you have revised the arc.',
  inputSchema: {
    type: 'object',
    properties: {
      sceneIndex: {
        type: 'number',
        description: 'Zero-based index of the scene to update',
      },
      sceneArc: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sceneNumber: { type: 'number' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          description: { type: 'string' },
          keyElements: { type: 'array', items: { type: 'string' } },
          location: { type: 'string' },
          sceneType: {
            type: 'string',
            enum: ['exploration', 'social', 'combat', 'puzzle', 'mixed'],
          },
        },
        required: ['id', 'sceneNumber', 'title', 'description'],
        description: 'The updated scene arc',
      },
    },
    required: ['sceneIndex', 'sceneArc'],
  },
};

const REORDER_SCENES: ToolDefinition = {
  name: 'reorder_scenes',
  description:
    'Reorder the scene arcs. Call this when the user wants to change ' +
    'the sequence of scenes in the adventure outline.',
  inputSchema: {
    type: 'object',
    properties: {
      order: {
        type: 'array',
        items: { type: 'string' },
        description: 'Scene IDs in the desired order',
      },
    },
    required: ['order'],
  },
};

const WEAVING_TOOLS: ToolDefinition[] = [
  SET_ALL_SCENE_ARCS,
  SET_SCENE_ARC,
  REORDER_SCENES,
];

// =============================================================================
// Inscribing Tools
// =============================================================================

const UPDATE_SCENE_SECTION: ToolDefinition = {
  name: 'update_scene_section',
  description:
    'Update a single section of an inscribed scene. Sections: ' +
    'introduction, keyMoments, resolution, npcs, adversaries, ' +
    'items, portents, tierGuidance, toneNotes.',
  inputSchema: {
    type: 'object',
    properties: {
      sceneArcId: {
        type: 'string',
        description: 'The scene arc ID to update',
      },
      section: {
        type: 'string',
        description: 'Which section to update',
        enum: [
          'introduction', 'keyMoments', 'resolution',
          'npcs', 'adversaries', 'items',
          'portents', 'tierGuidance', 'toneNotes',
        ],
      },
      value: {
        description: 'The new section content (shape depends on section)',
      },
    },
    required: ['sceneArcId', 'section', 'value'],
  },
};

const CONFIRM_SCENE: ToolDefinition = {
  name: 'confirm_scene',
  description:
    'Mark an inscribed scene as confirmed after user approval. ' +
    'All 9 sections should be reviewed before confirming.',
  inputSchema: {
    type: 'object',
    properties: {
      sceneArcId: {
        type: 'string',
        description: 'The scene arc ID to confirm',
      },
    },
    required: ['sceneArcId'],
  },
};

const QUERY_ADVERSARIES: ToolDefinition = {
  name: 'query_adversaries',
  description:
    'Query the Daggerheart adversaries database for stat blocks ' +
    'matching the scene requirements.',
  inputSchema: {
    type: 'object',
    properties: {
      tier: {
        type: 'number',
        description: 'Character tier for difficulty matching',
      },
      type: {
        type: 'string',
        description: 'Adversary type filter (e.g., undead, beast)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default 5)',
      },
    },
  },
};

const QUERY_ITEMS: ToolDefinition = {
  name: 'query_items',
  description:
    'Query the Daggerheart items database for tier-appropriate rewards.',
  inputSchema: {
    type: 'object',
    properties: {
      tier: {
        type: 'number',
        description: 'Character tier for appropriateness matching',
      },
      category: {
        type: 'string',
        description: 'Item category filter (weapon, armor, consumable)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default 5)',
      },
    },
  },
};

const INSCRIBING_TOOLS: ToolDefinition[] = [
  UPDATE_SCENE_SECTION,
  CONFIRM_SCENE,
  QUERY_ADVERSARIES,
  QUERY_ITEMS,
];

// =============================================================================
// Delivering Tools
// =============================================================================

const FINALIZE_ADVENTURE: ToolDefinition = {
  name: 'finalize_adventure',
  description:
    'Mark the adventure as complete and ready for export. ' +
    'All scenes must be confirmed before finalizing.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Final adventure title',
      },
      summary: {
        type: 'string',
        description: 'Final adventure summary for the export header',
      },
    },
    required: ['title', 'summary'],
  },
};

const DELIVERING_TOOLS: ToolDefinition[] = [FINALIZE_ADVENTURE];

// =============================================================================
// Stage-to-Tools Mapping
// =============================================================================

const STAGE_TOOLS: Record<Stage, ToolDefinition[]> = {
  invoking: INVOKING_TOOLS,
  attuning: ATTUNING_TOOLS,
  binding: BINDING_TOOLS,
  weaving: WEAVING_TOOLS,
  inscribing: INSCRIBING_TOOLS,
  delivering: DELIVERING_TOOLS,
};

/**
 * Get all tool definitions available for a given stage.
 *
 * Returns universal tools + stage-specific tools.
 */
export function getToolsForStage(stage: Stage): ToolDefinition[] {
  const stageTools = STAGE_TOOLS[stage] ?? [];
  return [...UNIVERSAL_TOOLS, ...stageTools];
}

/**
 * Get only the universal tools (available in all stages).
 */
export function getUniversalTools(): ToolDefinition[] {
  return [...UNIVERSAL_TOOLS];
}

/**
 * Get tool names available for a given stage (for prompt context).
 */
export function getToolNamesForStage(stage: Stage): string[] {
  return getToolsForStage(stage).map((t) => t.name);
}
