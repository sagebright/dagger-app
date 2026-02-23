/**
 * Tests for weaving stage tool handlers
 *
 * Verifies:
 * - set_all_scene_arcs populates all scenes and queues panel:scene_arcs event
 * - set_all_scene_arcs persists sceneArcs to DB state
 * - set_scene_arc updates a single scene and queues panel:scene_arc event
 * - set_scene_arc persists the updated scene arc to DB state
 * - reorder_scenes validates input and returns reorder confirmation
 * - suggest_adventure_name queues panel:name event
 * - drainWeavingEvents returns and clears pending events
 * - Persistence failures are logged but do not block tool results
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerWeavingTools,
  drainWeavingEvents,
} from './weaving.js';
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
  drainWeavingEvents();
  registerWeavingTools();
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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArcs array is required');
  });

  it('returns error when sceneArcs is empty', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-1', name: 'set_all_scene_arcs', input: { sceneArcs: [] } } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('at least one scene');
  });

  it('persists sceneArcs to DB state', async () => {
    await dispatchToolCalls([
      { id: 'tool-1', name: 'set_all_scene_arcs', input: validInput } as CollectedToolUse,
    ], mockContext);

    // Verify Supabase was called to read state
    expect(mockFrom).toHaveBeenCalledWith('sage_adventure_state');
    expect(mockSelect).toHaveBeenCalledWith('id, state');
    expect(mockSelectEq).toHaveBeenCalledWith('session_id', 'test-session-id');

    // Verify Supabase was called to write state with sceneArcs
    expect(mockUpdate).toHaveBeenCalled();
    const updatedState = mockUpdate.mock.calls[0][0].state;
    expect(updatedState.sceneArcs).toHaveLength(2);
    expect(updatedState.sceneArcs[0].id).toBe('arc-1');
    expect(updatedState.sceneArcs[0].title).toBe('The Overgrown Road');
    expect(updatedState.sceneArcs[0].confirmed).toBe(false);
    expect(updatedState.sceneArcs[1].id).toBe('arc-2');
  });

  it('still succeeds when DB persistence fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection lost' },
    });

    const result = await dispatchToolCalls([
      { id: 'tool-1', name: 'set_all_scene_arcs', input: validInput } as CollectedToolUse,
    ], mockContext);

    // Tool result should still succeed
    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();
    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('scene_arcs_populated');
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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('sceneArc with title is required');
  });

  it('persists updated scene arc to DB state', async () => {
    // Existing state already has sceneArcs
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'state-1',
        state: {
          sceneArcs: [
            { id: 'arc-1', sceneNumber: 1, title: 'Old Title', confirmed: false },
            { id: 'arc-2', sceneNumber: 2, title: 'Scene Two', confirmed: false },
          ],
        },
      },
      error: null,
    });

    await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'set_scene_arc',
        input: {
          sceneIndex: 0,
          sceneArc: {
            id: 'arc-1',
            sceneNumber: 1,
            title: 'Updated Title',
            description: 'Updated desc.',
          },
        },
      } as CollectedToolUse,
    ], mockContext);

    // Verify Supabase update was called
    expect(mockUpdate).toHaveBeenCalled();
    const updatedState = mockUpdate.mock.calls[0][0].state;
    expect(updatedState.sceneArcs[0].title).toBe('Updated Title');
    // Scene at index 1 should be unchanged
    expect(updatedState.sceneArcs[1].title).toBe('Scene Two');
  });

  it('still succeeds when DB persistence fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection lost' },
    });

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
            description: 'Test desc.',
          },
        },
      } as CollectedToolUse,
    ], mockContext);

    // Tool result should still succeed
    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();
    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('scene_arc_updated');
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
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('scenes_reordered');
    expect(parsed.order).toEqual(['arc-2', 'arc-1', 'arc-3']);
  });

  it('returns error when order is missing', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-3', name: 'reorder_scenes', input: {} } as CollectedToolUse,
    ], mockContext);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('order array');
  });

  it('returns error when order is empty', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-3', name: 'reorder_scenes', input: { order: [] } } as CollectedToolUse,
    ], mockContext);

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
    ], mockContext);

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
    ], mockContext);

    const events = drainWeavingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:name');

    const data = events[0].data as { name: string; reason?: string };
    expect(data.name).toBe('Twilight of the Vigil');
  });

  it('returns error when name is missing', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-4', name: 'suggest_adventure_name', input: {} } as CollectedToolUse,
    ], mockContext);

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
    ], mockContext);

    const firstDrain = drainWeavingEvents();
    expect(firstDrain.length).toBe(1);

    const secondDrain = drainWeavingEvents();
    expect(secondDrain.length).toBe(0);
  });
});
