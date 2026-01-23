/**
 * Content routes for frame selection and generation
 *
 * Handles frame-related endpoints for Phase 3 content generation.
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type {
  GetFramesResponse,
  GenerateFrameRequest,
  GenerateFrameResponse,
  GenerateOutlineRequest,
  GenerateOutlineResponse,
  DaggerheartFrame,
  DaggerheartAdversary,
  GetAdversariesResponse,
  GetAdversaryTypesResponse,
  GetItemsResponse,
  ItemCategory,
  GenerateEchoesRequest,
  GenerateEchoesResponse,
  Echo,
  GenerateExampleRequest,
  GenerateExampleResponse,
  ExampleDialType,
} from '@dagger-app/shared-types';
import {
  TONE_OPTIONS,
  EMOTIONAL_REGISTER_OPTIONS,
} from '@dagger-app/shared-types';
import {
  getFrames,
  getFrameByName,
  getAdversaries,
  getAdversaryByName,
  getAdversaryTypes,
  getItems,
  getWeapons,
  getArmor,
  getConsumables,
} from '../services/daggerheart-queries.js';
import {
  parseTier,
  parseLimit,
  parseCategory,
  parseEchoCategories,
  findFirstError,
  buildUnifiedItems,
} from '../services/content-validation.js';
import { ECHO_TEMPLATES, ECHOES_PER_CATEGORY } from '../constants/echo-templates.js';
import { generateFrameHandler } from '../mcp/tools/generateFrame.js';
import { generateOutlineHandler } from '../mcp/tools/generateOutline.js';
import { generateAdventureName, type SuggestNameParams } from '../services/name-suggestion.js';
import { sendError, sendStructuredError } from './helpers.js';
import type { StructuredErrorResponse } from '@dagger-app/shared-types';
import { invokeClaudeCli } from '../services/claude-cli.js';

const router: RouterType = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /content/frames
 *
 * Get all available frames from Supabase.
 * Optionally filter by themes.
 */
router.get('/frames', async (req: Request, res: Response) => {
  try {
    const { themes } = req.query;
    const result = await getFrames();

    if (result.error) {
      sendError(res, 'DATABASE_ERROR', result.error);
      return;
    }

    let frames = result.data || [];

    // Filter by themes if provided
    if (themes) {
      const themesString = Array.isArray(themes) ? themes[0] : themes;
      if (typeof themesString === 'string') {
        const themeList = themesString.split(',').map((t) => t.trim().toLowerCase());
        frames = frames.filter((frame: DaggerheartFrame) =>
          frame.themes?.some((t: string) => themeList.includes(t.toLowerCase()))
        );
      }
    }

    const response: GetFramesResponse = { frames };
    res.json(response);
  } catch (error) {
    console.error('Error fetching frames:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch frames');
  }
});

/**
 * GET /content/frames/:name
 *
 * Get a specific frame by name.
 */
