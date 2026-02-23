/**
 * Tests for system-prompt.ts
 *
 * Verifies:
 * - buildSystemPrompt includes base persona for all stages
 * - buildSystemPrompt includes stage-specific augmentation
 * - Each stage includes correct tool names
 * - Base persona contains required elements
 */

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, getBasePersona, getStageAugment } from './system-prompt.js';
import type { Stage } from '@sage-codex/shared-types';

// =============================================================================
// Tests
// =============================================================================

describe('buildSystemPrompt', () => {
  const ALL_STAGES: Stage[] = [
    'invoking', 'attuning', 'binding', 'weaving', 'inscribing', 'delivering',
  ];

  it('should include the Sage persona for all stages', () => {
    for (const stage of ALL_STAGES) {
      const prompt = buildSystemPrompt(stage);
      expect(prompt).toContain('Sage');
      expect(prompt).toContain('Daggerheart');
    }
  });

  it('should include stage-specific content', () => {
    const invokingPrompt = buildSystemPrompt('invoking');
    expect(invokingPrompt).toContain('Invoking');
    expect(invokingPrompt).toContain('spark');

    const attuningPrompt = buildSystemPrompt('attuning');
    expect(attuningPrompt).toContain('Attuning');
    expect(attuningPrompt).toContain('component');

    const weavingPrompt = buildSystemPrompt('weaving');
    expect(weavingPrompt).toContain('Weaving');
    expect(weavingPrompt).toContain('scene arc');
  });

  it('should include progressive spark capture instructions for invoking', () => {
    const prompt = buildSystemPrompt('invoking');
    expect(prompt).toContain('set_spark');
    expect(prompt).toContain('signal_ready');
    expect(prompt).toContain('again');
    expect(prompt).toContain('Progressive spark capture');
  });

  it('should include available tool names for invoking', () => {
    const prompt = buildSystemPrompt('invoking');
    expect(prompt).toContain('signal_ready');
    expect(prompt).toContain('suggest_adventure_name');
    expect(prompt).toContain('set_spark');
  });

  it('should include available tool names for attuning', () => {
    const prompt = buildSystemPrompt('attuning');
    expect(prompt).toContain('set_component');
  });

  it('should include available tool names for inscribing', () => {
    const prompt = buildSystemPrompt('inscribing');
    expect(prompt).toContain('update_section');
    expect(prompt).toContain('set_wave');
    expect(prompt).toContain('invalidate_wave3');
    expect(prompt).toContain('warn_balance');
    expect(prompt).toContain('confirm_scene');
    expect(prompt).toContain('query_adversaries');
    expect(prompt).toContain('query_items');
  });
});

describe('getBasePersona', () => {
  it('should contain the Sage character description', () => {
    const persona = getBasePersona();
    expect(persona).toContain('Sage');
    expect(persona).toContain('keeper of the Codex');
  });

  it('should contain Daggerheart expertise', () => {
    const persona = getBasePersona();
    expect(persona).toContain('Daggerheart');
    expect(persona).toContain('tiers');
  });

  it('should contain tool usage instructions', () => {
    const persona = getBasePersona();
    expect(persona).toContain('tool');
  });
});

describe('getStageAugment', () => {
  it('should return different content for each stage', () => {
    const invoking = getStageAugment('invoking');
    const attuning = getStageAugment('attuning');
    expect(invoking).not.toBe(attuning);
  });

  it('should include constraints for each stage', () => {
    const stages: Stage[] = [
      'invoking', 'attuning', 'binding', 'weaving', 'inscribing', 'delivering',
    ];
    for (const stage of stages) {
      const augment = getStageAugment(stage);
      expect(augment).toContain('Constraint');
    }
  });

  describe('binding stage Spark alignment', () => {
    it('should include CRITICAL Spark alignment block', () => {
      const augment = getStageAugment('binding');
      expect(augment).toContain('CRITICAL — Spark alignment');
    });

    it('should instruct grounding incitingIncident in the Spark premise', () => {
      const augment = getStageAugment('binding');
      expect(augment).toContain('incitingIncident');
      expect(augment).toContain('Spark');
      expect(augment).toContain('story seed');
    });

    it('should prohibit replacing the Spark with unrelated catalysts', () => {
      const augment = getStageAugment('binding');
      expect(augment).toContain('unrelated catalyst');
    });

    it('should require incorporating Spark details into frames', () => {
      const augment = getStageAugment('binding');
      expect(augment).toContain('themes, and conflicts from the Spark');
    });
  });
});
