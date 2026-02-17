/**
 * Smoke tests for test infrastructure
 *
 * Verifies that mocks, helpers, and fixtures are importable and functional.
 * This file validates the testing scaffold itself.
 */

import { describe, it, expect } from 'vitest';

// Mock imports
import {
  mockAnthropicStream,
  mockAnthropicToolStream,
  mockAnthropicMessage,
  buildToolUseBlock,
  createMockAnthropicClient,
  resetToolUseIdCounter,
} from './mocks/anthropic';

import {
  createMockSupabaseClient,
  mockQueryResult,
  mockQueryError,
  mockAuthUser,
} from './mocks/supabase';

// Helper imports
import {
  parseSSEChunk,
  collectSSEEvents,
  assertEventSequence,
  assertEventSubsequence,
  waitForEvent,
  filterEventsByType,
  buildSSEString,
} from './helpers/sse';

// Fixture imports
import {
  SAMPLE_FRAME,
  SAMPLE_CUSTOM_FRAME,
  SAMPLE_OUTLINE,
  SAMPLE_SCENE_DRAFT,
  SAMPLE_NPC,
  SAMPLE_ADVERSARY,
  SAMPLE_DIALS_SUMMARY,
  MINIMAL_DIALS_SUMMARY,
} from './fixtures/adventure-state';

import {
  USER_GREETING,
  ASSISTANT_WELCOME,
  DIAL_TUNING_CONVERSATION,
  STREAMING_TEXT_CHUNKS,
} from './fixtures/messages';

import {
  GENERATE_FRAME_TOOL_USE,
  TEXT_WITH_TOOL_RESPONSE,
  SUCCESSFUL_TOOL_RESULT,
  FAILED_TOOL_RESULT,
} from './fixtures/tool-calls';

// =============================================================================
// Anthropic Mock Tests
// =============================================================================

describe('Anthropic Mock', () => {
  it('creates a streaming text response', async () => {
    const stream = mockAnthropicStream({
      textChunks: ['Hello', ' world'],
    });

    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('message_start');
    expect(events[events.length - 1].type).toBe('message_stop');
  });

  it('creates a tool_use streaming response', async () => {
    const stream = mockAnthropicToolStream({
      toolUse: {
        name: 'generate_frame_draft',
        input: { name: 'Test Frame' },
      },
    });

    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    const hasToolBlock = events.some(
      (e) => e.type === 'content_block_start' &&
        (e.content_block as { type: string })?.type === 'tool_use'
    );
    expect(hasToolBlock).toBe(true);
  });

  it('creates a non-streaming message', () => {
    const message = mockAnthropicMessage({
      content: [{ type: 'text', text: 'Test response' }],
      inputTokens: 50,
      outputTokens: 25,
    });

    expect(message.role).toBe('assistant');
    expect(message.usage.input_tokens).toBe(50);
    expect(message.usage.output_tokens).toBe(25);
  });

  it('builds tool_use blocks with configurable IDs', () => {
    resetToolUseIdCounter();
    const block = buildToolUseBlock({
      name: 'test_tool',
      input: { key: 'value' },
    });

    expect(block.type).toBe('tool_use');
    expect(block.name).toBe('test_tool');
    expect(block.id).toContain('toolu_test_');
  });

  it('creates a mock client with spied methods', () => {
    const client = createMockAnthropicClient();
    expect(client.messages.create).toBeDefined();
    expect(client.messages.stream).toBeDefined();
  });
});

// =============================================================================
// Supabase Mock Tests
// =============================================================================

describe('Supabase Mock', () => {
  it('creates a chainable query builder', async () => {
    const client = createMockSupabaseClient();

    mockQueryResult(client, {
      data: [{ id: '1', name: 'Test Frame' }],
    });

    const result = await client.from('daggerheart_frames').select('*');
    expect(result.data).toEqual([{ id: '1', name: 'Test Frame' }]);
    expect(result.error).toBeNull();
  });

  it('supports filter chaining', async () => {
    const client = createMockSupabaseClient();

    mockQueryResult(client, {
      data: [SAMPLE_ADVERSARY],
    });

    const result = await client
      .from('daggerheart_adversaries')
      .select('*')
      .eq('tier', 2)
      .eq('type', 'undead');

    expect(result.data).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith('daggerheart_adversaries');
  });

  it('mocks query errors', async () => {
    const client = createMockSupabaseClient();

    mockQueryError(client, {
      message: 'Table not found',
      code: '42P01',
    });

    const result = await client.from('nonexistent').select('*');
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toBe('Table not found');
  });

  it('mocks authenticated users', async () => {
    const client = createMockSupabaseClient();

    mockAuthUser(client, { id: 'user-123', email: 'test@example.com' });

    const result = await client.auth.getUser();
    expect(result.data.user?.id).toBe('user-123');
  });
});