router.get('/frames/:name', async (req: Request, res: Response) => {
  try {
    const name = req.params.name as string;
    const result = await getFrameByName(name);

    if (result.error) {
      sendError(res, 'DATABASE_ERROR', result.error);
      return;
    }

    if (!result.data) {
      sendError(res, 'NOT_FOUND', `Frame not found: ${name}`, 404);
      return;
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching frame:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch frame');
  }
});

/**
 * POST /content/frame/generate
 *
 * Generate a custom frame from user description.
 */
router.post('/frame/generate', async (req: Request, res: Response) => {
  const body = req.body as Partial<GenerateFrameRequest>;

  // Validate request
  if (!body.userMessage || typeof body.userMessage !== 'string') {
    sendError(res, 'INVALID_REQUEST', 'userMessage is required', 400);
    return;
  }

  if (!body.dialsSummary || typeof body.dialsSummary !== 'object') {
    sendError(res, 'INVALID_REQUEST', 'dialsSummary is required', 400);
    return;
  }

  try {
    // Get existing frame names to avoid duplicates
    const framesResult = await getFrames();
    const existingFrameNames = framesResult.data?.map((f: DaggerheartFrame) => f.name) || [];

    // Process through the frame generation handler
    const result = await generateFrameHandler({
      userMessage: body.userMessage,
      dialsSummary: body.dialsSummary,
      existingFrameNames,
    });

    // Build response
    const response: GenerateFrameResponse = {
      messageId: uuidv4(),
      content: result.assistantMessage,
      frameDraft: result.frameDraft,
      isComplete: result.isComplete,
      followUpQuestion: result.followUpQuestion,
    };

    res.json(response);
  } catch (error) {
    console.error('Frame generation error:', error);
    sendError(res, 'PROCESSING_ERROR', 'Failed to generate frame');
  }
});

/**
 * POST /content/outline/generate
 *
 * Generate adventure outline with scene briefs.
 */
router.post('/outline/generate', async (req: Request, res: Response) => {
  const body = req.body as Partial<GenerateOutlineRequest>;

  // Validate request
  if (!body.frame || typeof body.frame !== 'object') {
    sendError(res, 'INVALID_REQUEST', 'frame is required', 400);
    return;
  }

  if (!body.dialsSummary || typeof body.dialsSummary !== 'object') {
    sendError(res, 'INVALID_REQUEST', 'dialsSummary is required', 400);
    return;
  }

  // Validate dialsSummary has required fields
  const { partySize, partyTier, sceneCount } = body.dialsSummary;
  if (typeof partySize !== 'number' || typeof partyTier !== 'number' || typeof sceneCount !== 'number') {
    sendError(res, 'INVALID_REQUEST', 'dialsSummary must include partySize, partyTier, and sceneCount', 400);
    return;
  }

  // Validate scene count range
  if (sceneCount < 3 || sceneCount > 6) {
    sendError(res, 'INVALID_REQUEST', 'sceneCount must be between 3 and 6', 400);
    return;
  }

  try {
    // Process through the outline generation handler
    const result = await generateOutlineHandler({
      frame: body.frame,
      dialsSummary: body.dialsSummary,
      feedback: body.feedback,
      previousOutline: body.previousOutline,
    });

    // Build response
    const response: GenerateOutlineResponse = {
      messageId: uuidv4(),
      content: result.assistantMessage,
      outline: result.outline,
      isComplete: result.isComplete,
      followUpQuestion: result.followUpQuestion,
    };

    res.json(response);
  } catch (error) {
    console.error('Outline generation error:', error);

    // Check for Claude CLI not available error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('CLAUDE_NOT_AVAILABLE')) {
      const structuredError: StructuredErrorResponse = {
        error: 'CLAUDE_NOT_AVAILABLE',
        title: 'Claude Code Not Available',
        message: 'Claude Code CLI is not installed or not authenticated.',
        instructions: [
          'Install Claude Code: curl -fsSL https://claude.ai/install.sh | bash',
          'Authenticate: Run "claude" in terminal and follow prompts',
          'Restart this application',
        ],
      };
      sendStructuredError(res, structuredError, 503);
      return;
    }

    // General generation failure
    const structuredError: StructuredErrorResponse = {
      error: 'GENERATION_FAILED',
      title: 'Outline Generation Failed',
      message: 'An error occurred while generating the adventure outline.',
      instructions: [
        'Check your internet connection',
        'Try again in a few moments',
        'If the problem persists, restart the application',
      ],
    };
    sendStructuredError(res, structuredError, 500);
  }
});

// =============================================================================
// Adversary Routes (Phase 4.1)
// =============================================================================

/**
 * GET /content/adversaries
 *
 * Get adversaries from Supabase with optional filters.
 * Query params: tier, type, limit
 */
