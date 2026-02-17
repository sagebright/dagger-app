/**
 * CORS middleware configuration for Sage Codex API
 *
 * Configures Cross-Origin Resource Sharing based on the
 * ALLOWED_ORIGINS environment variable. In production, only
 * explicitly listed origins are permitted.
 *
 * Security notes:
 * - Credentials mode requires explicit origin (not wildcard)
 * - Exposed headers are limited to rate-limit information
 * - Max age set to 1 hour to reduce preflight requests
 */

import cors from 'cors';
import { config } from '../config.js';

/** Maximum preflight cache duration in seconds (1 hour) */
const PREFLIGHT_MAX_AGE_SECONDS = 3600;

/**
 * Create CORS middleware configured for the API's allowed origins.
 *
 * In development, allows localhost origins.
 * In production, restricts to ALLOWED_ORIGINS only.
 */
export function createCorsMiddleware() {
  const allowedOrigins = config.allowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, health checks)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
  });
}
