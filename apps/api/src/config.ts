/**
 * Configuration module for Sage Codex API Server
 *
 * Centralizes environment variable access with type-safe defaults.
 * References the pattern from apps/mcp-bridge/src/config.ts.
 */

export const config = {
  /** Server port */
  port: parseInt(process.env.PORT || '3001', 10),

  /** Node environment */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** CORS allowed origins (comma-separated) */
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:5173',

  /** Whether running in development mode */
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  /** Supabase configuration */
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  /** Anthropic API key for direct SDK usage */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
} as const;

export type Config = typeof config;