router.get('/adversaries', async (req: Request, res: Response) => {
  try {
    const { tier, type, limit } = req.query;

    const tierResult = parseTier(tier as string | undefined);
    if (tierResult.error) {
      sendError(res, 'INVALID_REQUEST', tierResult.error, 400);
      return;
    }

    const limitResult = parseLimit(limit as string | undefined);
    if (limitResult.error) {
      sendError(res, 'INVALID_REQUEST', limitResult.error, 400);
      return;
    }

    const options: { tier?: number; type?: string; limit?: number } = {};
    if (tierResult.value !== undefined) {
      options.tier = tierResult.value;
    }
    if (type && typeof type === 'string') {
      options.type = type;
    }
    if (limitResult.value !== undefined) {
      options.limit = limitResult.value;
    }

    const result = await getAdversaries(options);

    if (result.error) {
      sendError(res, 'DATABASE_ERROR', result.error);
      return;
    }

    const adversaries = result.data || [];

    // Extract unique types for filter dropdown
    const availableTypes = [...new Set(adversaries.map((a: DaggerheartAdversary) => a.type))].sort();

    const response: GetAdversariesResponse = {
      adversaries,
      availableTypes,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching adversaries:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch adversaries');
  }
});

/**
 * GET /content/adversaries/types
 *
 * Get all available adversary types from database.
 */
router.get('/adversaries/types', async (_req: Request, res: Response) => {
  try {
    const result = await getAdversaryTypes();

    if (result.error) {
      sendError(res, 'DATABASE_ERROR', result.error);
      return;
    }

    const response: GetAdversaryTypesResponse = { types: result.data || [] };
    res.json(response);
  } catch (error) {
    console.error('Error fetching adversary types:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch adversary types');
  }
});

/**
 * GET /content/adversaries/:name
 *
 * Get a specific adversary by name.
 */
router.get('/adversaries/:name', async (req: Request, res: Response) => {
  try {
    const name = decodeURIComponent(req.params.name as string);
    const result = await getAdversaryByName(name);

    if (result.error) {
      sendError(res, 'DATABASE_ERROR', result.error);
      return;
    }

    if (!result.data) {
      sendError(res, 'NOT_FOUND', `Adversary not found: ${name}`, 404);
      return;
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching adversary:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch adversary');
  }
});

// =============================================================================
// Item Routes (Phase 4.2)
// =============================================================================

/**
 * GET /content/items
 *
 * Get unified items from all categories (items, weapons, armor, consumables).
 * Query params: tier, category, limit
 */
router.get('/items', async (req: Request, res: Response) => {
  try {
    const { tier, category, limit } = req.query;

    const tierResult = parseTier(tier as string | undefined);
    if (tierResult.error) {
      sendError(res, 'INVALID_REQUEST', tierResult.error, 400);
      return;
    }

    const categoryResult = parseCategory(category as string | undefined);
    if (categoryResult.error) {
      sendError(res, 'INVALID_REQUEST', categoryResult.error, 400);
      return;
    }

    const limitResult = parseLimit(limit as string | undefined);
    if (limitResult.error) {
      sendError(res, 'INVALID_REQUEST', limitResult.error, 400);
      return;
    }

    const filterCategory = categoryResult.value;
    const tierOptions = tierResult.value !== undefined ? { tier: tierResult.value } : undefined;

    // Fetch from all categories in parallel
    const [itemsResult, weaponsResult, armorResult, consumablesResult] = await Promise.all([
      filterCategory && filterCategory !== 'item' ? Promise.resolve({ data: [], error: null }) : getItems(),
      filterCategory && filterCategory !== 'weapon' ? Promise.resolve({ data: [], error: null }) : getWeapons(tierOptions),
      filterCategory && filterCategory !== 'armor' ? Promise.resolve({ data: [], error: null }) : getArmor(tierOptions),
      filterCategory && filterCategory !== 'consumable' ? Promise.resolve({ data: [], error: null }) : getConsumables(),
    ]);

    const dbError = findFirstError([itemsResult, weaponsResult, armorResult, consumablesResult]);
    if (dbError) {
      sendError(res, 'DATABASE_ERROR', dbError);
      return;
    }

    const unifiedItems = buildUnifiedItems(
      itemsResult.data || [],
      weaponsResult.data || [],
      armorResult.data || [],
      consumablesResult.data || []
    );

    const finalItems = limitResult.value !== undefined ? unifiedItems.slice(0, limitResult.value) : unifiedItems;
    const availableCategories = [...new Set(unifiedItems.map((item) => item.category))].sort() as ItemCategory[];

    const response: GetItemsResponse = {
      items: finalItems,
      availableCategories,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching items:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch items');
  }
});

// =============================================================================
// Name Suggestion Routes
// =============================================================================

/**
 * Response body for suggest-name endpoint
 */
interface SuggestNameResponse {
  suggestion: string;
}

/**
 * POST /content/suggest-name
 *
 * Generate a suggested adventure name based on frame context.
 */
router.post('/suggest-name', async (req: Request, res: Response) => {
  const body = req.body as Partial<SuggestNameParams>;

  // Validate request
  if (!body.frameName || typeof body.frameName !== 'string') {
    sendError(res, 'INVALID_REQUEST', 'frameName is required', 400);
    return;
  }

  try {
    const suggestion = generateAdventureName({
      frameName: body.frameName,
      themes: body.themes,
      currentName: body.currentName,
    });

    const response: SuggestNameResponse = { suggestion };
    res.json(response);
  } catch (error) {
    console.error('Name suggestion error:', error);
    sendError(res, 'PROCESSING_ERROR', 'Failed to generate name suggestion');
  }
});

// =============================================================================
// Echo Routes (Phase 4.3)
// =============================================================================

/**
 * POST /content/echoes/generate
 *
 * Generate GM creativity echoes for specified categories.
 */
router.post('/echoes/generate', async (req: Request, res: Response) => {
  const body = req.body as Partial<GenerateEchoesRequest>;

  const categoriesResult = parseEchoCategories(body.categories);
  if (categoriesResult.error) {
    sendError(res, 'INVALID_REQUEST', categoriesResult.error, 400);
    return;
  }

  const categoriesToGenerate = categoriesResult.value!;

  try {
    const echoes: Echo[] = [];
    const now = new Date().toISOString();

    for (const category of categoriesToGenerate) {
      const templates = ECHO_TEMPLATES[category];
      const shuffled = [...templates].sort(() => Math.random() - 0.5);
      const selectedTemplates = shuffled.slice(0, ECHOES_PER_CATEGORY);

      for (const template of selectedTemplates) {
        echoes.push({
          id: `echo-${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category,
          title: template.title,
          content: template.content,
          isConfirmed: false,
          createdAt: now,
        });
      }
    }

    const categoryList = categoriesToGenerate.join(', ');
    const assistantMessage = `I've generated ${echoes.length} echoes across ${categoriesToGenerate.length} categories (${categoryList}). Review each echo and confirm when ready.`;

    const response: GenerateEchoesResponse = {
      messageId: uuidv4(),
      content: assistantMessage,
      echoes,
      isComplete: true,
    };

    res.json(response);
  } catch (error) {
    console.error('Echo generation error:', error);
    sendError(res, 'PROCESSING_ERROR', 'Failed to generate echoes');
  }
});

// =============================================================================
// Pop Culture Example Routes (Issue #91)
// =============================================================================

/** Valid dial types for example generation */
const VALID_DIAL_TYPES: ExampleDialType[] = ['tone', 'emotionalRegister'];

/** Valid option values for each dial type */
const VALID_OPTIONS: Record<ExampleDialType, readonly string[]> = {
  tone: TONE_OPTIONS,
  emotionalRegister: EMOTIONAL_REGISTER_OPTIONS,
};

/**
 * Validate the dial type
 */
function isValidDialType(value: unknown): value is ExampleDialType {
  return typeof value === 'string' && VALID_DIAL_TYPES.includes(value as ExampleDialType);
}

/**
 * Validate the option value for a given dial type
 */
function isValidOptionValue(dialType: ExampleDialType, optionValue: unknown): boolean {
  if (typeof optionValue !== 'string') return false;
  return VALID_OPTIONS[dialType].includes(optionValue as (typeof VALID_OPTIONS)[ExampleDialType][number]);
}

/**
 * Build the prompt for Claude to generate a pop culture example
 */
function buildExamplePrompt(
  dialType: ExampleDialType,
  optionValue: string,
  context?: { themes?: string[]; tone?: string }
): string {
  const dialLabel = dialType === 'tone' ? 'tone' : 'emotional register';

  let prompt = `Generate a brief pop culture example for a ${dialLabel} setting of "${optionValue}" in a tabletop RPG adventure.

The example should be a single sentence in the format: "[Adjective phrase] like '[Movie/Show/Game Title]'"

Requirements:
- Reference a well-known movie, TV show, video game, or book
- The reference should evoke the ${optionValue} ${dialLabel}
- Keep it concise (under 60 characters)
- Make it relatable and recognizable`;

  if (context?.themes?.length) {
    prompt += `\n\nThe adventure has these themes: ${context.themes.join(', ')}`;
  }

  prompt += `\n\nRespond with ONLY the example text, no explanation or quotes around it. Format: "[Adjective phrase] like '[Title]'"`;

  return prompt;
}

/**
 * POST /content/example/generate
 *
 * Generate a pop culture example for Tone or Emotional Register dials.
 */
router.post('/example/generate', async (req: Request, res: Response) => {
  const body = req.body as Partial<GenerateExampleRequest>;

  // Validate dialType
  if (!body.dialType) {
    sendError(res, 'INVALID_REQUEST', 'dialType is required', 400);
    return;
  }

  if (!isValidDialType(body.dialType)) {
    sendError(res, 'INVALID_REQUEST', 'dialType must be "tone" or "emotionalRegister"', 400);
    return;
  }

  // Validate optionValue
  if (!body.optionValue) {
    sendError(res, 'INVALID_REQUEST', 'optionValue is required', 400);
    return;
  }

  if (!isValidOptionValue(body.dialType, body.optionValue)) {
    const validOptions = VALID_OPTIONS[body.dialType].join(', ');
    sendError(res, 'INVALID_REQUEST', `optionValue must be one of: ${validOptions}`, 400);
    return;
  }

  try {
    // Build the prompt for Claude
    const prompt = buildExamplePrompt(body.dialType, body.optionValue, body.context);

    // Invoke Claude CLI to generate the example
    const result = await invokeClaudeCli({
      prompt,
      timeout: 30000, // 30 second timeout for quick generation
    });

    // Parse the result
    let example = result.output.trim();

    // Clean up the example if it has extra quotes or formatting
    if (example.startsWith('"') && example.endsWith('"')) {
      example = example.slice(1, -1);
    }

    const response: GenerateExampleResponse = {
      example,
      dialType: body.dialType,
      optionValue: body.optionValue,
    };

    res.json(response);
  } catch (error) {
    console.error('Example generation error:', error);
    sendError(res, 'GENERATION_FAILED', 'Failed to generate pop culture example', 500);
  }
});

export default router;
