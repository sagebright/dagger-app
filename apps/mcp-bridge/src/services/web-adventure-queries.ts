/**
 * Web Adventure query helpers
 *
 * Provides typed query functions for adventure persistence operations
 * on the daggerheart_web_adventures table in Supabase.
 */

import { getSupabase } from './supabase.js';
import type {
  WebAdventure,
  AdventureSnapshot,
  Phase,
} from '@dagger-app/shared-types';

/**
 * Query result type for consistent error handling
 */
export type QueryResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Save response with session info
 */
export interface SaveResponse {
  sessionId: string;
  updatedAt: string;
}

/**
 * Metadata response for recovery modal
 */
export interface MetadataResponse {
  exists: boolean;
  metadata?: {
    sessionId: string;
    adventureName: string;
    currentPhase: Phase;
    updatedAt: string;
    sceneCount: number;
    npcCount: number;
  };
}

/**
 * Delete response
 */
export interface DeleteResponse {
  success: boolean;
  error: string | null;
}

/**
 * Export marker response
 */
export interface ExportResponse {
  lastExportedAt: string;
  exportCount: number;
}

/**
 * Save or update an adventure by session_id (upsert)
 *
 * Creates a new adventure if session_id doesn't exist,
 * otherwise updates the existing record.
 */
export async function saveAdventure(
  snapshot: AdventureSnapshot
): Promise<QueryResult<SaveResponse>> {
  const supabase = getSupabase();

  // Convert snapshot to database row format
  const row = {
    session_id: snapshot.sessionId,
    adventure_name: snapshot.adventureName,
    current_phase: snapshot.currentPhase,
    phase_history: snapshot.phaseHistory,
    confirmed_dials: snapshot.dialsConfirmed,
    frame_confirmed: snapshot.frameConfirmed,
    outline_confirmed: snapshot.outlineConfirmed,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('daggerheart_web_adventures')
    .upsert(row, { onConflict: 'session_id' })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const adventure = data as WebAdventure;
  return {
    data: {
      sessionId: adventure.session_id,
      updatedAt: adventure.updated_at,
    },
    error: null,
  };
}

/**
 * Load full adventure state by session_id
 */
export async function loadAdventure(
  sessionId: string
): Promise<QueryResult<WebAdventure>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('daggerheart_web_adventures')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  // Handle "not found" as a normal case (null data, no error)
  if (error?.code === 'PGRST116') {
    return {
      data: null,
      error: null,
    };
  }

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data as WebAdventure,
    error: null,
  };
}

/**
 * Get adventure metadata for recovery modal display
 *
 * Returns lightweight info without full content arrays.
 */
export async function getAdventureMetadata(
  sessionId: string
): Promise<QueryResult<MetadataResponse>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('daggerheart_web_adventures')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  // Handle "not found" as exists: false
  if (error?.code === 'PGRST116') {
    return {
      data: { exists: false },
      error: null,
    };
  }

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const adventure = data as WebAdventure;
  const scenes = Array.isArray(adventure.scenes) ? adventure.scenes : [];
  const npcs = Array.isArray(adventure.npcs) ? adventure.npcs : [];

  return {
    data: {
      exists: true,
      metadata: {
        sessionId: adventure.session_id,
        adventureName: adventure.adventure_name,
        currentPhase: adventure.current_phase,
        updatedAt: adventure.updated_at,
        sceneCount: scenes.length,
        npcCount: npcs.length,
      },
    },
    error: null,
  };
}

/**
 * Delete an adventure by session_id
 *
 * Used for "Start Fresh" functionality.
 */
export async function deleteAdventure(
  sessionId: string
): Promise<DeleteResponse> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('daggerheart_web_adventures')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}

/**
 * Mark an adventure as exported
 *
 * Updates last_exported_at timestamp and increments export_count.
 */
export async function markExported(
  sessionId: string
): Promise<QueryResult<ExportResponse>> {
  const supabase = getSupabase();

  // First get current export count to increment
  const { data: current, error: fetchError } = await supabase
    .from('daggerheart_web_adventures')
    .select('export_count')
    .eq('session_id', sessionId)
    .single();

  if (fetchError) {
    return {
      data: null,
      error: fetchError.message,
    };
  }

  const currentCount = (current as { export_count: number })?.export_count ?? 0;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('daggerheart_web_adventures')
    .update({
      last_exported_at: now,
      export_count: currentCount + 1,
      updated_at: now,
    })
    .eq('session_id', sessionId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const adventure = data as WebAdventure;
  return {
    data: {
      lastExportedAt: adventure.last_exported_at ?? now,
      exportCount: adventure.export_count,
    },
    error: null,
  };
}
