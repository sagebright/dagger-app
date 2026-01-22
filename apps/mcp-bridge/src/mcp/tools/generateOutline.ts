/**
 * generate_outline_draft MCP Tool
 *
 * Generates adventure outlines with scene briefs using Claude CLI.
 * Uses the outline schema and prompts for structured AI generation.
 */

import type {
  GenerateOutlineInput,
  GenerateOutlineOutput,
  SceneBrief,
} from '@dagger-app/shared-types';
import type { ToolSchema } from '../mcpServer.js';
import { checkClaudeAvailable, invokeClaudeCli } from '../../services/claude-cli.js';
import { buildOutlineSystemPrompt, buildOutlineUserPrompt } from '../../prompts/outline-generation.js';
import { getOutlineSchemaJson } from '../../schemas/outline-schema.js';

// =============================================================================
// Constants
// =============================================================================

const CLAUDE_CLI_TIMEOUT_MS = 90000;

// =============================================================================
// Tool Schema
// =============================================================================

export const GENERATE_OUTLINE_SCHEMA: ToolSchema = {
  description: 'Generate an adventure outline with scene briefs from frame and dials',
  inputSchema: {
    type: 'object',
    properties: {
      frame: {
        type: 'object',
        description: 'The selected adventure frame',
      },
      dialsSummary: {
        type: 'object',
        description: 'Current dial settings',
        properties: {
          partySize: { type: 'number' },
          partyTier: { type: 'number' },
          sceneCount: { type: 'number' },
          sessionLength: { type: 'string' },
          tone: { type: 'string' },
          themes: { type: 'array', items: { type: 'string' } },
          pillarBalance: { type: 'string' },
          lethality: { type: 'string' },
        },
      },
      feedback: {
        type: 'string',
        description: 'Optional user feedback for regeneration',
      },
      previousOutline: {
        type: 'object',
        description: 'Previous outline when regenerating based on feedback',
      },
    },
    required: ['frame', 'dialsSummary'],
  },
};

// =============================================================================
// Types
// =============================================================================

/**
 * Expected structure of Claude's JSON response for outline generation
 */
interface ClaudeOutlineResponse {
  title: string;
  summary: string;
  scenes: Array<{
    sceneNumber: number;
    title: string;
    description: string;
    sceneType: SceneBrief['sceneType'];
    keyElements?: string[];
    location?: string;
    characters?: string[];
  }>;
}

// =============================================================================
// Main Handler
// =============================================================================

/**
 * Generate outline with scene briefs using Claude CLI
 */
export async function generateOutlineHandler(
  input: GenerateOutlineInput
): Promise<GenerateOutlineOutput> {
  const { frame, dialsSummary, feedback, previousOutline } = input;
  const { sceneCount } = dialsSummary;

  // Validate scene count before proceeding
  if (sceneCount < 3 || sceneCount > 6) {
    return {
      assistantMessage: 'Scene count must be between 3 and 6. Please adjust the scene count dial.',
      isComplete: false,
      followUpQuestion: 'How many scenes would you like in this adventure (3-6)?',
    };
  }

  // Check Claude CLI availability
  const isClaudeAvailable = await checkClaudeAvailable();
  if (!isClaudeAvailable) {
    throw new Error('CLAUDE_NOT_AVAILABLE: Claude CLI is not installed or not accessible');
  }

  // Build prompts using the prompt builders
  const systemPrompt = buildOutlineSystemPrompt({
    frame,
    dialsSummary: {
      partySize: dialsSummary.partySize,
      partyTier: dialsSummary.partyTier as 1 | 2 | 3 | 4,
      sceneCount: dialsSummary.sceneCount,
      sessionLength: dialsSummary.sessionLength,
      tone: dialsSummary.tone,
      themes: dialsSummary.themes,
      pillarBalance: dialsSummary.pillarBalance,
      lethality: dialsSummary.lethality,
    },
  });

  const userPrompt = buildOutlineUserPrompt({
    dialsSummary: {
      partySize: dialsSummary.partySize,
      partyTier: dialsSummary.partyTier as 1 | 2 | 3 | 4,
      sceneCount: dialsSummary.sceneCount,
      sessionLength: dialsSummary.sessionLength,
      tone: dialsSummary.tone,
      themes: dialsSummary.themes,
      pillarBalance: dialsSummary.pillarBalance,
      lethality: dialsSummary.lethality,
    },
    feedback,
    previousOutline,
  });

  // Include JSON schema in the prompt for structured output
  const schemaJson = getOutlineSchemaJson();
  const promptWithSchema = `${userPrompt}\n\nYou MUST respond with valid JSON matching this schema:\n${schemaJson}`;

  // Invoke Claude CLI
  const result = await invokeClaudeCli({
    prompt: promptWithSchema,
    systemPrompt,
    timeout: CLAUDE_CLI_TIMEOUT_MS,
  });

  // Parse the response
  const outlineData = parseClaudeResponse(result.output, result.jsonResponse);

  // Build the outline draft
  const outlineDraft = {
    title: outlineData.title,
    summary: outlineData.summary,
    scenes: outlineData.scenes as SceneBrief[],
  };

  // Build response message
  const responseMessage = buildResponseMessage(outlineDraft, frame.name, !!feedback);

  return {
    assistantMessage: responseMessage,
    outline: outlineDraft,
    isComplete: true,
  };
}

