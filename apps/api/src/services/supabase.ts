/**
 * Supabase client singleton for Sage Codex API
 *
 * Provides a configured Supabase client for accessing the Daggerheart
 * content database (JMK project).
 *
 * IMPORTANT: Uses SUPABASE_SERVICE_ROLE_KEY (NOT anon key) intentionally
 * to support RLS. See MEMORY.md for rationale.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get the Supabase URL from environment variables
 */
function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL environment variable is required');
  }
  return url;
}

/**
 * Get the Supabase service role key from environment variables.
 *
 * The API uses service_role (bypasses RLS) intentionally.
 * RLS protects against direct anon key abuse; the API mediates all client access.
 * SECURITY: Never expose this key to frontend or client code.
 */
function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }
  return key;
}

/**
 * Get or create the Supabase client singleton
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Check if Supabase connection is healthy by querying the database
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  error?: string;
  latencyMs?: number;
}> {
  const start = Date.now();

  try {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('daggerheart_frames')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        error: error.message,
      };
    }

    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Reset the client singleton (useful for testing or reconnection)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}
