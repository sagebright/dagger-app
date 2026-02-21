/**
 * Binding stage tool handlers
 *
 * Implements the tool handlers for the Binding stage:
 * - query_frames: Searches the daggerheart_frames table and sends gallery data
 * - select_frame: Confirms a frame selection and persists it
 *
 * Each handler queues panel:frames SSE events so the frontend can
 * update the FrameGallery panel in real-time.
 */

import { registerToolHandler } from '../services/tool-dispatcher.js';
import type { ToolContext } from '../services/tool-dispatcher.js';
import { getFrames } from '../services/daggerheart-queries.js';
import { getSupabase } from '../services/supabase.js';
import type { SageEvent, FrameCardData, FrameDetailSection } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

interface QueryFramesInput {
  themes?: string[];
  limit?: number;
}

interface SelectFrameInput {
  frameId?: string;
  name: string;
  description: string;
  themes?: string[];
  typicalAdversaries?: string[];
  lore?: string;
  isCustom?: boolean;
}

// =============================================================================
// Pending Events Queue
// =============================================================================

let pendingEvents: SageEvent[] = [];

/**
 * Get and clear all pending binding events.
 */
export function drainBindingEvents(): SageEvent[] {
  const events = [...pendingEvents];
  pendingEvents = [];
  return events;
}

// =============================================================================
// Tool Handlers
// =============================================================================

/**
 * Register all Binding stage tool handlers.
 */
export function registerBindingTools(): void {
  registerToolHandler('query_frames', handleQueryFrames);
  registerToolHandler('select_frame', handleSelectFrame);
}

/**
 * Handle the query_frames tool call.
 *
 * Fetches frames from Supabase, converts them to gallery card data,
 * and queues a panel:frames event for the frontend.
 */
async function handleQueryFrames(
  input: Record<string, unknown>,
  _context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const queryInput = input as unknown as QueryFramesInput;
  const limit = queryInput.limit ?? 5;

  try {
    const { data: dbFrames, error } = await getFrames();

    if (error || !dbFrames) {
      return {
        result: `Failed to query frames: ${error ?? 'No data returned'}`,
        isError: true,
      };
    }

    // Convert DB frames to gallery card data
    const frameCards: FrameCardData[] = dbFrames
      .slice(0, limit)
      .map(convertDbFrameToCardData);

    // Queue the panel:frames event
    pendingEvents.push({
      type: 'panel:frames',
      data: { frames: frameCards, activeFrameId: null },
    });

    // Return a summary for Claude
    const frameSummary = frameCards.map((f) => ({
      id: f.id,
      name: f.name,
      pitch: f.pitch,
      themes: f.themes,
    }));

    return {
      result: {
        status: 'frames_loaded',
        count: frameCards.length,
        frames: frameSummary,
      },
      isError: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      result: `Failed to query frames: ${message}`,
      isError: true,
    };
  }
}

/**
 * Handle the select_frame tool call.
 *
 * Confirms a frame selection and queues an updated panel:frames event
 * with the active frame highlighted.
 */
async function handleSelectFrame(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const frameInput = input as unknown as SelectFrameInput;

  if (!frameInput.name || !frameInput.description) {
    return {
      result: 'name and description are required for select_frame',
      isError: true,
    };
  }

  const frameId = frameInput.frameId ?? crypto.randomUUID();

  // Persist to Supabase (best effort)
  try {
    await persistFrameSelection(context.sessionId, frameId, frameInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to persist frame selection: ${message}`);
  }

  return {
    result: {
      status: 'frame_selected',
      frameId,
      name: frameInput.name,
      description: frameInput.description,
    },
    isError: false,
  };
}

// =============================================================================
// Frame Data Conversion
// =============================================================================

/**
 * Convert a raw database frame row into FrameCardData for the gallery.
 */
function convertDbFrameToCardData(
  dbFrame: Record<string, unknown>
): FrameCardData {
  const name = (dbFrame.name as string) ?? 'Unnamed Frame';
  const description = (dbFrame.description as string) ?? '';
  const themes = (dbFrame.themes as string[]) ?? [];
  const lore = (dbFrame.lore as string) ?? '';
  const typicalAdversaries = (dbFrame.typical_adversaries as string[]) ?? [];

  // Extract the first sentence or paragraph as the pitch
  const pitch = extractPitch(description);

  // Build accordion sections from the frame's fields
  const sections = buildFrameSections({
    description,
    themes,
    lore,
    typicalAdversaries,
  });

  return {
    id: dbFrame.id as string,
    name,
    pitch,
    themes,
    sections,
  };
}

/**
 * Extract a short pitch from the full description.
 * Uses the first sentence or first 200 characters.
 */
function extractPitch(description: string): string {
  if (!description) return '';

  const firstSentence = description.match(/^[^.!?]+[.!?]/);
  if (firstSentence && firstSentence[0].length <= 200) {
    return firstSentence[0].trim();
  }

  if (description.length <= 200) return description;
  return description.slice(0, 197) + '...';
}

/**
 * Build the accordion sections for the frame detail panel.
 */
function buildFrameSections(fields: {
  description: string;
  themes: string[];
  lore: string;
  typicalAdversaries: string[];
}): FrameDetailSection[] {
  const sections: FrameDetailSection[] = [];

  sections.push({
    key: 'overview',
    label: 'Overview',
    content: fields.description,
    expandedByDefault: true,
  });

  if (fields.themes.length > 0) {
    sections.push({
      key: 'themes',
      label: 'Themes',
      content: fields.themes.join(', '),
      pills: fields.themes,
    });
  }

  if (fields.lore) {
    sections.push({
      key: 'lore',
      label: 'Lore',
      content: fields.lore,
    });
  }

  if (fields.typicalAdversaries.length > 0) {
    sections.push({
      key: 'adversaries',
      label: 'Typical Adversaries',
      content: fields.typicalAdversaries.join(', '),
      pills: fields.typicalAdversaries,
    });
  }

  return sections;
}

// =============================================================================
// Persistence
// =============================================================================

/**
 * Persist the frame selection to the adventure state in Supabase.
 *
 * Reads the current state JSONB, merges the frame, and writes back.
 * Best-effort; failures are logged but don't block the tool result.
 */
async function persistFrameSelection(
  sessionId: string,
  frameId: string,
  input: SelectFrameInput
): Promise<void> {
  const supabase = getSupabase();

  const { data: stateRow, error: fetchError } = await supabase
    .from('sage_adventure_state')
    .select('id, state')
    .eq('session_id', sessionId)
    .single();

  if (fetchError || !stateRow) {
    console.warn(`Adventure state not found for session ${sessionId}`);
    return;
  }

  const currentState = (stateRow.state as Record<string, unknown>) ?? {};
  const updatedState = {
    ...currentState,
    frame: {
      id: frameId,
      name: input.name,
      description: input.description,
      themes: input.themes ?? [],
      typicalAdversaries: input.typicalAdversaries ?? [],
      lore: input.lore ?? '',
      isCustom: input.isCustom ?? false,
    },
  };

  const { error: updateError } = await supabase
    .from('sage_adventure_state')
    .update({ state: updatedState })
    .eq('id', stateRow.id);

  if (updateError) {
    console.warn(`Failed to update frame state: ${updateError.message}`);
  }
}
