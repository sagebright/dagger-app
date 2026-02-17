/**
 * Tests for weaving stage tool handlers
 *
 * Verifies:
 * - set_all_scene_arcs populates all scenes and queues panel:scene_arcs event
 * - set_scene_arc updates a single scene and queues panel:scene_arc event
 * - reorder_scenes validates input and returns reorder confirmation
 * - suggest_adventure_name queues panel:name event
 * - drainWeavingEvents returns and clears pending events
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerWeavingTools,
  drainWeavingEvents,
} from './weaving.js';
import { clearToolHandlers, dispatchToolCalls } from '../services/tool-dispatcher.js';
import type { CollectedToolUse } from '../services/stream-parser.js';

// =============================================================================
// Setup
// =============================================================================

beforeEach(() => {
  clearToolHandlers();
  drainWeavingEvents();
  registerWeavingTools();
});

// =============================================================================
// set_all_scene_arcs
// =============================================================================

describe('set_all_scene_arcs handler', () => {
  const validInput = {
    sceneArcs: [
      {
        id: 'arc-1',
        sceneNumber: 1,
        title: 'The Overgrown Road',
        subtitle: 'A caravan burns',
        description: 'The party arrives at a trade route consumed by the Witherwild.',
      },
      {
        id: 'arc-2',
        sceneNumber: 2,
        title: 'Wickling Hollow',
        description: 'A hidden forest settlement.',
      },
    ],
  };

  it('returns scene_arcs_populated on valid input', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-1', name: 'set_all_scene_arcs', input: validInput } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('scene_arcs_populated');
    expect(parsed.count).toBe(2);
    expect(parsed.scenes[0].title).toBe('The Overgrown Road');
    expect(parsed.scenes[1].title).toBe('Wickling Hollow');
  });

  it('queues a panel:scene_arcs event', async () => {
    await dispatchToolCalls([
      { id: 'tool-1', name: 'set_all_scene_arcs', input: validInput } as CollectedToolUse,
    ]);

    const events = drainWeavingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:scene_arcs');

    const data = events[0].data as {
      sceneArcs: Array<{ id: string; title: string; confirmed: boolean }>;
      activeSceneIndex: number;
    };
    expect(data.sceneArcs.length).toBe(2);
    expect(data.activeSceneIndex).toBe(0);
    expect(data.sceneArcs[0].confirmed).toBe(false);
  });

  it('returns error when sceneArcs is missing', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-1', name: 'set_all_scene_arcs', input: {} } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcs array is required');
  });

  it('returns error when sceneArcs is empty', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-1', name: 'set_all_scene_arcs', input: { sceneArcs: [] } } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('at least one scene');
  });
});

// =============================================================================
// set_scene_arc
// =============================================================================

describe('set_scene_arc handler', () => {
  it('returns scene_arc_updated on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'set_scene_arc',
        input: {
          sceneIndex: 0,
          sceneArc: {
            id: 'arc-1',
            sceneNumber: 1,
            title: 'The Burning Caravan',
            description: 'Revised scene with more urgency.',
          },
        },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('scene_arc_updated');
    expect(parsed.sceneIndex).toBe(0);
    expect(parsed.title).toBe('The Burning Caravan');
  });

  it('queues a panel:scene_arc event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'set_scene_arc',
        input: {
          sceneIndex: 1,
          sceneArc: {
            id: 'arc-2',
            sceneNumber: 2,
            title: 'Updated Hollow',
            description: 'Updated description.',
          },
        },
      } as CollectedToolUse,
    ]);

    const events = drainWeavingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:scene_arc');

    const data = events[0].data as {
      sceneIndex: number;
      sceneArc: { title: string; confirmed: boolean };
      streaming: boolean;
    };
    expect(data.sceneIndex).toBe(1);
    expect(data.sceneArc.title).toBe('Updated Hollow');
    expect(data.sceneArc.confirmed).toBe(false);
    expect(data.streaming).toBe(false);
  });

  it('returns error when sceneIndex is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'set_scene_arc',
        input: {
          sceneArc: { id: 'a', sceneNumber: 1, title: 'Test', description: 'Test' },
        },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneIndex');
  });

  it('returns error when sceneArc title is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'set_scene_arc',
        input: {
          sceneIndex: 0,
          sceneArc: { id: 'a', sceneNumber: 1, description: 'No title' },
        },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArc with title is required');
  });
});

// =============================================================================
// reorder_scenes
// =============================================================================

describe('reorder_scenes handler', () => {
  it('returns scenes_reordered on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-3',
        name: 'reorder_scenes',
        input: { order: ['arc-2', 'arc-1', 'arc-3'] },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('scenes_reordered');
    expect(parsed.order).toEqual(['arc-2', 'arc-1', 'arc-3']);
  });

  it('returns error when order is missing', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-3', name: 'reorder_scenes', input: {} } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('order array');
  });

  it('returns error when order is empty', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-3', name: 'reorder_scenes', input: { order: [] } } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('at least one scene ID');
  });
});

// =============================================================================
// suggest_adventure_name
// =============================================================================

describe('suggest_adventure_name handler', () => {
  it('returns name_suggested on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-4',
        name: 'suggest_adventure_name',
        input: { name: 'Calamity in the Witherwild', reason: 'Matches the frame' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('name_suggested');
    expect(parsed.name).toBe('Calamity in the Witherwild');
  });

  it('queues a panel:name event', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-4',
        name: 'suggest_adventure_name',
        input: { name: 'Twilight of the Vigil' },
      } as CollectedToolUse,
    ]);

    const events = drainWeavingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:name');

    const data = events[0].data as { name: string; reason?: string };
    expect(data.name).toBe('Twilight of the Vigil');
  });

  it('returns error when name is missing', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-4', name: 'suggest_adventure_name', input: {} } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('name is required');
  });
});

// =============================================================================
// drainWeavingEvents
// =============================================================================

describe('drainWeavingEvents', () => {
  it('returns empty array when no events pending', () => {
    const events = drainWeavingEvents();
    expect(events).toEqual([]);
  });

  it('clears events after draining', async () => {
    await dispatchToolCalls([
      {
        id: 'tool-1',
        name: 'set_all_scene_arcs',
        input: {
          sceneArcs: [
            { id: 'arc-1', sceneNumber: 1, title: 'Test', description: 'Test' },
          ],
        },
      } as CollectedToolUse,
    ]);

    const firstDrain = drainWeavingEvents();
    expect(firstDrain.length).toBe(1);

    const secondDrain = drainWeavingEvents();
    expect(secondDrain.length).toBe(0);
  });
});