// =============================================================================
// SSE Helper Tests
// =============================================================================

describe('SSE Helpers', () => {
  it('parses SSE chunks', () => {
    const raw = 'event: text_delta\ndata: {"content":"hello"}\n\n';
    const events = parseSSEChunk(raw);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('text_delta');
    expect(events[0].data).toEqual({ content: 'hello' });
  });

  it('collects events from a string body', async () => {
    const body =
      'event: start\ndata: {}\n\n' +
      'event: delta\ndata: {"text":"hi"}\n\n' +
      'event: end\ndata: {}\n\n';

    const events = await collectSSEEvents(body);
    expect(events).toHaveLength(3);
  });

  it('asserts exact event sequences', () => {
    const events = [
      { type: 'start', data: {}, rawData: '{}' },
      { type: 'delta', data: {}, rawData: '{}' },
      { type: 'end', data: {}, rawData: '{}' },
    ];

    expect(() => assertEventSequence(events, ['start', 'delta', 'end'])).not.toThrow();
    expect(() => assertEventSequence(events, ['start', 'end'])).toThrow();
  });

  it('asserts event subsequences', () => {
    const events = [
      { type: 'start', data: {}, rawData: '{}' },
      { type: 'delta', data: {}, rawData: '{}' },
      { type: 'delta', data: {}, rawData: '{}' },
      { type: 'end', data: {}, rawData: '{}' },
    ];

    expect(() => assertEventSubsequence(events, ['start', 'end'])).not.toThrow();
    expect(() => assertEventSubsequence(events, ['start', 'delta', 'end'])).not.toThrow();
  });

  it('waits for specific event types', async () => {
    const events = [
      { type: 'start', data: {}, rawData: '{}' },
      { type: 'target', data: { found: true }, rawData: '{"found":true}' },
    ];

    const found = await waitForEvent(events, 'target');
    expect(found.type).toBe('target');
    expect(found.data).toEqual({ found: true });
  });

  it('filters events by type', () => {
    const events = [
      { type: 'delta', data: { n: 1 }, rawData: '{"n":1}' },
      { type: 'other', data: {}, rawData: '{}' },
      { type: 'delta', data: { n: 2 }, rawData: '{"n":2}' },
    ];

    const deltas = filterEventsByType(events, 'delta');
    expect(deltas).toHaveLength(2);
  });

  it('builds SSE strings', () => {
    const raw = buildSSEString('text_delta', { content: 'test' });
    expect(raw).toContain('event: text_delta');
    expect(raw).toContain('data: {"content":"test"}');
  });
});

// =============================================================================
// Fixture Validation Tests
// =============================================================================

describe('Fixtures', () => {
  it('provides valid adventure state fixtures', () => {
    expect(SAMPLE_FRAME.id).toBe('frame-001');
    expect(SAMPLE_CUSTOM_FRAME.isCustom).toBe(true);
    expect(SAMPLE_OUTLINE.scenes).toHaveLength(4);
    expect(SAMPLE_SCENE_DRAFT.extractedEntities.npcs).toHaveLength(1);
    expect(SAMPLE_NPC.role).toBe('quest-giver');
    expect(SAMPLE_ADVERSARY.tier).toBe(2);
  });

  it('provides valid dials summary fixtures', () => {
    expect(SAMPLE_DIALS_SUMMARY.partySize).toBe(4);
    expect(SAMPLE_DIALS_SUMMARY.partyTier).toBe(2);
    expect(MINIMAL_DIALS_SUMMARY.partySize).toBe(3);
    expect(MINIMAL_DIALS_SUMMARY.tone).toBeNull();
  });

  it('provides valid message fixtures', () => {
    expect(USER_GREETING.role).toBe('user');
    expect(ASSISTANT_WELCOME.role).toBe('assistant');
    expect(DIAL_TUNING_CONVERSATION).toHaveLength(4);
    expect(STREAMING_TEXT_CHUNKS.length).toBeGreaterThan(0);
  });

  it('provides valid tool call fixtures', () => {
    expect(GENERATE_FRAME_TOOL_USE.type).toBe('tool_use');
    expect(TEXT_WITH_TOOL_RESPONSE).toHaveLength(2);
    expect(SUCCESSFUL_TOOL_RESULT.type).toBe('tool_result');
    expect(FAILED_TOOL_RESULT.is_error).toBe(true);
  });
});
