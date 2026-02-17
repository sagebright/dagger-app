/**
 * Tests for tool-dispatcher service
 *
 * Verifies that tool_use blocks are dispatched correctly:
 * - Registered handlers are called with the correct input
 * - Unknown tools produce error results
 * - Handler errors are caught and reported
 * - SSE events are emitted for each tool lifecycle
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  dispatchToolCalls,
  registerToolHandler,
  clearToolHandlers,
} from './tool-dispatcher.js';
import type { CollectedToolUse } from './stream-parser.js';

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  clearToolHandlers();
});

// =============================================================================
// Tests
// =============================================================================

describe('dispatchToolCalls', () => {
  describe('with registered handlers', () => {
    it('should call the handler and return a successful result', async () => {
      registerToolHandler('echo', async (input) => ({
        result: { echoed: input },
        isError: false,
      }));

      const toolUse: CollectedToolUse = {
        id: 'toolu_001',
        name: 'echo',
        input: { text: 'hello' },
      };

      const dispatch = await dispatchToolCalls([toolUse]);

      expect(dispatch.toolResults).toHaveLength(1);
      expect(dispatch.toolResults[0].tool_use_id).toBe('toolu_001');
      expect(dispatch.toolResults[0].is_error).toBeUndefined();
    });

    it('should emit tool:start and tool:end events', async () => {
      registerToolHandler('greet', async () => ({
        result: 'hi',
        isError: false,
      }));

      const toolUse: CollectedToolUse = {
        id: 'toolu_002',
        name: 'greet',
        input: {},
      };

      const dispatch = await dispatchToolCalls([toolUse]);
      const eventTypes = dispatch.events.map((e) => e.type);

      expect(eventTypes).toEqual(['tool:start', 'tool:end']);
    });

    it('should pass the correct input to the handler', async () => {
      let receivedInput: Record<string, unknown> = {};
      registerToolHandler('capture', async (input) => {
        receivedInput = input;
        return { result: 'ok', isError: false };
      });

      const toolUse: CollectedToolUse = {
        id: 'toolu_003',
        name: 'capture',
        input: { tier: 2, type: 'undead' },
      };

      await dispatchToolCalls([toolUse]);

      expect(receivedInput).toEqual({ tier: 2, type: 'undead' });
    });
  });

  describe('with unknown tools', () => {
    it('should return an error result for unregistered tools', async () => {
      const toolUse: CollectedToolUse = {
        id: 'toolu_004',
        name: 'nonexistent_tool',
        input: {},
      };

      const dispatch = await dispatchToolCalls([toolUse]);

      expect(dispatch.toolResults).toHaveLength(1);
      expect(dispatch.toolResults[0].is_error).toBe(true);
      expect(dispatch.toolResults[0].content).toContain('Unknown tool');
    });

    it('should still emit tool:start and tool:end events', async () => {
      const toolUse: CollectedToolUse = {
        id: 'toolu_005',
        name: 'missing',
        input: {},
      };

      const dispatch = await dispatchToolCalls([toolUse]);
      const eventTypes = dispatch.events.map((e) => e.type);

      expect(eventTypes).toEqual(['tool:start', 'tool:end']);
    });
  });

  describe('handler errors', () => {
    it('should catch handler exceptions and return an error result', async () => {
      registerToolHandler('failing', async () => {
        throw new Error('Database connection lost');
      });

      const toolUse: CollectedToolUse = {
        id: 'toolu_006',
        name: 'failing',
        input: {},
      };

      const dispatch = await dispatchToolCalls([toolUse]);

      expect(dispatch.toolResults[0].is_error).toBe(true);
      expect(dispatch.toolResults[0].content).toContain(
        'Database connection lost'
      );
    });
  });

  describe('multiple tool calls', () => {
    it('should dispatch all tools sequentially', async () => {
      const callOrder: string[] = [];

      registerToolHandler('first', async () => {
        callOrder.push('first');
        return { result: 'ok', isError: false };
      });

      registerToolHandler('second', async () => {
        callOrder.push('second');
        return { result: 'ok', isError: false };
      });

      const toolUses: CollectedToolUse[] = [
        { id: 'toolu_a', name: 'first', input: {} },
        { id: 'toolu_b', name: 'second', input: {} },
      ];

      const dispatch = await dispatchToolCalls(toolUses);

      expect(callOrder).toEqual(['first', 'second']);
      expect(dispatch.toolResults).toHaveLength(2);
      expect(dispatch.events).toHaveLength(4); // 2 starts + 2 ends
    });
  });

  describe('empty tool list', () => {
    it('should return empty results for no tools', async () => {
      const dispatch = await dispatchToolCalls([]);

      expect(dispatch.events).toHaveLength(0);
      expect(dispatch.toolResults).toHaveLength(0);
    });
  });
});
