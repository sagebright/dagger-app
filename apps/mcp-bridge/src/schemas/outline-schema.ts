/**
 * Outline JSON Schema for Claude CLI
 *
 * This schema is used with Claude CLI's --json-schema flag to enforce
 * structured output during outline generation. The schema validates
 * the adventure outline structure including title, summary, and scenes.
 */

// =============================================================================
// Scene Type Enum
// =============================================================================

/**
 * Valid scene types for adventure outlines
 */
export const SCENE_TYPES = [
  'combat',
  'exploration',
  'social',
  'puzzle',
  'revelation',
  'mixed',
] as const;

export type SceneType = (typeof SCENE_TYPES)[number];

// =============================================================================
// JSON Schema Definition
// =============================================================================

/**
 * JSON Schema for adventure outline generation.
 * Used with Claude CLI's --json-schema flag to enforce output structure.
 *
 * Matches the GenerateOutlineOutput type structure:
 * - title: Adventure title
 * - summary: Brief adventure summary
 * - scenes: Array of scene briefs
 */
export const OUTLINE_JSON_SCHEMA = {
  type: 'object',
  required: ['title', 'summary', 'scenes'],
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      description: 'Compelling adventure title that captures the essence of the journey',
      minLength: 5,
      maxLength: 100,
    },
    summary: {
      type: 'string',
      description: 'Brief summary of the adventure arc (2-4 sentences)',
      minLength: 50,
      maxLength: 500,
    },
    scenes: {
      type: 'array',
      description: 'Array of scene briefs for the adventure',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        required: ['sceneNumber', 'title', 'description', 'sceneType'],
        additionalProperties: false,
        properties: {
          sceneNumber: {
            type: 'integer',
            description: 'Scene order number (1-indexed)',
            minimum: 1,
            maximum: 6,
          },
          title: {
            type: 'string',
            description: 'Evocative scene title',
            minLength: 3,
            maxLength: 80,
          },
          description: {
            type: 'string',
            description: 'Brief description of what happens in this scene',
            minLength: 20,
            maxLength: 300,
          },
          sceneType: {
            type: 'string',
            description: 'Primary scene type determining gameplay focus',
            enum: SCENE_TYPES,
          },
          keyElements: {
            type: 'array',
            description: 'Key moments or elements in the scene',
            items: {
              type: 'string',
              maxLength: 100,
            },
            maxItems: 5,
          },
          location: {
            type: 'string',
            description: 'Suggested location or environment for the scene',
            maxLength: 150,
          },
          characters: {
            type: 'array',
            description: 'NPCs or adversaries that may appear in this scene',
            items: {
              type: 'string',
              maxLength: 80,
            },
            maxItems: 5,
          },
        },
      },
    },
  },
} as const;

/**
 * Type representing the JSON schema structure for TypeScript type checking
 */
export type OutlineJsonSchema = typeof OUTLINE_JSON_SCHEMA;

// =============================================================================
// Schema Utilities
// =============================================================================

/**
 * Get the schema as a JSON string for CLI usage
 */
export function getOutlineSchemaJson(): string {
  return JSON.stringify(OUTLINE_JSON_SCHEMA);
}

/**
 * Validate that a scene type is valid
 */
export function isValidSceneType(type: string): type is SceneType {
  return SCENE_TYPES.includes(type as SceneType);
}
