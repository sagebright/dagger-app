/**
 * Tests for rate limiting middleware
 *
 * Verifies:
 * - Requests within limit are allowed
 * - Requests exceeding limit return 429
 * - Rate limit headers are set correctly
 * - Different tiers have different limits
 * - Client identification by IP and user ID
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  generalRateLimit,
  chatRateLimit,
  authRateLimit,
  resetRateLimitStore,
} from './rate-limit.js';

// =============================================================================
// Helpers
// =============================================================================

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    ip: '127.0.0.1',
    headers: {},
    user: undefined,
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response & {
  statusCode: number;
  headers: Record<string, string | number>;
  body: unknown;
} {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string | number>,
    body: null as unknown,
    setHeader(key: string, value: string | number) {
      res.headers[key] = value;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  };
  return res as unknown as Response & {
    statusCode: number;
    headers: Record<string, string | number>;
    body: unknown;
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('rate limiting middleware', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe('generalRateLimit', () => {
    it('should allow requests within the limit', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      generalRateLimit(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.headers['X-RateLimit-Limit']).toBe(100);
      expect(res.headers['X-RateLimit-Remaining']).toBe(99);
    });

    it('should decrement remaining count with each request', () => {
      const req = createMockRequest();
      const next = vi.fn() as NextFunction;

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        const res = createMockResponse();
        generalRateLimit(req, res as unknown as Response, next);
      }

      // Check the last response
      const res = createMockResponse();
      generalRateLimit(req, res as unknown as Response, next);
      expect(res.headers['X-RateLimit-Remaining']).toBe(96);
    });
  });

  describe('chatRateLimit', () => {
    it('should allow requests within the chat limit', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      chatRateLimit(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.headers['X-RateLimit-Limit']).toBe(20);
      expect(res.headers['X-RateLimit-Remaining']).toBe(19);
    });

    it('should return 429 when chat limit is exceeded', () => {
      const req = createMockRequest();
      const next = vi.fn() as NextFunction;

      // Exhaust the limit
      for (let i = 0; i < 20; i++) {
        const res = createMockResponse();
        chatRateLimit(req, res as unknown as Response, next);
      }

      // Next request should be rejected
      const res = createMockResponse();
      chatRateLimit(req, res as unknown as Response, next);

      expect(res.statusCode).toBe(429);
      expect(res.headers['X-RateLimit-Remaining']).toBe(0);
      expect(res.headers['Retry-After']).toBeDefined();
      expect((res.body as Record<string, unknown>).code).toBe('RATE_LIMIT');
    });
  });

  describe('authRateLimit', () => {
    it('should have a limit of 10 requests', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn() as NextFunction;

      authRateLimit(req, res as unknown as Response, next);

      expect(res.headers['X-RateLimit-Limit']).toBe(10);
    });
  });

  describe('client identification', () => {
    it('should track different IPs separately', () => {
      const next = vi.fn() as NextFunction;

      const req1 = createMockRequest({ ip: '10.0.0.1' });
      const req2 = createMockRequest({ ip: '10.0.0.2' });

      const res1 = createMockResponse();
      const res2 = createMockResponse();

      chatRateLimit(req1, res1 as unknown as Response, next);
      chatRateLimit(req2, res2 as unknown as Response, next);

      // Both should have 19 remaining (independent counters)
      expect(res1.headers['X-RateLimit-Remaining']).toBe(19);
      expect(res2.headers['X-RateLimit-Remaining']).toBe(19);
    });

    it('should use user ID when authenticated', () => {
      const next = vi.fn() as NextFunction;

      const req = createMockRequest({
        user: { id: 'user-123' } as Request['user'],
        ip: '10.0.0.1',
      });

      const res = createMockResponse();
      chatRateLimit(req, res as unknown as Response, next);

      expect(res.headers['X-RateLimit-Remaining']).toBe(19);
    });
  });

  describe('429 response format', () => {
    it('should include retryable and retryAfterMs in response', () => {
      const req = createMockRequest();
      const next = vi.fn() as NextFunction;

      // Exhaust auth limit (10 requests)
      for (let i = 0; i < 10; i++) {
        const res = createMockResponse();
        authRateLimit(req, res as unknown as Response, next);
      }

      const res = createMockResponse();
      authRateLimit(req, res as unknown as Response, next);

      const body = res.body as Record<string, unknown>;
      expect(body.error).toContain('Too many requests');
      expect(body.retryable).toBe(true);
      expect(body.retryAfterMs).toBeGreaterThan(0);
    });
  });
});
