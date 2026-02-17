/**
 * Session state service for Sage Codex API
 *
 * Manages adventure sessions: create, load, list, abandon.
 * Enforces one-active-session-per-user constraint.
 * Reads/writes sage_sessions and sage_adventure_state tables.
 *
 * Stage transitions follow the 6-stage Unfolding:
 *   invoking -> attuning -> binding -> weaving -> inscribing -> delivering
 */

import { getSupabase } from './supabase.js';
import type { Stage } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface SageSession {
  id: string;
  user_id: string;
  title: string;
  stage: Stage;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SageAdventureState {
  id: string;
  session_id: string;
  components: Record<string, unknown>;
  frame: Record<string, unknown> | null;
  outline: Record<string, unknown> | null;
  scenes: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface CreateSessionResult {
  session: SageSession;
  adventureState: SageAdventureState;
}

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// =============================================================================
// Stage Ordering
// =============================================================================

const STAGE_ORDER: Stage[] = [
  'invoking',
  'attuning',
  'binding',
  'weaving',
  'inscribing',
  'delivering',
];

/**
 * Get the next stage in the Unfolding sequence.
 *
 * Returns null if the current stage is 'delivering' (final stage).
 */
export function getNextStage(current: Stage): Stage | null {
  const currentIndex = STAGE_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1];
}

/**
 * Validate that a string is a valid Stage.
 */
export function isValidStage(value: string): value is Stage {
  return STAGE_ORDER.includes(value as Stage);
}

// =============================================================================
// Session Operations
// =============================================================================

/**
 * Find the active session for a user, if one exists.
 */
export async function findActiveSession(
  userId: string
): Promise<ServiceResult<SageSession>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sage_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as SageSession | null, error: null };
}

/**
 * Create a new adventure session for a user.
 *
 * Enforces one-active-session-per-user: if the user already has an active
 * session, returns an error. The caller should abandon the existing session
 * first or prompt the user.
 */
export async function createSession(
  userId: string,
  title: string
): Promise<ServiceResult<CreateSessionResult>> {
  if (!title.trim()) {
    return { data: null, error: 'Session title is required' };
  }

  const activeCheck = await findActiveSession(userId);
  if (activeCheck.error) {
    return { data: null, error: activeCheck.error };
  }

  if (activeCheck.data) {
    return {
      data: null,
      error: 'An active session already exists. Abandon it before starting a new one.',
    };
  }

  const supabase = getSupabase();

  // Create the session row
  const { data: sessionData, error: sessionError } = await supabase
    .from('sage_sessions')
    .insert({
      user_id: userId,
      title: title.trim(),
      stage: 'invoking' as Stage,
      is_active: true,
    })
    .select()
    .single();

  if (sessionError || !sessionData) {
    return {
      data: null,
      error: sessionError?.message ?? 'Failed to create session',
    };
  }

  const session = sessionData as SageSession;

  // Create the adventure state row
  const { data: stateData, error: stateError } = await supabase
    .from('sage_adventure_state')
    .insert({
      session_id: session.id,
      components: {},
      frame: null,
      outline: null,
      scenes: [],
    })
    .select()
    .single();

  if (stateError || !stateData) {
    return {
      data: null,
      error: stateError?.message ?? 'Failed to create adventure state',
    };
  }

  return {
    data: {
      session,
      adventureState: stateData as SageAdventureState,
    },
    error: null,
  };
}

/**
 * Load a session by ID, verifying ownership.
 */
export async function loadSession(
  sessionId: string,
  userId: string
): Promise<ServiceResult<CreateSessionResult>> {
  const supabase = getSupabase();

  const { data: sessionData, error: sessionError } = await supabase
    .from('sage_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError || !sessionData) {
    return { data: null, error: 'Session not found' };
  }

  const session = sessionData as SageSession;

  const { data: stateData, error: stateError } = await supabase
    .from('sage_adventure_state')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (stateError || !stateData) {
    return { data: null, error: 'Adventure state not found for session' };
  }

  return {
    data: {
      session,
      adventureState: stateData as SageAdventureState,
    },
    error: null,
  };
}

/**
 * List all sessions for a user, ordered by most recent first.
 */
export async function listSessions(
  userId: string
): Promise<ServiceResult<SageSession[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sage_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data ?? []) as SageSession[], error: null };
}

/**
 * Abandon (deactivate) a session. Sets is_active to false.
 *
 * Only the session owner can abandon their session.
 */
export async function abandonSession(
  sessionId: string,
  userId: string
): Promise<ServiceResult<SageSession>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sage_sessions')
    .update({ is_active: false })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Session not found' };
  }

  return { data: data as SageSession, error: null };
}

/**
 * Advance a session to the next stage in the Unfolding.
 *
 * Validates that:
 * - The session exists and belongs to the user
 * - The session is active
 * - The current stage has a valid next stage
 */
export async function advanceStage(
  sessionId: string,
  userId: string
): Promise<ServiceResult<SageSession>> {
  // Load the session to validate ownership and current stage
  const loadResult = await loadSession(sessionId, userId);
  if (loadResult.error || !loadResult.data) {
    return { data: null, error: loadResult.error ?? 'Session not found' };
  }

  const { session } = loadResult.data;

  if (!session.is_active) {
    return { data: null, error: 'Cannot advance an inactive session' };
  }

  const nextStage = getNextStage(session.stage);
  if (!nextStage) {
    return { data: null, error: 'Session is already at the final stage' };
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sage_sessions')
    .update({ stage: nextStage })
    .eq('id', sessionId)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Failed to advance stage' };
  }

  return { data: data as SageSession, error: null };
}

/**
 * Mark a session as completed.
 *
 * Only valid when the session is in the 'delivering' stage.
 * Sets is_active to false so the user can start a new adventure.
 */
export async function completeSession(
  sessionId: string,
  userId: string
): Promise<ServiceResult<SageSession>> {
  const loadResult = await loadSession(sessionId, userId);
  if (loadResult.error || !loadResult.data) {
    return { data: null, error: loadResult.error ?? 'Session not found' };
  }

  const { session } = loadResult.data;

  if (!session.is_active) {
    return { data: null, error: 'Session is already inactive' };
  }

  if (session.stage !== 'delivering') {
    return {
      data: null,
      error: 'Session can only be completed from the delivering stage',
    };
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sage_sessions')
    .update({ is_active: false })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: error?.message ?? 'Failed to complete session',
    };
  }

  return { data: data as SageSession, error: null };
}
