/**
 * Chat route for dial tuning
 *
 * Handles chat messages during the dial tuning phase and
 * provides endpoints for direct dial updates.
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { ChatRequest, ChatResponse, DialId } from '@dagger-app/shared-types';
import { processDialInputHandler } from '../mcp/tools/processDial.js';
import { validateDialValue, getDialValidationError } from '../services/dial-validation.js';

const router: RouterType = Router();

// =============================================================================
// Types
// =============================================================================

interface DirectDialUpdate {
  dialId: DialId;
  value: unknown;
}

interface DirectDialResponse {
  success: boolean;
  dialId: DialId;
  value: unknown;
}

interface ErrorResponse {
  code: string;
  message: string;
}

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /chat
 *
 * Process a chat message during dial tuning phase.
 * Returns AI response with dial suggestions.
 */
router.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<ChatRequest>;

  // Validate request
  if (!body.message || typeof body.message !== 'string') {
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'Message is required',
    };
    res.status(400).json(error);
    return;
  }

  if (!body.currentDials || typeof body.currentDials !== 'object') {
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'Current dials state is required',
    };
    res.status(400).json(error);
    return;
  }

  try {
    // Process the message through the dial handler
    const result = await processDialInputHandler({
      userMessage: body.message,
      currentDials: body.currentDials,
      conversationHistory: body.conversationHistory || [],
      currentDialFocus: undefined, // Let the handler determine focus
    });

    // Build response
    const response: ChatResponse = {
      messageId: uuidv4(),
      content: result.assistantMessage,
      dialUpdates: result.dialUpdates,
      inlineWidgets: result.inlineWidgets,
      nextDialFocus: result.nextDialFocus,
    };

    res.json(response);
  } catch (error) {
    console.error('Chat processing error:', error);
    const errorResponse: ErrorResponse = {
      code: 'PROCESSING_ERROR',
      message: 'Failed to process chat message',
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * POST /chat/dial
 *
 * Directly update a dial value (bypassing chat).
 * Used when user interacts with dial widgets directly.
 */
router.post('/dial', (req: Request, res: Response) => {
  const body = req.body as Partial<DirectDialUpdate>;

  // Validate request
  if (!body.dialId || typeof body.dialId !== 'string') {
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'dialId is required',
    };
    res.status(400).json(error);
    return;
  }

  if (body.value === undefined) {
    const error: ErrorResponse = {
      code: 'INVALID_REQUEST',
      message: 'value is required',
    };
    res.status(400).json(error);
    return;
  }

  // Validate the dial value
  const dialId = body.dialId as DialId;
  if (!validateDialValue(dialId, body.value)) {
    const validationError = getDialValidationError(dialId, body.value);
    const error: ErrorResponse = {
      code: 'INVALID_VALUE',
      message: validationError || 'Invalid dial value',
    };
    res.status(400).json(error);
    return;
  }

  // Success - return confirmation
  const response: DirectDialResponse = {
    success: true,
    dialId,
    value: body.value,
  };

  res.json(response);
});

export default router;
