/**
 * Token usage tracking service for Sage Codex
 *
 * Logs token usage per Anthropic API call to the sage_usage table.
 * Each record ties back to a session and message for cost attribution.
 */

import { getSupabase } from './supabase.js';

// =============================================================================
// Types
// =============================================================================

export interface TokenUsageEntry {
  sessionId: string;
  messageId: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface TokenUsageResult {
  success: boolean;
  error?: string;
}

// =============================================================================
// Token Tracking
// =============================================================================

/**
 * Log a token usage record to the sage_usage table.
 *
 * Failures are non-fatal: the chat flow should not break if
 * usage logging fails. Errors are returned for logging purposes.
 */
export async function logTokenUsage(
  entry: TokenUsageEntry
): Promise<TokenUsageResult> {
  try {
    const supabase = getSupabase();

    const { error } = await supabase.from('sage_usage').insert({
      session_id: entry.sessionId,
      message_id: entry.messageId,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      model: entry.model,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown token tracking error';
    return { success: false, error: errorMessage };
  }
}
