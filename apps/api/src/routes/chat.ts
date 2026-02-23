/**
 * SSE chat endpoint for Sage Codex
 *
 * POST /api/chat       — User message → streamed Sage response
 * POST /api/chat/greet — Sage speaks first when a stage loads
 *
 * Flow:
 * 1. Validate request (message, sessionId, auth)
 * 2. Store the user message
 * 3. Load conversation history + adventure state
 * 4. Assemble full context via context-assembler (system prompt + state + compressed history)
 * 5. Open SSE response
 * 6. Stream Anthropic response, emitting events as they arrive
 * 7. If tool calls: dispatch, send follow-up turn, stream again
 * 8. Store assistant message + log token usage
 * 9. Close SSE stream
 */

import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import type { SageEvent, SageChatRequest, ToolDefinition } from '@sage-codex/shared-types';
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
import { assembleAnthropicPayload } from '../services/context-assembler.js';
import { loadAdventureState } from '../services/state-mapper.js';
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
 * Returns the validated fields if valid, or an error if invalid.
 */
function validateChatRequest(
  body: unknown
): { message: string; sessionId: string; isSystemTrigger: boolean } | { error: string } {
  const req = body as Partial<SageChatRequest>;

  if (!req.message || typeof req.message !== 'string') {
    return { error: 'message is required and must be a string' };
  }

  if (!req.sessionId || typeof req.sessionId !== 'string') {
    return { error: 'sessionId is required and must be a string' };
  }

  return {
    message: req.message.trim(),
    sessionId: req.sessionId,
    isSystemTrigger: req.isSystemTrigger === true,
  };
}

// =============================================================================
// Message Formatting
// =============================================================================

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
// Streaming Loop (shared by /chat and /chat/greet)
// =============================================================================

interface StreamResult {
  finalText: string;
  finalToolCalls: Record<string, unknown>[];
  totalInputTokens: number;
  totalOutputTokens: number;
  model: string;
}

/**
 * Run the streaming conversation loop: send to Anthropic, stream SSE events,
 * handle tool calls with follow-up turns.
 *
 * Shared between the regular chat endpoint and the greet endpoint.
 */
async function runStreamingLoop(
  res: Response,
  initialMessages: AnthropicMessage[],
  systemPrompt: string | undefined,
  tools: ToolDefinition[] | undefined,
  sessionId: string
): Promise<StreamResult> {
  let apiMessages = initialMessages;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let finalText = '';
  let finalToolCalls: Record<string, unknown>[] = [];
  let model = '';
  const allTextParts: string[] = [];

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

    // Accumulate text from every turn for complete message storage
    if (parsed.fullText) {
      allTextParts.push(parsed.fullText);
    }

    // If no tool calls, we're done
    if (parsed.toolUseBlocks.length === 0) {
      finalText = allTextParts.join('\n\n');
      break;
    }

    // Dispatch tool calls and send tool events
    const dispatch = await dispatchToolCalls(parsed.toolUseBlocks, { sessionId });
    for (const event of dispatch.events) {
      sendSSEEvent(res, event);
    }

    // Send any panel/UI events generated by tool handlers
    for (const event of drainPendingEvents()) sendSSEEvent(res, event);
    for (const event of drainAttuningEvents()) sendSSEEvent(res, event);
    for (const event of drainBindingEvents()) sendSSEEvent(res, event);
    for (const event of drainWeavingEvents()) sendSSEEvent(res, event);
    for (const event of drainInscribingEvents()) sendSSEEvent(res, event);

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
  }

  // Ensure finalText includes all accumulated text (handles max tool turns case)
  if (!finalText && allTextParts.length > 0) {
    finalText = allTextParts.join('\n\n');
  }

  return { finalText, finalToolCalls, totalInputTokens, totalOutputTokens, model };
}

/**
 * Handle SSE errors consistently across endpoints.
 */
