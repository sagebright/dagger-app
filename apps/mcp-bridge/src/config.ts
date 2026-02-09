/**
 * Configuration module for MCP Bridge Server
 *
 * Centralizes environment variable access with type-safe defaults.
 */

export const config = {
  /** Server port */
  port: parseInt(process.env.PORT || '3001', 10),

  /** Node environment */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** CORS origin for frontend */
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  /** Whether running in development mode */
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  /** Supabase configuration */
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
} as const;

export type Config = typeof config;
