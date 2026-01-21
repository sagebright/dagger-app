/**
 * Shared types for dagger-app
 *
 * This package contains TypeScript type definitions shared between
 * the web frontend and mcp-bridge backend.
 */

// Re-export database types
export * from './database.js';

// Re-export dial types
export * from './dials.js';

// Re-export MCP types
export * from './mcp.js';

// Re-export content types
export * from './content.js';

// Re-export web adventure types
export * from './web-adventure.js';

/**
 * API health check response
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database?: {
    connected: boolean;
    latencyMs?: number;
    error?: string;
  };
}

/**
 * Generic API error response
 */
export interface ApiError {
  code: string;
  message: string;
}
