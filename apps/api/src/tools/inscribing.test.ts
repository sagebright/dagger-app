/**
 * Tests for inscribing stage tool handlers
 *
 * Verifies:
 * - update_section updates a single section and queues panel:section event
 * - set_wave populates a wave of sections and queues panel:sections event
 * - set_wave persists sections to DB state
 * - update_section persists updated section to DB state
 * - Entity handlers persist entity data to DB state
 * - invalidate_wave3 marks wave 3 for regeneration and queues event
 * - warn_balance sends a balance warning event
 * - drainInscribingEvents returns and clears pending events
 * - propagate_rename propagates name changes across cached sections
 * - propagate_semantic produces LLM hints for semantic changes
 * - Persistence failures don't block tool results (best-effort)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerInscribingTools,
  drainInscribingEvents,
  clearSectionCache,
  seedSectionCache,
} from './inscribing.js';
import { clearToolHandlers, dispatchToolCalls } from '../services/tool-dispatcher.js';
import type { ToolContext } from '../services/tool-dispatcher.js';
import type { CollectedToolUse } from '../services/stream-parser.js';

// =============================================================================
// Supabase Mock
// =============================================================================

const {
  mockUpdateEq,
  mockUpdate,
  mockSingle,
  mockSelectEq,
  mockSelect,
  mockFrom,
} = vi.hoisted(() => {
  const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
  const mockSingle = vi.fn().mockResolvedValue({
    data: { id: 'state-1', state: {} },
    error: null,
  });
  const mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq });
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });
  return { mockUpdateEq, mockUpdate, mockSingle, mockSelectEq, mockSelect, mockFrom };
});

vi.mock('../services/supabase.js', () => ({
  getSupabase: vi.fn().mockReturnValue({ from: mockFrom }),
}));

const mockContext: ToolContext = { sessionId: 'test-session-id' };

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  clearToolHandlers();
  drainInscribingEvents();
  clearSectionCache();
  registerInscribingTools();
  vi.clearAllMocks();
  // Re-wire mock chain after clearAllMocks
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
  mockSelect.mockReturnValue({ eq: mockSelectEq });
  mockSelectEq.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue({
    data: { id: 'state-1', state: {} },
    error: null,
  });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });
  mockUpdateEq.mockResolvedValue({ error: null });
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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('message is required');
  });
});

// =============================================================================
// set_entity_npcs
// =============================================================================

describe('set_entity_npcs handler', () => {
  const validNPCs = [
    {
      id: 'npc-1',
      name: 'Elder Mira',
      role: 'quest-giver',
      description: 'A wise elder who guards the village secrets.',
      sceneAppearances: ['Scene 1'],
      isEnriched: true,
    },
  ];

  it('returns entity_npcs_set on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-5',
        name: 'set_entity_npcs',
        input: { sceneArcId: 'arc-1', npcs: validNPCs },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('entity_npcs_set');
    expect(parsed.count).toBe(1);
  });

  it('queues a panel:entity_npcs event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-5',
        name: 'set_entity_npcs',
        input: { sceneArcId: 'arc-1', npcs: validNPCs },
      } as CollectedToolUse,
    ], mockContext);

    const events = drainInscribingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:entity_npcs');
  });

  it('returns error when sceneArcId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-5',
        name: 'set_entity_npcs',
        input: { npcs: validNPCs },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcId is required');
  });

  it('returns error when npcs is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-5',
        name: 'set_entity_npcs',
        input: { sceneArcId: 'arc-1' },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('npcs array is required');
  });
});

// =============================================================================
// set_entity_adversaries
// =============================================================================

describe('set_entity_adversaries handler', () => {
  const validAdversaries = [
    {
      id: 'adv-1',
      name: 'Shadow Creeper',
      type: 'minion',
      difficulty: 2,
      quantity: 3,
      sceneAppearances: ['Scene 1'],
      stats: { hp: 4, stress: 2, attack: '+3', damage: '1d6' },
    },
  ];

  it('returns entity_adversaries_set on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-6',
        name: 'set_entity_adversaries',
        input: { sceneArcId: 'arc-1', adversaries: validAdversaries },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('entity_adversaries_set');
    expect(parsed.count).toBe(1);
  });

  it('queues a panel:entity_adversaries event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-6',
        name: 'set_entity_adversaries',
        input: { sceneArcId: 'arc-1', adversaries: validAdversaries },
      } as CollectedToolUse,
    ], mockContext);

    const events = drainInscribingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:entity_adversaries');
  });

  it('returns error when sceneArcId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-6',
        name: 'set_entity_adversaries',
        input: { adversaries: validAdversaries },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcId is required');
  });
});

// =============================================================================
// set_entity_items
// =============================================================================

describe('set_entity_items handler', () => {
  const validItems = [
    {
      id: 'item-1',
      name: 'Flame Tongue Dagger',
      category: 'weapon',
      tier: 2,
      statLine: '1d8+2 fire damage',
      sceneAppearances: ['Scene 2'],
    },
  ];

  it('returns entity_items_set on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-7',
        name: 'set_entity_items',
        input: { sceneArcId: 'arc-1', items: validItems },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('entity_items_set');
    expect(parsed.count).toBe(1);
  });

  it('queues a panel:entity_items event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-7',
        name: 'set_entity_items',
        input: { sceneArcId: 'arc-1', items: validItems },
      } as CollectedToolUse,
    ], mockContext);

    const events = drainInscribingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:entity_items');
  });

  it('returns error when items is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-7',
        name: 'set_entity_items',
        input: { sceneArcId: 'arc-1' },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('items array is required');
  });
});

// =============================================================================
// set_entity_portents
// =============================================================================

describe('set_entity_portents handler', () => {
  const validPortents = [
    {
      category: 'items_clues',
      label: 'Items & Clues',
      entries: [
        {
          id: 'echo-1',
          title: "The Merchant's Ledger",
          sceneBadge: 'Scene 1',
          trigger: 'Search the cart carefully',
          benefit: 'Find a wax-sealed ledger',
          complication: 'Coded messages inside',
        },
      ],
    },
  ];

  it('returns entity_portents_set on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-8',
        name: 'set_entity_portents',
        input: { sceneArcId: 'arc-1', categories: validPortents },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('entity_portents_set');
    expect(parsed.count).toBe(1);
  });

  it('queues a panel:entity_portents event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-8',
        name: 'set_entity_portents',
        input: { sceneArcId: 'arc-1', categories: validPortents },
      } as CollectedToolUse,
    ], mockContext);

    const events = drainInscribingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:entity_portents');
  });

  it('returns error when categories is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-8',
        name: 'set_entity_portents',
        input: { sceneArcId: 'arc-1' },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('categories array is required');
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
    ], mockContext);

    const firstDrain = drainInscribingEvents();
    expect(firstDrain.length).toBe(1);

    const secondDrain = drainInscribingEvents();
    expect(secondDrain.length).toBe(0);
  });
});

// =============================================================================
// propagate_rename
// =============================================================================

describe('propagate_rename handler', () => {
  it('replaces names across cached sections and emits events', async () => {
    seedSectionCache('arc-1', [
      { sectionId: 'setup', content: 'Aldric stands at the gate.' },
      { sectionId: 'developments', content: 'Aldric reveals the secret.' },
      { sectionId: 'transitions', content: 'The party moves on.' },
    ]);

    const result = await dispatchToolCalls([
      {
        id: 'tool-prop-1',
        name: 'propagate_rename',
        input: {
          sceneArcId: 'arc-1',
          oldName: 'Aldric',
          newName: 'Theron',
        },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('rename_propagated');
    expect(parsed.sectionsUpdated).toBe(2);
    expect(parsed.totalReplacements).toBe(2);
  });

  it('emits panel:section events for each updated section', async () => {
    seedSectionCache('arc-1', [
      { sectionId: 'setup', content: 'Aldric greets the party.' },
      { sectionId: 'overview', content: 'Aldric is the village elder.' },
    ]);

    await dispatchToolCalls([
      {
        id: 'tool-prop-2',
        name: 'propagate_rename',
        input: {
          sceneArcId: 'arc-1',
          oldName: 'Aldric',
          newName: 'Theron',
        },
      } as CollectedToolUse,
    ], mockContext);

    const events = drainInscribingEvents();
    const sectionEvents = events.filter((e) => e.type === 'panel:section');
    const propEvent = events.find(
      (e) => e.type === 'panel:propagation_deterministic'
    );

    expect(sectionEvents).toHaveLength(2);
    expect(propEvent).toBeDefined();
  });

  it('excludes the originating section when originSectionId is set', async () => {
    seedSectionCache('arc-1', [
      { sectionId: 'setup', content: 'Aldric stands guard.' },
      { sectionId: 'developments', content: 'Aldric fights bravely.' },
    ]);

    const result = await dispatchToolCalls([
      {
        id: 'tool-prop-3',
        name: 'propagate_rename',
        input: {
          sceneArcId: 'arc-1',
          oldName: 'Aldric',
          newName: 'Theron',
          originSectionId: 'setup',
        },
      } as CollectedToolUse,
    ], mockContext);

    const parsed = JSON.parse(result.toolResults[0].content);
    expect(parsed.sectionsUpdated).toBe(1);
    expect(parsed.totalReplacements).toBe(1);
  });

  it('returns no_propagation_needed when names are identical', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-prop-4',
        name: 'propagate_rename',
        input: {
          sceneArcId: 'arc-1',
          oldName: 'Aldric',
          newName: 'Aldric',
        },
      } as CollectedToolUse,
    ], mockContext);

    const parsed = JSON.parse(result.toolResults[0].content);
    expect(parsed.status).toBe('no_propagation_needed');
  });

  it('returns error when sceneArcId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-prop-5',
        name: 'propagate_rename',
        input: { oldName: 'Aldric', newName: 'Theron' },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcId is required');
  });

  it('returns error when oldName is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-prop-6',
        name: 'propagate_rename',
        input: { sceneArcId: 'arc-1', newName: 'Theron' },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('oldName is required');
  });

  it('returns error when newName is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-prop-7',
        name: 'propagate_rename',
        input: { sceneArcId: 'arc-1', oldName: 'Aldric' },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('newName is required');
  });
});

// =============================================================================
// propagate_semantic
// =============================================================================

describe('propagate_semantic handler', () => {
  it('produces a semantic hint for sections referencing the entity', async () => {
    seedSectionCache('arc-1', [
      { sectionId: 'setup', content: 'Aldric pledges loyalty to the crown.' },
      { sectionId: 'developments', content: 'The merchant sells goods.' },
    ]);

    const result = await dispatchToolCalls([
      {
        id: 'tool-sem-1',
        name: 'propagate_semantic',
        input: {
          sceneArcId: 'arc-1',
          entityName: 'Aldric',
          changeType: 'motivation',
          oldValue: 'Protect the village',
          newValue: 'Betray the village',
        },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('semantic_propagation_hint');
    expect(parsed.affectedSections).toBe(1);
  });

  it('emits a panel:propagation_semantic event', async () => {
    seedSectionCache('arc-1', [
      { sectionId: 'setup', content: 'Aldric stands ready.' },
    ]);

    await dispatchToolCalls([
      {
        id: 'tool-sem-2',
        name: 'propagate_semantic',
        input: {
          sceneArcId: 'arc-1',
          entityName: 'Aldric',
          changeType: 'role',
          oldValue: 'ally',
          newValue: 'antagonist',
        },
      } as CollectedToolUse,
    ], mockContext);

    const events = drainInscribingEvents();
    const semanticEvent = events.find(
      (e) => e.type === 'panel:propagation_semantic'
    );

    expect(semanticEvent).toBeDefined();

    const data = semanticEvent!.data as {
      sceneArcId: string;
      entityName: string;
      changeType: string;
      affectedSectionIds: string[];
    };
    expect(data.sceneArcId).toBe('arc-1');
    expect(data.entityName).toBe('Aldric');
    expect(data.affectedSectionIds).toContain('setup');
  });

  it('returns error when sceneArcId is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-sem-3',
        name: 'propagate_semantic',
        input: {
          entityName: 'Aldric',
          changeType: 'motivation',
          oldValue: 'old',
          newValue: 'new',
        },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcId is required');
  });

  it('returns error when entityName is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-sem-4',
        name: 'propagate_semantic',
        input: {
          sceneArcId: 'arc-1',
          changeType: 'role',
          oldValue: 'old',
          newValue: 'new',
        },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('entityName is required');
  });

  it('returns error when changeType is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-sem-5',
        name: 'propagate_semantic',
        input: {
          sceneArcId: 'arc-1',
          entityName: 'Aldric',
          oldValue: 'old',
          newValue: 'new',
        },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('changeType is required');
  });
});

// =============================================================================
// Persistence: set_wave
// =============================================================================

describe('set_wave persistence', () => {
  const validWaveInput = {
    sceneArcId: 'arc-1',
    wave: 1,
    sections: [
      { sectionId: 'overview', content: 'Scene overview content.' },
      { sectionId: 'setup', content: 'Scene setup content.' },
      { sectionId: 'developments', content: 'Scene developments.' },
    ],
  };

  it('persists sections to inscribingSections in DB state', async () => {
    await dispatchToolCalls([
      { id: 'tool-p1', name: 'set_wave', input: validWaveInput } as CollectedToolUse,
    ], mockContext);

    expect(mockFrom).toHaveBeenCalledWith('sage_adventure_state');
    expect(mockSelect).toHaveBeenCalledWith('id, state');
    expect(mockSelectEq).toHaveBeenCalledWith('session_id', 'test-session-id');

    expect(mockUpdate).toHaveBeenCalled();
    const updatedState = mockUpdate.mock.calls[0][0].state;
    expect(updatedState.inscribingSections).toBeDefined();
    expect(updatedState.inscribingSections['arc-1']).toHaveLength(3);
    expect(updatedState.inscribingSections['arc-1'][0].id).toBe('overview');
    expect(updatedState.inscribingSections['arc-1'][0].content).toBe('Scene overview content.');
  });

  it('merges with existing inscribingSections for other scenes', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'state-1',
        state: {
          inscribingSections: {
            'arc-2': [{ id: 'overview', label: 'Overview', content: 'Other scene.', wave: 1, hasDetail: false }],
          },
        },
      },
      error: null,
    });

    await dispatchToolCalls([
      { id: 'tool-p2', name: 'set_wave', input: validWaveInput } as CollectedToolUse,
    ], mockContext);

    const updatedState = mockUpdate.mock.calls[0][0].state;
    // Existing scene data is preserved
    expect(updatedState.inscribingSections['arc-2']).toHaveLength(1);
    // New scene data is added
    expect(updatedState.inscribingSections['arc-1']).toHaveLength(3);
  });

  it('still succeeds when DB persistence fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection lost' },
    });

    const result = await dispatchToolCalls([
      { id: 'tool-p3', name: 'set_wave', input: validWaveInput } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();
    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('wave_populated');
  });
});

// =============================================================================
// Persistence: update_section
// =============================================================================

describe('update_section persistence', () => {
  it('persists updated section to inscribingSections in DB state', async () => {
    // Pre-existing sections for arc-1
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'state-1',
        state: {
          inscribingSections: {
            'arc-1': [
              { id: 'overview', label: 'Overview', content: 'Old overview.', wave: 1, hasDetail: false },
              { id: 'setup', label: 'Setup', content: 'Old setup.', wave: 1, hasDetail: true },
            ],
          },
        },
      },
      error: null,
    });

    await dispatchToolCalls([
      {
        id: 'tool-p4',
        name: 'update_section',
        input: {
          sceneArcId: 'arc-1',
          sectionId: 'overview',
          content: 'New overview content.',
        },
      } as CollectedToolUse,
    ], mockContext);

    expect(mockUpdate).toHaveBeenCalled();
    const updatedState = mockUpdate.mock.calls[0][0].state;
    const sections = updatedState.inscribingSections['arc-1'];
    const overview = sections.find((s: { id: string }) => s.id === 'overview');
    expect(overview.content).toBe('New overview content.');
    // Other sections unchanged
    const setup = sections.find((s: { id: string }) => s.id === 'setup');
    expect(setup.content).toBe('Old setup.');
  });

  it('still succeeds when DB persistence fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection lost' },
    });

    const result = await dispatchToolCalls([
      {
        id: 'tool-p5',
        name: 'update_section',
        input: {
          sceneArcId: 'arc-1',
          sectionId: 'overview',
          content: 'New content.',
        },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();
    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('section_updated');
  });
});

// =============================================================================
// Persistence: entity handlers
// =============================================================================

describe('entity handler persistence', () => {
  const validNPCs = [
    {
      id: 'npc-1',
      name: 'Elder Mira',
      role: 'quest-giver',
      description: 'A wise elder.',
      sceneAppearances: ['Scene 1'],
      isEnriched: true,
    },
  ];

  it('set_entity_npcs persists entity data to DB state', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'state-1',
        state: {
          inscribingSections: {
            'arc-1': [
              { id: 'npcs_present', label: 'NPCs', content: '', wave: 2, hasDetail: false },
            ],
          },
        },
      },
      error: null,
    });

    await dispatchToolCalls([
      {
        id: 'tool-pe1',
        name: 'set_entity_npcs',
        input: { sceneArcId: 'arc-1', npcs: validNPCs },
      } as CollectedToolUse,
    ], mockContext);

    expect(mockUpdate).toHaveBeenCalled();
    const updatedState = mockUpdate.mock.calls[0][0].state;
    const section = updatedState.inscribingSections['arc-1'].find(
      (s: { id: string }) => s.id === 'npcs_present'
    );
    expect(section.entityNPCs).toEqual(validNPCs);
  });

  it('set_entity_adversaries persists entity data to DB state', async () => {
    const validAdversaries = [
      {
        id: 'adv-1',
        name: 'Shadow Creeper',
        type: 'minion',
        difficulty: 2,
        quantity: 3,
        sceneAppearances: ['Scene 1'],
        stats: { hp: 4, stress: 2, attack: '+3', damage: '1d6' },
      },
    ];

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'state-1',
        state: {
          inscribingSections: {
            'arc-1': [
              { id: 'adversaries', label: 'Adversaries', content: '', wave: 2, hasDetail: false },
            ],
          },
        },
      },
      error: null,
    });

    await dispatchToolCalls([
      {
        id: 'tool-pe2',
        name: 'set_entity_adversaries',
        input: { sceneArcId: 'arc-1', adversaries: validAdversaries },
      } as CollectedToolUse,
    ], mockContext);

    expect(mockUpdate).toHaveBeenCalled();
    const updatedState = mockUpdate.mock.calls[0][0].state;
    const section = updatedState.inscribingSections['arc-1'].find(
      (s: { id: string }) => s.id === 'adversaries'
    );
    expect(section.entityAdversaries).toEqual(validAdversaries);
  });

  it('set_entity_items persists entity data to DB state', async () => {
    const validItems = [
      {
        id: 'item-1',
        name: 'Flame Tongue Dagger',
        category: 'weapon',
        tier: 2,
        statLine: '1d8+2 fire damage',
        sceneAppearances: ['Scene 2'],
      },
    ];

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'state-1',
        state: {
          inscribingSections: {
            'arc-1': [
              { id: 'items', label: 'Items', content: '', wave: 2, hasDetail: false },
            ],
          },
        },
      },
      error: null,
    });

    await dispatchToolCalls([
      {
        id: 'tool-pe3',
        name: 'set_entity_items',
        input: { sceneArcId: 'arc-1', items: validItems },
      } as CollectedToolUse,
    ], mockContext);

    expect(mockUpdate).toHaveBeenCalled();
    const updatedState = mockUpdate.mock.calls[0][0].state;
    const section = updatedState.inscribingSections['arc-1'].find(
      (s: { id: string }) => s.id === 'items'
    );
    expect(section.entityItems).toEqual(validItems);
  });

  it('set_entity_portents persists entity data to DB state', async () => {
    const validPortents = [
      {
        category: 'items_clues',
        label: 'Items & Clues',
        entries: [
          {
            id: 'echo-1',
            title: "The Merchant's Ledger",
            sceneBadge: 'Scene 1',
            trigger: 'Search the cart',
            benefit: 'Find a ledger',
            complication: 'Coded messages',
          },
        ],
      },
    ];

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'state-1',
        state: {
          inscribingSections: {
            'arc-1': [
              { id: 'portents', label: 'Portents', content: '', wave: 3, hasDetail: false },
            ],
          },
        },
      },
      error: null,
    });

    await dispatchToolCalls([
      {
        id: 'tool-pe4',
        name: 'set_entity_portents',
        input: { sceneArcId: 'arc-1', categories: validPortents },
      } as CollectedToolUse,
    ], mockContext);

    expect(mockUpdate).toHaveBeenCalled();
    const updatedState = mockUpdate.mock.calls[0][0].state;
    const section = updatedState.inscribingSections['arc-1'].find(
      (s: { id: string }) => s.id === 'portents'
    );
    expect(section.entityPortents).toEqual(validPortents);
  });

  it('entity handler still succeeds when DB persistence fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection lost' },
    });

    const result = await dispatchToolCalls([
      {
        id: 'tool-pe5',
        name: 'set_entity_npcs',
        input: { sceneArcId: 'arc-1', npcs: validNPCs },
      } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();
    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('entity_npcs_set');
  });
});
