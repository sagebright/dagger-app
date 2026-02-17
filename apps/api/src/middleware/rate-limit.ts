/**
 * Rate limiting middleware for Sage Codex API
 *
 * Implements a sliding-window rate limiter using an in-memory store.
 * Each client is identified by IP address (or authenticated user ID
 * when available). Separate limits for different endpoint tiers:
 *
 * - General API: 100 requests per minute
 * - Chat (AI generation): 20 requests per minute
 * - Auth endpoints: 10 requests per minute
 *
 * Returns 429 Too Many Requests with Retry-After header when exceeded.
 */

import type { Request, Response, NextFunction } from 'express';

// =============================================================================
// Constants
// =============================================================================

const GENERAL_WINDOW_MS = 60 * 1000;
const GENERAL_MAX_REQUESTS = 100;

const CHAT_WINDOW_MS = 60 * 1000;
const CHAT_MAX_REQUESTS = 20;

const AUTH_WINDOW_MS = 60 * 1000;
const AUTH_MAX_REQUESTS = 10;

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// =============================================================================
// Types
// =============================================================================

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// =============================================================================
// Rate Limit Store
// =============================================================================

/** In-memory store of request timestamps per client key */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Periodic cleanup of expired entries to prevent memory leaks.
 * Runs every 5 minutes and removes entries with no recent timestamps.
 */
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < GENERAL_WINDOW_MS
    );
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Prevent the timer from keeping the process alive
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

// =============================================================================
// Core Logic
// =============================================================================

/**
 * Extract a client identifier from the request.
 *
 * Prefers authenticated user ID, falls back to IP address.
 */
function getClientKey(req: Request): string {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.ip ?? 'unknown';
  return `ip:${ip}`;
}

/**
 * Check if a client has exceeded the rate limit.
 *
 * Returns the number of remaining requests, or -1 if exceeded.
 */
function checkRateLimit(
  clientKey: string,
  tier: string,
  { windowMs, maxRequests }: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const storeKey = `${tier}:${clientKey}`;
  const now = Date.now();
  const entry = rateLimitStore.get(storeKey) ?? { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    rateLimitStore.set(storeKey, entry);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 1000),
    };
  }

  // Record this request
  entry.timestamps.push(now);
  rateLimitStore.set(storeKey, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

// =============================================================================
// Middleware Factory
// =============================================================================

/**
 * Create a rate limiting middleware for a specific tier.
 */
function createRateLimiter(tier: string, config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientKey = getClientKey(req);
    const result = checkRateLimit(clientKey, tier, config);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: 'Too many requests. Please wait before trying again.',
        code: 'RATE_LIMIT',
        retryable: true,
        retryAfterMs: result.retryAfterMs,
      });
      return;
    }

    next();
  };
}

// =============================================================================
// Exported Middleware
// =============================================================================

/** General API rate limiter: 100 req/min */
export const generalRateLimit = createRateLimiter('general', {
  windowMs: GENERAL_WINDOW_MS,
  maxRequests: GENERAL_MAX_REQUESTS,
});

/** Chat/AI generation rate limiter: 20 req/min */
export const chatRateLimit = createRateLimiter('chat', {
  windowMs: CHAT_WINDOW_MS,
  maxRequests: CHAT_MAX_REQUESTS,
});

/** Auth endpoint rate limiter: 10 req/min */
export const authRateLimit = createRateLimiter('auth', {
  windowMs: AUTH_WINDOW_MS,
  maxRequests: AUTH_MAX_REQUESTS,
});

/** Reset the rate limit store (for testing) */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
