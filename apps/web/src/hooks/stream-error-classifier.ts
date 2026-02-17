/**
 * Error classification for SSE chat streaming
 *
 * Maps HTTP status codes, error types, and error messages to
 * user-friendly error categories with retry guidance.
 *
 * Used by useSageStream to provide meaningful error feedback
 * instead of raw error messages.
 */

// =============================================================================
// Types
// =============================================================================

export type StreamErrorCode =
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'SERVER_ERROR'
  | 'STREAM_DISCONNECTED'
  | 'FETCH_ERROR'
  | 'UNKNOWN';

export interface StreamError {
  code: StreamErrorCode;
  message: string;
  retryable: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/** Maximum number of automatic reconnection attempts */
export const MAX_RECONNECT_ATTEMPTS = 3;

/** Base delay between reconnection attempts (doubles each retry) */
export const RECONNECT_BASE_DELAY_MS = 1000;

/** Default timeout for generation requests (30 seconds) */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/** Extended timeout for scene draft generation (60 seconds) */
export const EXTENDED_REQUEST_TIMEOUT_MS = 60_000;

// =============================================================================
// Error Classification
// =============================================================================

/**
 * Classify an error into a user-friendly category.
 *
 * Maps HTTP status codes and error types to StreamErrorCode values
 * so the UI can display appropriate messages and recovery actions.
 */
export function classifyError(
  error: unknown,
  httpStatus?: number
): StreamError {
  // HTTP status-based classification
  if (httpStatus === 429) {
    return {
      code: 'RATE_LIMIT',
      message: 'The Sage needs a moment to rest. Please wait before sending another message.',
      retryable: true,
    };
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return {
      code: 'AUTH_ERROR',
      message: 'Your session has expired. Please sign in again.',
      retryable: false,
    };
  }

  if (httpStatus && httpStatus >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: 'The Sage encountered an unexpected problem. Please try again.',
      retryable: true,
    };
  }

  // Error type-based classification
  if (error instanceof TypeError && isNetworkError(error)) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Connection lost. Check your internet and try again.',
      retryable: true,
    };
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      code: 'TIMEOUT',
      message: 'The request took too long. The Sage is still working — try again shortly.',
      retryable: true,
    };
  }

  // Error message-based classification
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      code: 'RATE_LIMIT',
      message: 'Too many requests. Please wait a moment before trying again.',
      retryable: true,
    };
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      code: 'TIMEOUT',
      message: 'The generation is taking longer than expected. Please try again.',
      retryable: true,
    };
  }

  return {
    code: 'UNKNOWN',
    message: errorMessage || 'Something went wrong. Please try again.',
    retryable: true,
  };
}

/**
 * Check if a TypeError represents a network connectivity issue.
 */
export function isNetworkError(error: TypeError): boolean {
  const networkPatterns = [
    'failed to fetch',
    'network request failed',
    'load failed',
    'networkerror',
  ];
  const message = error.message.toLowerCase();
  return networkPatterns.some((pattern) => message.includes(pattern));
}

// =============================================================================
// Reconnection Helpers
// =============================================================================

/**
 * Calculate the delay before the next reconnection attempt.
 *
 * Uses exponential backoff: 1s, 2s, 4s, etc.
 */
export function calculateReconnectDelay(attempt: number): number {
  return RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt);
}

/**
 * Wait for a specified number of milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
