/**
 * Supabase client singleton for MCP Bridge
 *
 * Provides a configured Supabase client for accessing the Daggerheart
 * content database (JMK project).
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
 * Get the Supabase anon key from environment variables
 */
function getSupabaseAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY environment variable is required');
  }
  return key;
}

/**
 * Get or create the Supabase client singleton
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
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

    // Simple query to verify connection - count frames table
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