function handleStreamError(res: Response, err: unknown): void {
  const classified = classifyApiError(err);

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

// =============================================================================
// Synthetic Greeting Message
// =============================================================================

/**
 * The synthetic user message sent to trigger the Sage's opening greeting.
 *
 * This is never stored in the database — it only exists for the Anthropic API
 * request so the Sage has a user message to respond to (API requirement).
 */
const GREETING_TRIGGER = '[The storyteller has opened the Codex and is ready to begin.]';

// =============================================================================
// Routes
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

  const { message, sessionId, isSystemTrigger } = validation;

  try {
    // Load session to get the current stage
    const sessionResult = await loadSession(sessionId, userId);
    if (sessionResult.error || !sessionResult.data) {
      res.status(404).json({ error: sessionResult.error ?? 'Session not found' });
      return;
    }
    const { session } = sessionResult.data;
    const stage = session.stage;

    // Load conversation history + adventure state BEFORE storing the new message
    // Filter by current stage so cross-stage messages don't leak into context
    const historyResult = await loadConversationHistory(sessionId, { stage });
    const history = historyResult.data ?? [];
    const adventureState = await loadAdventureState(sessionId, stage);

    // Format system-triggered messages as bracketed context notes for Claude
    const llmMessage = isSystemTrigger
      ? `[System context: ${message}]`
      : message;

    // Store the user's message (after loading history so it's excluded naturally)
    // System-triggered messages are flagged in metadata so the frontend can filter them
    const userStoreResult = await storeMessage({
      sessionId,
      role: 'user',
      content: message,
      stage,
      isSystemTrigger,
    });
    if (userStoreResult.error) {
      console.error(`Failed to store user message: ${userStoreResult.error}`);
    }

    // Assemble full context: system prompt + adventure state + compressed history + tools
    // History was loaded before the user message was stored, so no exclusion needed
    const { streamOptions } = assembleAnthropicPayload({
      state: adventureState,
      stage,
      conversationHistory: history,
      userMessage: llmMessage,
    });

    // Initialize SSE response and run streaming loop
    initializeSSEResponse(res);
    const result = await runStreamingLoop(
      res, streamOptions.messages, streamOptions.systemPrompt, streamOptions.tools, sessionId
    );

    // Store the assistant's response
    const assistantStoreResult = await storeMessage({
      sessionId,
      role: 'assistant',
      content: result.finalText,
      stage,
      toolCalls: result.finalToolCalls.length > 0 ? result.finalToolCalls : null,
      tokenCount: result.totalInputTokens + result.totalOutputTokens,
    });
    if (assistantStoreResult.error) {
      console.error(`Failed to store assistant message: ${assistantStoreResult.error}`);
    }

    // Log token usage (non-fatal)
    await logTokenUsage({
      sessionId,
      inputTokens: result.totalInputTokens,
      outputTokens: result.totalOutputTokens,
      model: result.model,
      stage,
      operation: 'chat',
    });

    res.end();
  } catch (err) {
    handleStreamError(res, err);
  }
});

/**
 * POST /api/chat/greet
 *
 * Triggers the Sage's opening greeting when a stage loads.
 * Accepts { sessionId: string } in the request body.
 *
 * Uses a synthetic user message to satisfy the Anthropic API requirement
 * that the first message must be role: 'user'. The synthetic message is
 * NOT stored in the database — only the Sage's response is persisted.
 */
router.post('/greet', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  try {
    // Load session to get the current stage
    const sessionResult = await loadSession(sessionId, userId);
    if (sessionResult.error || !sessionResult.data) {
      res.status(404).json({ error: sessionResult.error ?? 'Session not found' });
      return;
    }
    const { session } = sessionResult.data;
    const stage = session.stage;

    // Load existing conversation history + adventure state
    // Filter by current stage so advancing stages always triggers a fresh greeting
    const historyResult = await loadConversationHistory(sessionId, { stage });
    const history = historyResult.data ?? [];
    const adventureState = await loadAdventureState(sessionId, stage);

    // If there are already messages for THIS stage, skip the greeting
    if (history.length > 0) {
      res.status(200).json({ status: 'already_greeted' });
      return;
    }

    // Store a lightweight session-start marker so history always begins
    // with a user-role message (Anthropic API requirement).
    // Note: GREETING_TRIGGER is sent to Anthropic in-flight (never stored),
    // while this marker anchors the persistent history with a user role.
    const startResult = await storeMessage({ sessionId, role: 'user', content: '[Session started]', stage });
    if (startResult.error) {
      console.error(`Failed to store session-start marker: ${startResult.error}`);
    }

    // Assemble context with the synthetic greeting trigger
    const { streamOptions } = assembleAnthropicPayload({
      state: adventureState,
      stage,
      conversationHistory: [],
      userMessage: GREETING_TRIGGER,
    });

    // Initialize SSE response and run streaming loop
    initializeSSEResponse(res);
    const result = await runStreamingLoop(
      res, streamOptions.messages, streamOptions.systemPrompt, streamOptions.tools, sessionId
    );

    // Store the assistant's greeting response
    const greetStoreResult = await storeMessage({
      sessionId,
      role: 'assistant',
      content: result.finalText,
      stage,
      toolCalls: result.finalToolCalls.length > 0 ? result.finalToolCalls : null,
      tokenCount: result.totalInputTokens + result.totalOutputTokens,
    });
    if (greetStoreResult.error) {
      console.error(`Failed to store greeting response: ${greetStoreResult.error}`);
    }

    await logTokenUsage({
      sessionId,
      inputTokens: result.totalInputTokens,
      outputTokens: result.totalOutputTokens,
      model: result.model,
      stage,
      operation: 'greet',
    });

    res.end();
  } catch (err) {
    handleStreamError(res, err);
  }
});

export default router;
