/**
 * CORS middleware configuration for Sage Codex API
 *
 * Configures Cross-Origin Resource Sharing based on the
 * ALLOWED_ORIGINS environment variable.
 */

import cors from 'cors';
import { config } from '../config.js';

/**
 * Create CORS middleware configured for the API's allowed origins
 */
export function createCorsMiddleware() {
  const allowedOrigins = config.allowedOrigins
    .split(',')
    .map((origin) => origin.trim());

  return cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
