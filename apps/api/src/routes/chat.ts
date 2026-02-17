/**
 * SSE chat endpoint for Sage Codex
 *
 * POST /api/chat
 *
 * Receives a user message, streams the Anthropic response as SSE events,
 * handles tool calls, stores messages, and tracks token usage.
 *
 * Flow:
 * 1. Validate request (message, sessionId, auth)
 * 2. Store the user message
 * 3. Load conversation history
 * 4. Open SSE response
 * 5. Stream Anthropic response, emitting events as they arrive
 * 6. If tool calls: dispatch, send follow-up turn, stream again
 * 7. Store assistant message + log token usage
 * 8. Close SSE stream
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import type { SageEvent, SageChatRequest } from '@dagger-app/shared-types';
import { createStreamingMessage } from '../services/anthropic.js';
import { parseAnthropicStream, type StreamEvent } from '../services/stream-parser.js';
import { dispatchToolCalls } from '../services/tool-dispatcher.js';
import { drainPendingEvents } from '../tools/invoking.js';
import { drainAttuningEvents } from '../tools/attuning.js';
import { drainBindingEvents } from '../tools/binding.js';
import { drainWeavingEvents } from '../tools/weaving.js';
import { drainInscribingEvents } from '../tools/inscribing.js';
import { logTokenUsage } from '../services/token-tracker.js';
import { storeMessage, loadConversationHistory } from '../services/message-store.js';
import { loadSession } from '../services/session-state.js';
import { buildSystemPrompt } from '../services/system-prompt.js';
import { getToolsForStage } from '../tools/definitions.js';
import { classifyApiError } from '../middleware/error-handler.js';
import type { AnthropicMessage, AnthropicContentBlock } from '../services/anthropic.js';
import type { CollectedToolUse } from '../services/stream-parser.js';

// =============================================================================
// Constants
// =============================================================================

const MAX_TOOL_TURNS = 5;

// =============================================================================
// SSE Helpers
// =============================================================================

/**
 * Write a single SSE event to the response stream.
 */
function sendSSEEvent(res: Response, event: SageEvent): void {
  res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
}

/**
 * Set SSE response headers and flush them to start streaming.
 */
function initializeSSEResponse(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

// =============================================================================
// Request Validation
// =============================================================================

/**
 * Validate the chat request body.
 *
 * Returns an error message string if invalid, or null if valid.
 */
function validateChatRequest(
  body: unknown
): { message: string; sessionId: string } | { error: string } {
  const req = body as Partial<SageChatRequest>;

  if (!req.message || typeof req.message !== 'string') {
    return { error: 'message is required and must be a string' };
  }

  if (!req.sessionId || typeof req.sessionId !== 'string') {
    return { error: 'sessionId is required and must be a string' };
  }

  return { message: req.message.trim(), sessionId: req.sessionId };
}

// =============================================================================
// Message Formatting
// =============================================================================

/**
 * Convert stored messages to Anthropic Messages API format.
 */
function formatMessagesForApi(
  history: Array<{ role: string; content: string }>,
  currentMessage: string
): AnthropicMessage[] {
  const messages: AnthropicMessage[] = history.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  messages.push({ role: 'user', content: currentMessage });

  return messages;
}

/**
 * Build tool_result + assistant messages for a follow-up API turn.
 */
function buildToolResultMessages(
  previousMessages: AnthropicMessage[],
  assistantText: string,
  toolUseBlocks: CollectedToolUse[],
  toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }>
): AnthropicMessage[] {
  const messages: AnthropicMessage[] = [...previousMessages];

  // Add the assistant's response (text + tool_use blocks)
  const assistantContent: AnthropicContentBlock[] = [];
  if (assistantText) {
    assistantContent.push({ type: 'text', text: assistantText });
  }
  for (const toolUse of toolUseBlocks) {
    assistantContent.push({
      type: 'tool_use',
      id: toolUse.id,
      name: toolUse.name,
      input: toolUse.input,
    });
  }
  messages.push({ role: 'assistant', content: assistantContent });

  // Add the tool results as a user message
  const toolResultContent: AnthropicContentBlock[] = toolResults.map((tr) => ({
    type: 'tool_result' as const,
    tool_use_id: tr.tool_use_id,
    content: tr.content,
    ...(tr.is_error && { is_error: true }),
  }));
  messages.push({ role: 'user', content: toolResultContent });

  return messages;
}

