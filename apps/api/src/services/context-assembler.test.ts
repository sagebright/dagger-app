/**
 * Tests for context-assembler.ts
 *
 * Verifies assembleAnthropicPayload:
 * - Builds system prompt with persona + stage augmentation + state context
 * - Includes correct tools for each stage
 * - Compresses conversation history
 * - Adds the current user message at the end
 * - Reports metadata accurately
 */

import { describe, it, expect } from 'vitest';
import { assembleAnthropicPayload } from './context-assembler.js';
import { createEmptyAdventureState } from '@sage-codex/shared-types';
import type { AdventureState, SageMessage } from '@sage-codex/shared-types';

// =============================================================================
// Fixtures
// =============================================================================

function createSageMessage(
  role: 'user' | 'assistant',
  content: string,
  index: number
): SageMessage {
  return {
    id: `msg-${index}`,
    session_id: 'session-1',
    role,
    content,
    tool_calls: null,
    token_count: null,
    created_at: new Date(Date.now() - (100 - index) * 60000).toISOString(),
  };
}

function createConversationHistory(count: number): SageMessage[] {
  const messages: SageMessage[] = [];
  for (let i = 0; i < count; i++) {
    const role = i % 2 === 0 ? 'user' : 'assistant';
    messages.push(createSageMessage(role as 'user' | 'assistant', `Message ${i}`, i));
  }
  return messages;
}

function createPopulatedState(): AdventureState {
  const state = createEmptyAdventureState();
  state.spark = { name: 'Test Adventure', vision: 'A test adventure' };
  state.components.tier = 2;
  state.components.tenor = 'serious';
  return state;
}

// =============================================================================
// Tests
// =============================================================================

describe('assembleAnthropicPayload', () => {
  describe('system prompt', () => {
    it('should include the Sage persona in the system prompt', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      expect(result.streamOptions.systemPrompt).toContain('Sage');
      expect(result.streamOptions.systemPrompt).toContain('Daggerheart');
    });

    it('should include stage-specific instructions', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      expect(result.streamOptions.systemPrompt).toContain('Invoking');
      expect(result.streamOptions.systemPrompt).toContain('spark');
    });

    it('should include serialized state when state has content', () => {
      const state = createPopulatedState();
      const result = assembleAnthropicPayload({
        state,
        stage: 'attuning',
        conversationHistory: [],
        userMessage: 'Set tier to 2',
      });

      expect(result.streamOptions.systemPrompt).toContain('ADVENTURE STATE');
      expect(result.streamOptions.systemPrompt).toContain('Test Adventure');
    });

    it('should NOT include adventure state section when state is empty', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      expect(result.streamOptions.systemPrompt).not.toContain('ADVENTURE STATE');
    });
  });

  describe('tools', () => {
    it('should include universal tools for any stage', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      const toolNames = result.streamOptions.tools?.map((t) => t.name) ?? [];
      expect(toolNames).toContain('signal_ready');
      expect(toolNames).toContain('suggest_adventure_name');
    });

    it('should include stage-specific tools for invoking', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      const toolNames = result.streamOptions.tools?.map((t) => t.name) ?? [];
      expect(toolNames).toContain('set_spark');
    });

    it('should include inscribing-specific tools', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'inscribing',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      const toolNames = result.streamOptions.tools?.map((t) => t.name) ?? [];
      expect(toolNames).toContain('update_section');
      expect(toolNames).toContain('set_wave');
      expect(toolNames).toContain('invalidate_wave3');
      expect(toolNames).toContain('warn_balance');
      expect(toolNames).toContain('confirm_scene');
      expect(toolNames).toContain('query_adversaries');
    });
  });

  describe('messages', () => {
    it('should include the current user message as the last message', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: [],
        userMessage: 'I want a dark fantasy adventure',
      });

      const messages = result.streamOptions.messages;
      expect(messages[messages.length - 1]).toEqual({
        role: 'user',
        content: 'I want a dark fantasy adventure',
      });
    });

    it('should include compressed conversation history before the current message', () => {
      const history = createConversationHistory(4);
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: history,
        userMessage: 'Next message',
      });

      // 4 history messages + 1 current = 5 total
      expect(result.streamOptions.messages.length).toBe(5);
    });
  });

  describe('metadata', () => {
    it('should report system prompt length', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      expect(result.metadata.systemPromptLength).toBeGreaterThan(0);
    });

    it('should report tool count', () => {
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      // Universal (2) + invoking (1) = 3
      expect(result.metadata.toolCount).toBe(3);
    });

    it('should report message count', () => {
      const history = createConversationHistory(6);
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: history,
        userMessage: 'Hello',
      });

      expect(result.metadata.messageCount).toBe(7); // 6 history + 1 current
    });

    it('should report tiers included', () => {
      const state = createPopulatedState();
      const result = assembleAnthropicPayload({
        state,
        stage: 'attuning',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      expect(result.metadata.tiersIncluded).toContain('T1');
    });
  });

  describe('token budget estimates', () => {
    it('should keep system prompt under reasonable character limit', () => {
      const state = createPopulatedState();
      const result = assembleAnthropicPayload({
        state,
        stage: 'inscribing',
        conversationHistory: [],
        userMessage: 'Hello',
      });

      // System prompt should stay well under 20K characters (~5K tokens)
      expect(result.metadata.systemPromptLength).toBeLessThan(20000);
    });

    it('should handle large conversation history without exceeding limits', () => {
      const history = createConversationHistory(100);
      const result = assembleAnthropicPayload({
        state: createEmptyAdventureState(),
        stage: 'invoking',
        conversationHistory: history,
        userMessage: 'Hello',
      });

      // Should compress to MAX_TOTAL_MESSAGES (30) + 1 current
      expect(result.metadata.messageCount).toBeLessThanOrEqual(31);
      expect(result.metadata.compressedMessageCount).toBeGreaterThan(0);
    });
  });
});
