/**
 * Message storage service for Sage Codex
 *
 * Stores and retrieves chat messages from the sage_messages table.
 * Each message is tied to a session and includes role, content,
 * optional tool_calls, and token_count for assistant messages.
 */

import { getSupabase } from './supabase.js';
import type { SageMessage } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface StoreMessageParams {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
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

    const { data, error } = await supabase
      .from('sage_messages')
      .insert({
        session_id: params.sessionId,
        role: params.role,
        content: params.content,
        tool_calls: params.toolCalls ?? null,
        token_count: params.tokenCount ?? null,
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

/**
 * Load conversation history for a session, ordered by creation time.
 *
 * Returns messages in chronological order for building the Anthropic
 * messages array. Limits to the most recent N messages to avoid
 * exceeding context windows.
 */
export async function loadConversationHistory(
  sessionId: string,
  limit = 50
): Promise<MessageStoreResult<SageMessage[]>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('sage_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

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