// =============================================================================
// Route
// =============================================================================

const router: RouterType = Router();

/**
 * POST /api/chat
 *
 * Accepts { message: string, sessionId: string } in the request body.
 * Returns an SSE event stream with SageEvent payloads.
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const validation = validateChatRequest(req.body);
  if ('error' in validation) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const { message, sessionId } = validation;

  try {
    // Load session to get the current stage
    const sessionResult = await loadSession(sessionId, userId);
    if (sessionResult.error || !sessionResult.data) {
      res.status(404).json({ error: sessionResult.error ?? 'Session not found' });
      return;
    }
    const { session } = sessionResult.data;
    const stage = session.stage;

    // Build stage-aware system prompt and tools
    const systemPrompt = buildSystemPrompt(stage);
    const tools = getToolsForStage(stage);

    // Store the user's message
    await storeMessage({ sessionId, role: 'user', content: message });

    // Load conversation history
    const historyResult = await loadConversationHistory(sessionId);
    const history = historyResult.data ?? [];

    // Format messages for Anthropic API (exclude the one we just stored -
    // it will be added as the current message)
    const previousMessages = history.slice(0, -1);
    let apiMessages = formatMessagesForApi(previousMessages, message);

    // Initialize SSE response
    initializeSSEResponse(res);

    // Handle the streaming conversation (with potential tool turns)
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let finalText = '';
    let finalToolCalls: Record<string, unknown>[] = [];
    let model = '';

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const stream = await createStreamingMessage({ messages: apiMessages, systemPrompt, tools });
      const parsed = await parseAnthropicStream(
        stream as unknown as AsyncIterable<StreamEvent>
      );

      model = parsed.model || model;
      totalInputTokens += parsed.inputTokens;
      totalOutputTokens += parsed.outputTokens;

      // Send all parsed events to the client
      for (const event of parsed.events) {
        sendSSEEvent(res, event);
      }

      // If no tool calls, we're done
      if (parsed.toolUseBlocks.length === 0) {
        finalText = parsed.fullText;
        break;
      }

      // Dispatch tool calls and send tool events
      const dispatch = await dispatchToolCalls(parsed.toolUseBlocks);
      for (const event of dispatch.events) {
        sendSSEEvent(res, event);
      }

      // Send any panel/UI events generated by tool handlers
      const panelEvents = drainPendingEvents();
      for (const event of panelEvents) {
        sendSSEEvent(res, event);
      }
      const attuningEvents = drainAttuningEvents();
      for (const event of attuningEvents) {
        sendSSEEvent(res, event);
      }
      const bindingEvents = drainBindingEvents();
      for (const event of bindingEvents) {
        sendSSEEvent(res, event);
      }
      const weavingEvents = drainWeavingEvents();
      for (const event of weavingEvents) {
        sendSSEEvent(res, event);
      }
      const inscribingEvents = drainInscribingEvents();
      for (const event of inscribingEvents) {
        sendSSEEvent(res, event);
      }

      // Track tool calls for storage
      finalToolCalls = [
        ...finalToolCalls,
        ...parsed.toolUseBlocks.map((t) => ({
          id: t.id,
          name: t.name,
          input: t.input,
        })),
      ];

      // Build messages for the next turn
      apiMessages = buildToolResultMessages(
        apiMessages,
        parsed.fullText,
        parsed.toolUseBlocks,
        dispatch.toolResults
      );

      finalText = parsed.fullText;
    }

    // Store the assistant's response
    await storeMessage({
      sessionId,
      role: 'assistant',
      content: finalText,
      toolCalls: finalToolCalls.length > 0 ? finalToolCalls : null,
      tokenCount: totalInputTokens + totalOutputTokens,
    });

    // Log token usage (non-fatal)
    await logTokenUsage({
      sessionId,
      messageId: 'aggregated',
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      model,
    });

    res.end();
  } catch (err) {
    const classified = classifyApiError(err);

    // If headers already sent (streaming started), send error as SSE
    if (res.headersSent) {
      const errorEvent: SageEvent = {
        type: 'error',
        data: { code: classified.code, message: classified.message },
      };
      sendSSEEvent(res, errorEvent);
      res.end();
    } else {
      res.status(classified.httpStatus).json({
        error: classified.message,
        code: classified.code,
        retryable: classified.retryable,
        ...(classified.retryAfterMs && { retryAfterMs: classified.retryAfterMs }),
      });
    }
  }
});

export default router;