// =============================================================================
// Response Parsing
// =============================================================================

/**
 * Parse Claude's response and extract outline data
 */
function parseClaudeResponse(
  rawOutput: string,
  jsonResponse?: Record<string, unknown>
): ClaudeOutlineResponse {
  // Try to use the pre-parsed JSON response first
  if (jsonResponse && isValidOutlineResponse(jsonResponse)) {
    return jsonResponse as unknown as ClaudeOutlineResponse;
  }

  // Try to parse raw output as JSON
  try {
    const parsed = JSON.parse(rawOutput);
    if (isValidOutlineResponse(parsed)) {
      return parsed;
    }
  } catch {
    // JSON parsing failed
  }

  // Try to extract JSON from the output (in case Claude wrapped it in text)
  const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (isValidOutlineResponse(parsed)) {
        return parsed;
      }
    } catch {
      // Extraction failed
    }
  }

  throw new Error('Failed to parse outline response: Invalid or missing JSON structure');
}

/**
 * Validate that the response has the required outline structure
 */
function isValidOutlineResponse(data: unknown): data is ClaudeOutlineResponse {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== 'string' || !obj.title) return false;
  if (typeof obj.summary !== 'string' || !obj.summary) return false;
  if (!Array.isArray(obj.scenes) || obj.scenes.length === 0) return false;

  // Validate each scene has required fields
  for (const scene of obj.scenes) {
    if (typeof scene !== 'object' || scene === null) return false;
    const s = scene as Record<string, unknown>;
    if (typeof s.sceneNumber !== 'number') return false;
    if (typeof s.title !== 'string' || !s.title) return false;
    if (typeof s.description !== 'string' || !s.description) return false;
    if (typeof s.sceneType !== 'string') return false;
  }

  return true;
}

// =============================================================================
// Response Message Building
// =============================================================================

/**
 * Build the assistant response message
 */
function buildResponseMessage(
  outline: { title: string; summary: string; scenes: SceneBrief[] },
  frameName: string,
  isRevision: boolean
): string {
  const sceneList = outline.scenes
    .map((s, i) => `${i + 1}. **${s.title}** (${s.sceneType}) - ${s.description}`)
    .join('\n');

  if (isRevision) {
    return `I've revised the outline based on your feedback. Here's the updated adventure structure:\n\n**${outline.title}**\n\n${sceneList}\n\nWould you like to make any other changes, or shall we proceed with this outline?`;
  }

  return `Here's your adventure outline based on the **${frameName}** frame:\n\n**${outline.title}**\n\n${outline.summary}\n\n${sceneList}\n\nReview the scenes and let me know if you'd like any changes, or confirm to proceed to scene writing.`;
}
