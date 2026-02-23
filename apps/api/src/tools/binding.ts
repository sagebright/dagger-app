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

/** Rich frame fields shared by SelectFrameInput and DraftFrameInput */
interface RichFrameFields {
  incitingIncident?: string;
  toneFeel?: string[];
  touchstones?: string[];
  distinctions?: string;
  heritageClasses?: string;
  playerPrinciples?: string[];
  gmPrinciples?: string[];
  customMechanics?: string;
  sessionZeroQuestions?: string[];
  complexityRating?: number;
}

interface SelectFrameInput extends RichFrameFields {
  frameId?: string;
  name: string;
  description: string;
  themes?: string[];
  typicalAdversaries?: string[];
  lore?: string;
  isCustom?: boolean;
}

interface DraftFrameInput extends RichFrameFields {
  name: string;
  description: string;
  themes?: string[];
  typicalAdversaries?: string[];
  lore?: string;
  isCustom?: boolean;
}

interface DraftCustomFramesInput {
  frames: DraftFrameInput[];
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
  registerToolHandler('draft_custom_frames', handleDraftCustomFrames);
}

/**
 * Handle the query_frames tool call.
 *
 * Fetches frames from Supabase, converts them to gallery card data,
 * and queues a panel:frames event for the frontend.
 */
async function handleQueryFrames(
  input: Record<string, unknown>,
  context: ToolContext
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

    // Load adventure context so the Sage can assess frame relevance
    let adventureContext: Record<string, unknown> | null = null;
    try {
      const supabase = getSupabase();
      const { data: stateRow } = await supabase
        .from('sage_adventure_state')
        .select('state')
        .eq('session_id', context.sessionId)
        .single();

      if (stateRow?.state) {
        const state = stateRow.state as Record<string, unknown>;
        adventureContext = {
          spark: state.spark ?? null,
          components: state.components ?? null,
        };
      }
    } catch {
      // Best-effort; continue without context
    }

    return {
      result: {
        status: 'frames_loaded',
        count: frameCards.length,
        frames: frameSummary,
        adventureContext,
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

  // Queue panel:frame_selected event so the frontend highlights the active frame
  pendingEvents.push({
    type: 'panel:frame_selected',
    data: { frameId },
  });

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

/**
 * Handle the draft_custom_frames tool call.
 *
 * Converts Sage-generated frame drafts into gallery card data and
 * pushes a panel:frames event that replaces the gallery contents.
 * The Sage controls the full set (DB picks + custom).
 */
async function handleDraftCustomFrames(
  input: Record<string, unknown>,
  _context: ToolContext
): Promise<{ result: unknown; isError: boolean }> {
  const draftInput = input as unknown as DraftCustomFramesInput;

  if (!draftInput.frames || draftInput.frames.length === 0) {
    return {
      result: 'At least one frame is required for draft_custom_frames',
      isError: true,
    };
  }

  const frameCards: FrameCardData[] = draftInput.frames.map((frame) => {
    const id = crypto.randomUUID();
    const description = frame.description ?? '';
    const themes = frame.themes ?? [];
    const lore = frame.lore ?? '';
    const typicalAdversaries = frame.typicalAdversaries ?? [];

    return {
      id,
      name: frame.name,
      pitch: extractPitch(description),
      themes,
      sections: buildFrameSections({
        description,
        themes,
        lore,
        typicalAdversaries,
        incitingIncident: frame.incitingIncident,
        toneFeel: frame.toneFeel,
        touchstones: frame.touchstones,
        distinctions: frame.distinctions,
        heritageClasses: frame.heritageClasses,
        playerPrinciples: frame.playerPrinciples,
        gmPrinciples: frame.gmPrinciples,
        customMechanics: frame.customMechanics,
        sessionZeroQuestions: frame.sessionZeroQuestions,
        complexityRating: frame.complexityRating,
      }),
    };
  });

  // Replace the gallery with the curated set
  pendingEvents.push({
    type: 'panel:frames',
    data: { frames: frameCards, activeFrameId: null },
  });

  const frameSummary = frameCards.map((f) => ({
    id: f.id,
    name: f.name,
    pitch: f.pitch,
    themes: f.themes,
  }));

  return {
    result: {
      status: 'frames_drafted',
      count: frameCards.length,
      frames: frameSummary,
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

  // Rich schema fields (may be null for older official frames)
  const dbPitch = dbFrame.pitch as string | null;
  const overview = dbFrame.overview as string | null;
  const incitingIncident = dbFrame.inciting_incident as string | null;
  const toneFeel = dbFrame.tone_feel as string[] | null;
  const touchstones = dbFrame.touchstones as string[] | null;
  const distinctions = dbFrame.distinctions as unknown;
  const heritageClasses = dbFrame.heritage_classes as unknown;
  const playerPrinciples = dbFrame.player_principles as string[] | null;
  const gmPrinciples = dbFrame.gm_principles as string[] | null;
  const customMechanics = dbFrame.custom_mechanics as unknown;
  const sessionZeroQuestions = dbFrame.session_zero_questions as string[] | null;
  const complexityRating = dbFrame.complexity_rating as number | null;

  // Use pitch column when available, fall back to extracting from description
  const pitch = dbPitch || extractPitch(description);

  // Build accordion sections from all available fields
  const sections = buildFrameSections({
    description: overview || description,
    themes,
    lore,
    typicalAdversaries,
    incitingIncident: incitingIncident ?? undefined,
    toneFeel: toneFeel ?? undefined,
    touchstones: touchstones ?? undefined,
    distinctions: distinctions ?? undefined,
    heritageClasses: heritageClasses ?? undefined,
    playerPrinciples: playerPrinciples ?? undefined,
    gmPrinciples: gmPrinciples ?? undefined,
    customMechanics: customMechanics ?? undefined,
    sessionZeroQuestions: sessionZeroQuestions ?? undefined,
    complexityRating: complexityRating ?? undefined,
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
 *
 * Sections follow the stages.md spec order. Rich fields are optional —
 * sections with null/empty data are omitted. This allows official frames
 * (which may only have description, themes, lore, typical_adversaries)
 * to display alongside fully-populated sage/user frames.
 */
function buildFrameSections(fields: {
  description: string;
  themes: string[];
  lore: string;
  typicalAdversaries: string[];
  incitingIncident?: string;
  toneFeel?: string[];
  touchstones?: string[];
  distinctions?: unknown;
  heritageClasses?: unknown;
  playerPrinciples?: string[];
  gmPrinciples?: string[];
  customMechanics?: unknown;
  sessionZeroQuestions?: string[];
  complexityRating?: number;
}): FrameDetailSection[] {
  const sections: FrameDetailSection[] = [];

  // 1. Overview (expanded by default)
  sections.push({
    key: 'overview',
    label: 'Overview',
    content: fields.description,
    expandedByDefault: true,
  });

  // 2. Inciting Incident (expanded by default)
  if (fields.incitingIncident) {
    sections.push({
      key: 'inciting_incident',
      label: 'Inciting Incident',
      content: fields.incitingIncident,
      expandedByDefault: true,
    });
  }

  // 3. Tone & Feel (pills)
  if (fields.toneFeel && fields.toneFeel.length > 0) {
    sections.push({
      key: 'tone_feel',
      label: 'Tone & Feel',
      content: fields.toneFeel.join(', '),
      pills: fields.toneFeel,
    });
  }

  // 4. Touchstones (pills)
  if (fields.touchstones && fields.touchstones.length > 0) {
    sections.push({
      key: 'touchstones',
      label: 'Touchstones',
      content: fields.touchstones.join(', '),
      pills: fields.touchstones,
    });
  }

  // 5. Themes (pills)
  if (fields.themes.length > 0) {
    sections.push({
      key: 'themes',
      label: 'Themes',
      content: fields.themes.join(', '),
      pills: fields.themes,
    });
  }

  // 6. Lore
  if (fields.lore) {
    sections.push({
      key: 'lore',
      label: 'Lore',
      content: fields.lore,
    });
  }

  // 7. Distinctions (JSONB — render as formatted text)
  if (fields.distinctions) {
    const text = formatJsonbContent(fields.distinctions);
    if (text) {
      sections.push({
        key: 'distinctions',
        label: 'Distinctions',
        content: text,
      });
    }
  }

  // 8. Heritage & Classes Guidance (JSONB)
  if (fields.heritageClasses) {
    const text = formatJsonbContent(fields.heritageClasses);
    if (text) {
      sections.push({
        key: 'heritage_classes',
        label: 'Heritage & Classes Guidance',
        content: text,
      });
    }
  }

  // 9. Typical Adversaries (pills)
  if (fields.typicalAdversaries.length > 0) {
    sections.push({
      key: 'adversaries',
      label: 'Typical Adversaries',
      content: fields.typicalAdversaries.join(', '),
      pills: fields.typicalAdversaries,
    });
  }

  // 10. Player & GM Principles (combined)
  const principlesParts: string[] = [];
  if (fields.playerPrinciples && fields.playerPrinciples.length > 0) {
    principlesParts.push(
      '<strong>Player Principles:</strong> ' + fields.playerPrinciples.join(', ')
    );
  }
  if (fields.gmPrinciples && fields.gmPrinciples.length > 0) {
    principlesParts.push(
      '<strong>GM Principles:</strong> ' + fields.gmPrinciples.join(', ')
    );
  }
  if (principlesParts.length > 0) {
    sections.push({
      key: 'principles',
      label: 'Player & GM Principles',
      content: principlesParts.join('<br><br>'),
    });
  }

  // 11. Custom Mechanics (JSONB)
  if (fields.customMechanics) {
    const text = formatJsonbContent(fields.customMechanics);
    if (text) {
      sections.push({
        key: 'custom_mechanics',
        label: 'Custom Mechanics',
        content: text,
      });
    }
  }

  // 12. Session Zero Questions (list)
  if (fields.sessionZeroQuestions && fields.sessionZeroQuestions.length > 0) {
    sections.push({
      key: 'session_zero_questions',
      label: 'Session Zero Questions',
      content: fields.sessionZeroQuestions.map((q) => `• ${q}`).join('<br>'),
    });
  }

  // 13. Complexity Rating
  if (fields.complexityRating != null) {
    const labels = ['', 'Low', 'Moderate', 'High', 'Very High'];
    const label = labels[fields.complexityRating] ?? `${fields.complexityRating}`;
    sections.push({
      key: 'complexity_rating',
      label: 'Complexity Rating',
      content: `${label} (${fields.complexityRating}/4)`,
    });
  }

  return sections;
}

/**
 * Format a JSONB value into readable HTML text for display in accordion sections.
 */
function formatJsonbContent(value: unknown): string {
  if (!value) return '';

  // Array of objects with title/description or name/description
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          const title = (obj.title ?? obj.name ?? '') as string;
          const desc = (obj.description ?? obj.modification ?? '') as string;
          if (title && desc) return `<strong>${title}:</strong> ${desc}`;
          if (title) return title;
          if (desc) return desc;
          return JSON.stringify(item);
        }
        return String(item);
      })
      .join('<br><br>');
  }

  // Object with key-value pairs
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return Object.entries(obj)
      .map(([key, val]) => {
        if (Array.isArray(val)) {
          return `<strong>${key}:</strong> ${val.map((v) => typeof v === 'string' ? v : JSON.stringify(v)).join(', ')}`;
        }
        return `<strong>${key}:</strong> ${String(val)}`;
      })
      .join('<br><br>');
  }

  return String(value);
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

  // Build sections from the rich fields so they persist with the frame
  const sections = buildFrameSections({
    description: input.description,
    themes: input.themes ?? [],
    lore: input.lore ?? '',
    typicalAdversaries: input.typicalAdversaries ?? [],
    incitingIncident: input.incitingIncident,
    toneFeel: input.toneFeel,
    touchstones: input.touchstones,
    distinctions: input.distinctions,
    heritageClasses: input.heritageClasses,
    playerPrinciples: input.playerPrinciples,
    gmPrinciples: input.gmPrinciples,
    customMechanics: input.customMechanics,
    sessionZeroQuestions: input.sessionZeroQuestions,
    complexityRating: input.complexityRating,
  });

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
      sections,
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
