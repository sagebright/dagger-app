/**
 * Tests for error handler middleware
 *
 * Verifies error classification for:
 * - Anthropic API rate limits (429)
 * - Anthropic API authentication errors (401)
 * - Anthropic API timeouts
 * - Network connection failures
 * - Malformed responses (400)
 * - Internal server errors (500+)
 * - Generic/unknown errors
 */

import { describe, it, expect } from 'vitest';
import { classifyApiError, type ClassifiedError } from './error-handler.js';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Create a mock Anthropic SDK error with a status code.
 */
function createAnthropicError(
  status: number,
  message: string
): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

/**
 * Create a mock timeout error.
 */
function createTimeoutError(message: string = 'Request timed out.'): Error {
  const error = new Error(message);
  Object.defineProperty(error, 'constructor', {
    value: { name: 'APIConnectionTimeoutError' },
  });
  return error;
}

// =============================================================================
// Tests
// =============================================================================

describe('classifyApiError', () => {
  describe('rate limit errors (429)', () => {
    it('should classify 429 status as RATE_LIMIT', () => {
      const error = createAnthropicError(429, 'Rate limit exceeded');
      const result = classifyApiError(error);

      expect(result.code).toBe('RATE_LIMIT');
      expect(result.httpStatus).toBe(429);
      expect(result.retryable).toBe(true);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('should provide user-friendly rate limit message', () => {
      const error = createAnthropicError(429, '429 {"type":"error"}');
      const result = classifyApiError(error);

      expect(result.message).toContain('busy');
      expect(result.message).not.toContain('429');
    });
  });

  describe('authentication errors (401)', () => {
    it('should classify 401 status as AUTH_ERROR', () => {
      const error = createAnthropicError(401, 'Invalid API key');
      const result = classifyApiError(error);

      expect(result.code).toBe('AUTH_ERROR');
      expect(result.httpStatus).toBe(502);
      expect(result.retryable).toBe(false);
    });

    it('should provide user-friendly auth error message', () => {
      const error = createAnthropicError(401, 'invalid x-api-key');
      const result = classifyApiError(error);

      expect(result.message).toContain('authentication');
    });
  });

  describe('malformed request errors (400)', () => {
    it('should classify 400 status as MALFORMED_RESPONSE', () => {
      const error = createAnthropicError(400, 'Invalid request body');
      const result = classifyApiError(error);

      expect(result.code).toBe('MALFORMED_RESPONSE');
      expect(result.httpStatus).toBe(400);
      expect(result.retryable).toBe(false);
    });
  });

  describe('server errors (500+)', () => {
    it('should classify 500 status as SERVER_ERROR', () => {
      const error = createAnthropicError(500, 'Internal error');
      const result = classifyApiError(error);

      expect(result.code).toBe('SERVER_ERROR');
      expect(result.httpStatus).toBe(502);
      expect(result.retryable).toBe(true);
    });

    it('should classify 503 status as SERVER_ERROR', () => {
      const error = createAnthropicError(503, 'Service unavailable');
      const result = classifyApiError(error);

      expect(result.code).toBe('SERVER_ERROR');
      expect(result.retryable).toBe(true);
    });
  });

  describe('timeout errors', () => {
    it('should classify timeout messages as TIMEOUT', () => {
      const error = new Error('Request timed out.');
      const result = classifyApiError(error);

      expect(result.code).toBe('TIMEOUT');
      expect(result.httpStatus).toBe(504);
      expect(result.retryable).toBe(true);
    });

    it('should classify "aborted" messages as TIMEOUT', () => {
      const error = new Error('The operation was aborted');
      const result = classifyApiError(error);

      expect(result.code).toBe('TIMEOUT');
      expect(result.retryable).toBe(true);
    });
  });

  describe('network errors', () => {
    it('should classify ECONNREFUSED as NETWORK_ERROR', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:443');
      const result = classifyApiError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.httpStatus).toBe(502);
      expect(result.retryable).toBe(true);
    });

    it('should classify ECONNRESET as NETWORK_ERROR', () => {
      const error = new Error('read ECONNRESET');
      const result = classifyApiError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
    });

    it('should classify connection errors as NETWORK_ERROR', () => {
      const error = new Error('Connection error.');
      const result = classifyApiError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.retryable).toBe(true);
    });
  });

  describe('generic errors', () => {
    it('should classify unknown errors as SERVER_ERROR', () => {
      const error = new Error('Something unexpected happened');
      const result = classifyApiError(error);

      expect(result.code).toBe('SERVER_ERROR');
      expect(result.httpStatus).toBe(500);
      expect(result.retryable).toBe(true);
    });

    it('should handle non-Error objects', () => {
      const result = classifyApiError('string error');

      expect(result.code).toBe('SERVER_ERROR');
      expect(result.message).toBe('An unexpected error occurred');
    });

    it('should handle null/undefined errors', () => {
      const result = classifyApiError(null);

      expect(result.code).toBe('SERVER_ERROR');
      expect(result.retryable).toBe(true);
    });
  });

  describe('classified error shape', () => {
    it('should always return code, message, httpStatus, and retryable', () => {
      const testCases: unknown[] = [
        createAnthropicError(429, 'rate limit'),
        createAnthropicError(401, 'auth'),
        createAnthropicError(500, 'server'),
        new Error('timeout'),
        new Error('generic'),
        'string',
        null,
      ];

      for (const testCase of testCases) {
        const result: ClassifiedError = classifyApiError(testCase);
        expect(result).toHaveProperty('code');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('httpStatus');
        expect(result).toHaveProperty('retryable');
        expect(typeof result.code).toBe('string');
        expect(typeof result.message).toBe('string');
        expect(typeof result.httpStatus).toBe('number');
        expect(typeof result.retryable).toBe('boolean');
      }
    });
  });
});
