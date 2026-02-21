/**
 * Message storage service for Sage Codex
 *
 * Stores and retrieves chat messages from the sage_messages table.
 * Each message is tied to a session and includes role, content,
 * optional tool_calls, and token_count for assistant messages.
 */

import { getSupabase } from './supabase.js';
import type { SageMessage } from '@sage-codex/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface StoreMessageParams {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  stage: string;
  toolCalls?: Record<string, unknown>[] | null;
  tokenCount?: number | null;
}

export interface MessageStoreResult<T> {
  data: T | null;
  error: string | null;
}

// =============================================================================
// Store Operations
// =============================================================================

/**
 * Store a message in the sage_messages table.
 *
 * Returns the created message record, or an error if insertion fails.
 */
export async function storeMessage(
  params: StoreMessageParams
): Promise<MessageStoreResult<SageMessage>> {
  try {
    const supabase = getSupabase();

    // Build metadata JSONB from optional fields
    // The sage_messages table has a `metadata` JSONB column (not discrete columns)
    const metadata =
      params.toolCalls || params.tokenCount != null
        ? {
            ...(params.toolCalls && { tool_calls: params.toolCalls }),
            ...(params.tokenCount != null && {
              token_count: params.tokenCount,
            }),
          }
        : null;

    const { data, error } = await supabase
      .from('sage_messages')
      .insert({
        session_id: params.sessionId,
        role: params.role,
        content: params.content,
        stage: params.stage,
        metadata,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as SageMessage, error: null };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to store message';
    return { data: null, error: errorMessage };
  }
}

/** Options for loading conversation history */
export interface LoadHistoryOptions {
  /** Filter messages to a specific stage (omit to load all stages) */
  stage?: string;
  /** Maximum number of messages to return (default 50) */
  limit?: number;
}

/**
 * Load conversation history for a session, ordered by creation time.
 *
 * When `stage` is provided, only messages from that stage are returned.
 * This prevents cross-stage message bleed that causes the greet endpoint
 * to return 'already_greeted' on stage transitions.
 *
 * Returns messages in chronological order for building the Anthropic
 * messages array. Limits to the most recent N messages to avoid
 * exceeding context windows.
 */
export async function loadConversationHistory(
  sessionId: string,
  options: LoadHistoryOptions = {}
): Promise<MessageStoreResult<SageMessage[]>> {
  const { stage, limit = 50 } = options;

  try {
    const supabase = getSupabase();

    let query = supabase
      .from('sage_messages')
      .select('*')
      .eq('session_id', sessionId);

    if (stage) {
      query = query.eq('stage', stage);
    }

    query = query
      .order('created_at', { ascending: true })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as SageMessage[], error: null };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to load conversation';
    return { data: null, error: errorMessage };
  }
}
