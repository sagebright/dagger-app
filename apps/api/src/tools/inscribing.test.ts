/**
 * Tests for inscribing stage tool handlers
 *
 * Verifies:
 * - update_section updates a single section and queues panel:section event
 * - set_wave populates a wave of sections and queues panel:sections event
 * - invalidate_wave3 marks wave 3 for regeneration and queues event
 * - warn_balance sends a balance warning event
 * - drainInscribingEvents returns and clears pending events
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerInscribingTools,
  drainInscribingEvents,
} from './inscribing.js';
import { clearToolHandlers, dispatchToolCalls } from '../services/tool-dispatcher.js';
import type { CollectedToolUse } from '../services/stream-parser.js';

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  clearToolHandlers();
  drainInscribingEvents();
  registerInscribingTools();
});

// =============================================================================
// update_section
// =============================================================================

describe('update_section handler', () => {
  it('returns section_updated on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-1',
        name: 'update_section',
        input: {
          sceneArcId: 'arc-1',
          sectionId: 'overview',
          content: 'The party arrives at the haunted crossroads.',
        },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('section_updated');
    expect(parsed.sceneArcId).toBe('arc-1');
    expect(parsed.sectionId).toBe('overview');
  });

  it('queues a panel:section event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-1',
        name: 'update_section',
        input: {
          sceneArcId: 'arc-1',
          sectionId: 'setup',
          content: 'A thick fog rolls in as the caravan stops.',
        },
      } as CollectedToolUse,
    ]);

    const events = drainInscribingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:section');

    const data = events[0].data as {
      sceneArcId: string;
      sectionId: string;
      content: string;
      streaming: boolean;
    };
    expect(data.sceneArcId).toBe('arc-1');
    expect(data.sectionId).toBe('setup');
    expect(data.content).toBe('A thick fog rolls in as the caravan stops.');
    expect(data.streaming).toBe(false);
  });

  it('returns error when sceneArcId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-1',
        name: 'update_section',
        input: { sectionId: 'overview', content: 'test' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcId is required');
  });

  it('returns error when sectionId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-1',
        name: 'update_section',
        input: { sceneArcId: 'arc-1', content: 'test' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sectionId is required');
  });

  it('returns error when content is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-1',
        name: 'update_section',
        input: { sceneArcId: 'arc-1', sectionId: 'overview' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('content is required');
  });
});

// =============================================================================
// set_wave
// =============================================================================

describe('set_wave handler', () => {
  const validInput = {
    sceneArcId: 'arc-1',
    wave: 1,
    sections: [
      { sectionId: 'overview', content: 'Scene overview content.' },
      { sectionId: 'setup', content: 'Scene setup content.' },
      { sectionId: 'developments', content: 'Scene developments.' },
    ],
  };

  it('returns wave_populated on valid input', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-2', name: 'set_wave', input: validInput } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('wave_populated');
    expect(parsed.wave).toBe(1);
    expect(parsed.sectionCount).toBe(3);
  });

  it('queues a panel:sections event', async () => {
    await dispatchToolCalls([
      { id: 'tool-2', name: 'set_wave', input: validInput } as CollectedToolUse,
    ]);

    const events = drainInscribingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:sections');

    const data = events[0].data as {
      sceneArcId: string;
      wave: number;
      sections: Array<{ id: string; content: string }>;
    };
    expect(data.sceneArcId).toBe('arc-1');
    expect(data.wave).toBe(1);
    expect(data.sections.length).toBe(3);
  });

  it('returns error when sceneArcId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'set_wave',
        input: { wave: 1, sections: [] },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcId is required');
  });

  it('returns error when wave is invalid', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'set_wave',
        input: { sceneArcId: 'arc-1', wave: 4, sections: [] },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('wave must be 1, 2, or 3');
  });

  it('returns error when sections is empty', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'set_wave',
        input: { sceneArcId: 'arc-1', wave: 1, sections: [] },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sections array must not be empty');
  });
});

// =============================================================================
// invalidate_wave3
// =============================================================================

describe('invalidate_wave3 handler', () => {
  it('returns wave3_invalidated on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-3',
        name: 'invalidate_wave3',
        input: {
          sceneArcId: 'arc-1',
          reason: 'Developments section was revised with new story elements',
        },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('wave3_invalidated');
    expect(parsed.sceneArcId).toBe('arc-1');
  });

  it('queues a panel:wave3_invalidated event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-3',
        name: 'invalidate_wave3',
        input: {
          sceneArcId: 'arc-1',
          reason: 'NPC roster changed',
        },
      } as CollectedToolUse,
    ]);

    const events = drainInscribingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:wave3_invalidated');

    const data = events[0].data as { sceneArcId: string; reason: string };
    expect(data.sceneArcId).toBe('arc-1');
    expect(data.reason).toBe('NPC roster changed');
  });

  it('returns error when sceneArcId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-3',
        name: 'invalidate_wave3',
        input: { reason: 'test' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcId is required');
  });

  it('returns error when reason is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-3',
        name: 'invalidate_wave3',
        input: { sceneArcId: 'arc-1' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('reason is required');
  });
});

// =============================================================================
// warn_balance
// =============================================================================

describe('warn_balance handler', () => {
  it('returns balance_warning_sent on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-4',
        name: 'warn_balance',
        input: {
          sceneArcId: 'arc-1',
          message: 'Three solo adversaries in one scene may overwhelm a tier 1 party.',
        },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('balance_warning_sent');
    expect(parsed.sceneArcId).toBe('arc-1');
  });

  it('queues a panel:balance_warning event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-4',
        name: 'warn_balance',
        input: {
          sceneArcId: 'arc-2',
          message: 'No adversaries assigned.',
          sectionId: 'adversaries',
        },
      } as CollectedToolUse,
    ]);

    const events = drainInscribingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:balance_warning');

    const data = events[0].data as {
      sceneArcId: string;
      message: string;
      sectionId?: string;
    };
    expect(data.sceneArcId).toBe('arc-2');
    expect(data.message).toBe('No adversaries assigned.');
    expect(data.sectionId).toBe('adversaries');
  });

  it('returns error when sceneArcId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-4',
        name: 'warn_balance',
        input: { message: 'test' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcId is required');
  });

  it('returns error when message is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-4',
        name: 'warn_balance',
        input: { sceneArcId: 'arc-1' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('message is required');
  });
});

// =============================================================================
// drainInscribingEvents
// =============================================================================

describe('drainInscribingEvents', () => {
  it('returns empty array when no events pending', () => {
    const events = drainInscribingEvents();
    expect(events).toEqual([]);
  });

  it('clears events after draining', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-1',
        name: 'update_section',
        input: {
          sceneArcId: 'arc-1',
          sectionId: 'overview',
          content: 'Test content',
        },
      } as CollectedToolUse,
    ]);

    const firstDrain = drainInscribingEvents();
    expect(firstDrain.length).toBe(1);

    const secondDrain = drainInscribingEvents();
    expect(secondDrain.length).toBe(0);
  });
});
