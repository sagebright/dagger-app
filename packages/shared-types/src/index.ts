/**
 * Shared types for dagger-app
 *
 * This package contains TypeScript type definitions shared between
 * the web frontend and API backend.
 */

// Re-export database types
export * from './database.js';

// Re-export dial types (legacy)
export * from './dials.js';

// Re-export stage & component types (new Sage Codex model)
export * from './stages.js';

// Re-export MCP types
export * from './mcp.js';

// Re-export content types
export * from './content.js';

// Re-export web adventure types
export * from './web-adventure.js';

// Re-export export types
export * from './export.js';

// Re-export custom frame wizard types
export * from './custom-frames.js';

// Re-export Sage event types (SSE streaming, tool definitions)
export * from './sage-events.js';

// Re-export adventure state types (Sage Codex state model)
export * from './adventure-state.js';

// Re-export credit system types (balances, transactions, packages)
export * from './credits.js';

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

/**
 * Structured error response for user-facing errors
 *
 * Used when errors require detailed user instructions (e.g., Claude CLI unavailable).
 * The frontend displays these in an ErrorModal with actionable steps.
 */
export interface StructuredErrorResponse {
  /** Error code for programmatic handling (e.g., 'CLAUDE_NOT_AVAILABLE') */
  error: string;
  /** User-friendly error title for display */
  title: string;
  /** Detailed error message explaining what went wrong */
  message: string;
  /** Step-by-step instructions for resolving the error */
  instructions: string[];
}
