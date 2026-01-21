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
} from '@dagger-app/shared-types';
import { getFrames, getFrameByName } from '../services/daggerheart-queries.js';
import { generateFrameHandler } from '../mcp/tools/generateFrame.js';
import { generateOutlineHandler } from '../mcp/tools/generateOutline.js';

const router: RouterType = Router();

// =============================================================================
// Types
// =============================================================================

interface ErrorResponse {
  code: string;
  message: string;
}

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
      const error: ErrorResponse = {
        code: 'DATABASE_ERROR',
        message: result.error,
      };
      res.status(500).json(error);
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
    const errorResponse: ErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch frames',
    };
    res.status(500).json(errorResponse);
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
      const error: ErrorResponse = {
        code: 'DATABASE_ERROR',
        message: result.error,
      };
      res.status(500).json(error);
      return;
    }

    if (!result.data) {
      const error: ErrorResponse = {
        code: 'NOT_FOUND',
        message: `Frame not found: ${name}`,
      };
      res.status(404).json(error);
      return;
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching frame:', error);
    const errorResponse: ErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch frame',
    };
    res.status(500).json(errorResponse);
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
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'userMessage is required',
    };
    res.status(400).json(error);
    return;
  }

  if (!body.dialsSummary || typeof body.dialsSummary !== 'object') {
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'dialsSummary is required',
    };
    res.status(400).json(error);
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
    const errorResponse: ErrorResponse = {
      code: 'PROCESSING_ERROR',
      message: 'Failed to generate frame',
    };
    res.status(500).json(errorResponse);
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
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'frame is required',
    };
    res.status(400).json(error);
    return;
  }

  if (!body.dialsSummary || typeof body.dialsSummary !== 'object') {
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'dialsSummary is required',
    };
    res.status(400).json(error);
    return;
  }

  // Validate dialsSummary has required fields
  const { partySize, partyTier, sceneCount } = body.dialsSummary;
  if (typeof partySize !== 'number' || typeof partyTier !== 'number' || typeof sceneCount !== 'number') {
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'dialsSummary must include partySize, partyTier, and sceneCount',
    };
    res.status(400).json(error);
    return;
  }

  // Validate scene count range
  if (sceneCount < 3 || sceneCount > 6) {
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'sceneCount must be between 3 and 6',
    };
    res.status(400).json(error);
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
    const errorResponse: ErrorResponse = {
      code: 'PROCESSING_ERROR',
      message: 'Failed to generate outline',
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
