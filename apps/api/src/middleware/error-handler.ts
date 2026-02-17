/**
 * Error handling middleware for Sage Codex API
 *
 * Classifies Anthropic API errors, network failures, and application
 * errors into user-friendly responses with appropriate HTTP status codes.
 *
 * Error categories:
 * - RATE_LIMIT (429): Too many API requests, provide retry guidance
 * - TIMEOUT: API or generation request timed out
 * - AUTH_ERROR: Invalid API key or authentication failure
 * - MALFORMED_RESPONSE: API returned unexpected data format
 * - NETWORK_ERROR: Connection to Anthropic failed
 * - SERVER_ERROR: Internal application error
 */

import type { Request, Response, NextFunction } from 'express';
import type { SageEvent } from '@dagger-app/shared-types';

// =============================================================================
// Error Types
// =============================================================================

export type ApiErrorCode =
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'AUTH_ERROR'
  | 'MALFORMED_RESPONSE'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR';

export interface ClassifiedError {
  code: ApiErrorCode;
  message: string;
  httpStatus: number;
  retryable: boolean;
  retryAfterMs?: number;
}

// =============================================================================
// Error Classification
// =============================================================================

/**
 * Classify an error from the Anthropic SDK into a structured format.
 *
 * Handles the specific error classes exported by @anthropic-ai/sdk:
 * - RateLimitError (429)
 * - AuthenticationError (401)
 * - APIConnectionError (network)
 * - APIConnectionTimeoutError (timeout)
 * - InternalServerError (500+)
 */
export function classifyApiError(error: unknown): ClassifiedError {
  // Check for Anthropic SDK errors (they have a status property)
  if (isAnthropicError(error)) {
    return classifyAnthropicError(error);
  }

  // Check for timeout errors
  if (isTimeoutError(error)) {
    return {
      code: 'TIMEOUT',
      message: 'The generation request timed out. The Sage is still thinking — try again shortly.',
      httpStatus: 504,
      retryable: true,
      retryAfterMs: 5000,
    };
  }

  // Check for network errors
  if (isConnectionError(error)) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Could not reach the AI service. Please check your connection and try again.',
      httpStatus: 502,
      retryable: true,
      retryAfterMs: 3000,
    };
  }

  // Generic server error
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return {
    code: 'SERVER_ERROR',
    message,
    httpStatus: 500,
    retryable: true,
  };
}

/**
 * Check if an error originates from the Anthropic SDK.
 */
function isAnthropicError(error: unknown): error is Error & { status?: number } {
  if (!(error instanceof Error)) return false;
  const errorName = error.constructor?.name ?? '';
  return (
    errorName.includes('APIError') ||
    errorName.includes('RateLimitError') ||
    errorName.includes('AuthenticationError') ||
    errorName.includes('PermissionDeniedError') ||
    errorName.includes('BadRequestError') ||
    errorName.includes('InternalServerError') ||
    errorName.includes('APIConnectionError') ||
    'status' in error
  );
}

/**
 * Classify an Anthropic SDK error by its HTTP status code.
 */
function classifyAnthropicError(
  error: Error & { status?: number }
): ClassifiedError {
  const status = error.status;

  if (status === 429) {
    return {
      code: 'RATE_LIMIT',
      message: 'The AI service is currently busy. Please wait a moment before trying again.',
      httpStatus: 429,
      retryable: true,
      retryAfterMs: extractRetryAfter(error) ?? 10000,
    };
  }

  if (status === 401) {
    return {
      code: 'AUTH_ERROR',
      message: 'AI service authentication failed. Please contact the administrator.',
      httpStatus: 502,
      retryable: false,
    };
  }

  if (status === 400) {
    return {
      code: 'MALFORMED_RESPONSE',
      message: 'The request to the AI service was malformed. Please try again with different input.',
      httpStatus: 400,
      retryable: false,
    };
  }

  if (status && status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: 'The AI service is experiencing issues. Please try again shortly.',
      httpStatus: 502,
      retryable: true,
      retryAfterMs: 5000,
    };
  }

  return {
    code: 'SERVER_ERROR',
    message: error.message || 'An unexpected AI service error occurred.',
    httpStatus: 500,
    retryable: true,
  };
}

/**
 * Extract retry-after value from error headers if available.
 */
function extractRetryAfter(
  error: Error & { headers?: Record<string, string> }
): number | null {
  const retryAfter = error.headers?.['retry-after'];
  if (!retryAfter) return null;

  const seconds = parseInt(retryAfter, 10);
  if (isNaN(seconds)) return null;

  return seconds * 1000;
}

/**
 * Check if an error is a timeout error.
 */
function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.constructor?.name ?? '';
  const message = error.message.toLowerCase();
  return (
    name.includes('TimeoutError') ||
    name.includes('APIConnectionTimeoutError') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('aborted')
  );
}

/**
 * Check if an error is a network connection error.
 */
function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.constructor?.name ?? '';
  const message = error.message.toLowerCase();
  return (
    name.includes('APIConnectionError') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('connection error') ||
    message.includes('network')
  );
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Express error-handling middleware.
 *
 * Catches unhandled errors, classifies them, and returns
 * appropriate responses. For SSE streams (headers already sent),
 * sends the error as an SSE event instead of JSON.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const classified = classifyApiError(err);

  // If SSE headers are already sent, send error as SSE event
  if (res.headersSent) {
    const errorEvent: SageEvent = {
      type: 'error',
      data: {
        code: classified.code,
        message: classified.message,
      },
    };
    res.write(`event: ${errorEvent.type}\ndata: ${JSON.stringify(errorEvent.data)}\n\n`);
    res.end();
    return;
  }

  // Send JSON error response
  res.status(classified.httpStatus).json({
    error: classified.message,
    code: classified.code,
    retryable: classified.retryable,
    ...(classified.retryAfterMs && { retryAfterMs: classified.retryAfterMs }),
  });
}
