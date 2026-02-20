/**
 * Tests for tool definitions
 *
 * Verifies:
 * - Each stage returns tools with valid schemas
 * - Universal tools are present in all stages
 * - Stage-specific tools are only present in their stage
 * - Tool names are unique within each stage
 */

import { describe, it, expect } from 'vitest';
import { getToolsForStage, getUniversalTools, getToolNamesForStage } from './definitions.js';
import type { Stage } from '@sage-codex/shared-types';

// =============================================================================
// Tests
// =============================================================================

describe('getToolsForStage', () => {
  const ALL_STAGES: Stage[] = [
    'invoking', 'attuning', 'binding', 'weaving', 'inscribing', 'delivering',
  ];

  it('should include universal tools in all stages', () => {
    const universalNames = getUniversalTools().map((t) => t.name);

    for (const stage of ALL_STAGES) {
      const stageTools = getToolsForStage(stage);
      const stageNames = stageTools.map((t) => t.name);

      for (const name of universalNames) {
        expect(stageNames).toContain(name);
      }
    }
  });

  it('should include set_spark only in invoking', () => {
    expect(getToolNamesForStage('invoking')).toContain('set_spark');
    expect(getToolNamesForStage('attuning')).not.toContain('set_spark');
    expect(getToolNamesForStage('weaving')).not.toContain('set_spark');
  });

  it('should include set_component only in attuning', () => {
    expect(getToolNamesForStage('attuning')).toContain('set_component');
    expect(getToolNamesForStage('invoking')).not.toContain('set_component');
    expect(getToolNamesForStage('weaving')).not.toContain('set_component');
  });

  it('should include query_frames only in binding', () => {
    expect(getToolNamesForStage('binding')).toContain('query_frames');
    expect(getToolNamesForStage('invoking')).not.toContain('query_frames');
  });

  it('should include weaving-specific tools', () => {
    const names = getToolNamesForStage('weaving');
    expect(names).toContain('set_all_scene_arcs');
    expect(names).toContain('set_scene_arc');
    expect(names).toContain('reorder_scenes');
    expect(getToolNamesForStage('inscribing')).not.toContain('set_all_scene_arcs');
  });

  it('should include inscribing-specific tools', () => {
    const names = getToolNamesForStage('inscribing');
    expect(names).toContain('update_section');
    expect(names).toContain('set_wave');
    expect(names).toContain('invalidate_wave3');
    expect(names).toContain('warn_balance');
    expect(names).toContain('confirm_scene');
    expect(names).toContain('query_adversaries');
    expect(names).toContain('query_items');
  });

  it('should include finalize_adventure only in delivering', () => {
    expect(getToolNamesForStage('delivering')).toContain('finalize_adventure');
    expect(getToolNamesForStage('inscribing')).not.toContain('finalize_adventure');
  });
});

describe('tool schema validity', () => {
  const ALL_STAGES: Stage[] = [
    'invoking', 'attuning', 'binding', 'weaving', 'inscribing', 'delivering',
  ];

  it('every tool should have name, description, and inputSchema', () => {
    for (const stage of ALL_STAGES) {
      const tools = getToolsForStage(stage);
      for (const tool of tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
        expect(tool.inputSchema.type).toBe('object');
      }
    }
  });

  it('tool names should be unique within each stage', () => {
    for (const stage of ALL_STAGES) {
      const names = getToolNamesForStage(stage);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    }
  });
});

describe('getUniversalTools', () => {
  it('should return signal_ready and suggest_adventure_name', () => {
    const tools = getUniversalTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain('signal_ready');
    expect(names).toContain('suggest_adventure_name');
  });

  it('should return new arrays each call (no mutation risk)', () => {
    const tools1 = getUniversalTools();
    const tools2 = getUniversalTools();
    expect(tools1).not.toBe(tools2);
  });
});
