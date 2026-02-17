/**
 * Tests for stream-parser service
 *
 * Verifies that raw Anthropic stream events are correctly parsed into
 * SageEvent objects, with proper handling of text deltas, tool_use
 * blocks, and token usage accumulation.
 */

import { describe, it, expect } from 'vitest';
import {
  parseAnthropicStream,
  type ParsedStreamResult,
} from './stream-parser.js';
import {
  mockAnthropicStream,
  mockAnthropicToolStream,
} from '../test/mocks/anthropic.js';

// =============================================================================
// Helpers
// =============================================================================

async function parseFromMock(
  stream: AsyncIterable<{ type: string; [key: string]: unknown }>
): Promise<ParsedStreamResult> {
  return parseAnthropicStream(stream);
}

// =============================================================================
// Tests
// =============================================================================

describe('parseAnthropicStream', () => {
  describe('text-only responses', () => {
    it('should emit chat:start, chat:delta, and chat:end events', async () => {
      const stream = mockAnthropicStream({
        textChunks: ['Hello', ' world'],
        inputTokens: 50,
        outputTokens: 25,
      });

      const result = await parseFromMock(stream);

      const eventTypes = result.events.map((e) => e.type);
      expect(eventTypes).toContain('chat:start');
      expect(eventTypes).toContain('chat:delta');
      expect(eventTypes).toContain('chat:end');
    });

    it('should accumulate full text from all text deltas', async () => {
      const stream = mockAnthropicStream({
        textChunks: ['The ', 'monastery ', 'looms.'],
      });

      const result = await parseFromMock(stream);

      expect(result.fullText).toBe('The monastery looms.');
    });

    it('should capture input and output token counts', async () => {
      const stream = mockAnthropicStream({
        textChunks: ['test'],
        inputTokens: 120,
        outputTokens: 45,
      });

      const result = await parseFromMock(stream);

      expect(result.inputTokens).toBe(120);
      expect(result.outputTokens).toBe(45);
    });

    it('should capture the message ID', async () => {
      const stream = mockAnthropicStream({ textChunks: ['hi'] });

      const result = await parseFromMock(stream);

      expect(result.messageId).toBeTruthy();
      expect(result.messageId).toContain('msg_test_');
    });

    it('should produce a chat:delta event per text chunk', async () => {
      const chunks = ['A', 'B', 'C', 'D'];
      const stream = mockAnthropicStream({ textChunks: chunks });

      const result = await parseFromMock(stream);

      const deltas = result.events.filter((e) => e.type === 'chat:delta');
      expect(deltas).toHaveLength(chunks.length);

      const deltaContents = deltas.map(
        (e) => (e.data as { content: string }).content
      );
      expect(deltaContents).toEqual(chunks);
    });

    it('should set stopReason from the stream', async () => {
      const stream = mockAnthropicStream({
        textChunks: ['done'],
        stopReason: 'end_turn',
      });

      const result = await parseFromMock(stream);

      expect(result.stopReason).toBe('end_turn');
    });
  });

  describe('tool_use responses', () => {
    it('should collect tool_use blocks', async () => {
      const stream = mockAnthropicToolStream({
        toolUse: {
          name: 'generate_frame_draft',
          input: { title: 'The Hollow Vigil' },
        },
      });

      const result = await parseFromMock(stream);

      expect(result.toolUseBlocks).toHaveLength(1);
      expect(result.toolUseBlocks[0].name).toBe('generate_frame_draft');
      expect(result.toolUseBlocks[0].input).toEqual({
        title: 'The Hollow Vigil',
      });
    });

    it('should include both text deltas and tool blocks when mixed', async () => {
      const stream = mockAnthropicToolStream({
        textChunks: ['Let me help.'],
        toolUse: {
          name: 'query_adversaries',
          input: { tier: 2 },
        },
      });

      const result = await parseFromMock(stream);

      expect(result.fullText).toBe('Let me help.');
      expect(result.toolUseBlocks).toHaveLength(1);
      expect(result.toolUseBlocks[0].name).toBe('query_adversaries');
    });

    it('should set stopReason to tool_use', async () => {
      const stream = mockAnthropicToolStream({
        toolUse: {
          name: 'some_tool',
          input: {},
        },
      });

      const result = await parseFromMock(stream);

      expect(result.stopReason).toBe('tool_use');
    });
  });

  describe('empty stream', () => {
    it('should handle a stream with no content blocks', async () => {
      // Minimal stream: just message_start and message_stop
      const events = [
        {
          type: 'message_start',
          message: {
            id: 'msg_empty',
            type: 'message',
            role: 'assistant',
            content: [],
            model: 'claude-sonnet-4-20250514',
            stop_reason: null,
            usage: { input_tokens: 10, output_tokens: 0 },
          },
        },
        {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn' },
          usage: { output_tokens: 0 },
        },
        { type: 'message_stop' },
      ];

      const stream = {
        async *[Symbol.asyncIterator]() {
          for (const event of events) {
            yield event;
          }
        },
      };

      const result = await parseFromMock(stream);

      expect(result.fullText).toBe('');
      expect(result.toolUseBlocks).toHaveLength(0);
      expect(result.events).toContainEqual(
        expect.objectContaining({ type: 'chat:start' })
      );
      expect(result.events).toContainEqual(
        expect.objectContaining({ type: 'chat:end' })
      );
    });
  });
});
