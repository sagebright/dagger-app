/**
 * Tests for binding stage tool handlers
 *
 * Verifies:
 * - query_frames handler returns frame data and queues panel:frames events
 * - select_frame handler validates input and returns confirmation
 * - drainBindingEvents returns and clears pending events
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerBindingTools,
  drainBindingEvents,
} from './binding.js';
import { clearToolHandlers } from '../services/tool-dispatcher.js';

// Mock daggerheart-queries
vi.mock('../services/daggerheart-queries.js', () => ({
  getFrames: vi.fn().mockResolvedValue({
    data: [
      {
        id: 'frame-1',
        name: 'The Witherwild',
        description: 'A stolen relic triggers endless spring. The nation of Haven invaded.',
        themes: ['nature', 'conflict'],
        typical_adversaries: ['beast', 'plant'],
        lore: 'Ancient forest lore',
      },
      {
        id: 'frame-2',
        name: 'The Shattered Bastion',
        description: 'A disgraced knight carries a stolen fragment of the Divine Compact.',
        themes: ['honor', 'duty'],
        typical_adversaries: ['humanoid'],
        lore: null,
      },
    ],
    error: null,
  }),
}));

// Mock supabase
vi.mock('../services/supabase.js', () => ({
  getSupabase: vi.fn().mockReturnValue({
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

// =============================================================================
// Setup
// =============================================================================

// We need to get access to the tool handlers through the dispatcher
import { dispatchToolCalls } from '../services/tool-dispatcher.js';
import type { CollectedToolUse } from '../services/stream-parser.js';

beforeEach(() => {
  clearToolHandlers();
  // Drain any leftover events
  drainBindingEvents();
  // Register the tools fresh
  registerBindingTools();
});

// =============================================================================
// Tests
// =============================================================================

describe('registerBindingTools', () => {
  it('registers query_frames and select_frame handlers', async () => {
    // query_frames should be dispatched successfully (not return "Unknown tool")
    const result = await dispatchToolCalls([
      { id: 'tool-1', name: 'query_frames', input: {} } as CollectedToolUse,
    ]);

    const toolEndEvent = result.events.find(
      (e) => e.type === 'tool:end' && (e.data as { toolName: string }).toolName === 'query_frames'
    );

    expect(toolEndEvent).toBeDefined();
    expect((toolEndEvent?.data as { isError: boolean }).isError).toBe(false);
  });
});

describe('query_frames handler', () => {
  it('returns frame data from the database', async () => {
    const result = await dispatchToolCalls([
      { id: 'tool-1', name: 'query_frames', input: {} } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('frames_loaded');
    expect(parsed.count).toBe(2);
    expect(parsed.frames[0].name).toBe('The Witherwild');
    expect(parsed.frames[1].name).toBe('The Shattered Bastion');
  });

  it('queues a panel:frames event', async () => {
    await dispatchToolCalls([
      { id: 'tool-1', name: 'query_frames', input: {} } as CollectedToolUse,
    ]);

    const events = drainBindingEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('panel:frames');

    const data = events[0].data as {
      frames: Array<{ id: string; name: string }>;
      activeFrameId: string | null;
    };
    expect(data.frames.length).toBe(2);
    expect(data.activeFrameId).toBeNull();
  });

  it('respects the limit parameter', async () => {
    await dispatchToolCalls([
      { id: 'tool-1', name: 'query_frames', input: { limit: 1 } } as CollectedToolUse,
    ]);

    const events = drainBindingEvents();
    const data = events[0].data as { frames: unknown[] };
    expect(data.frames.length).toBe(1);
  });
});

describe('select_frame handler', () => {
  it('returns frame_selected status on valid input', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-2',
        name: 'select_frame',
        input: {
          frameId: 'frame-1',
          name: 'The Witherwild',
          description: 'A stolen relic triggers endless spring.',
        },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBeUndefined();

    const parsed = JSON.parse(toolResult.content);
    expect(parsed.status).toBe('frame_selected');
    expect(parsed.frameId).toBe('frame-1');
    expect(parsed.name).toBe('The Witherwild');
  });

  it('returns error when name is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-3',
        name: 'select_frame',
        input: { description: 'No name provided' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toContain('name and description are required');
  });

  it('returns error when description is missing', async () => {
    const result = await dispatchToolCalls([
      {
        id: 'tool-4',
        name: 'select_frame',
        input: { name: 'Test Frame' },
      } as CollectedToolUse,
    ]);

    const toolResult = result.toolResults[0];
    expect(toolResult.is_error).toBe(true);
  });
});

describe('drainBindingEvents', () => {
  it('returns empty array when no events pending', () => {
    const events = drainBindingEvents();
    expect(events).toEqual([]);
  });

  it('clears events after draining', async () => {
    await dispatchToolCalls([
      { id: 'tool-1', name: 'query_frames', input: {} } as CollectedToolUse,
    ]);

    const firstDrain = drainBindingEvents();
    expect(firstDrain.length).toBe(1);

    const secondDrain = drainBindingEvents();
    expect(secondDrain.length).toBe(0);
  });
});
