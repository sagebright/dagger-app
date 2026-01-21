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
import { sendError } from './helpers.js';

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
    sendError(res, 'INVALID_REQUEST', 'Message is required', 400);
    return;
  }

  if (!body.currentDials || typeof body.currentDials !== 'object') {
    sendError(res, 'INVALID_REQUEST', 'Current dials state is required', 400);
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
    sendError(res, 'PROCESSING_ERROR', 'Failed to process chat message');
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
    sendError(res, 'INVALID_REQUEST', 'dialId is required', 400);
    return;
  }

  if (body.value === undefined) {
    sendError(res, 'INVALID_REQUEST', 'value is required', 400);
    return;
  }

  // Validate the dial value
  const dialId = body.dialId as DialId;
  if (!validateDialValue(dialId, body.value)) {
    const validationError = getDialValidationError(dialId, body.value);
    sendError(res, 'INVALID_VALUE', validationError || 'Invalid dial value', 400);
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
