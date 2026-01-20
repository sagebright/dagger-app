/**
 * CORS middleware configuration for MCP Bridge Server
 *
 * Configures Cross-Origin Resource Sharing to allow frontend access.
 */

import cors from 'cors';
import type { CorsOptions } from 'cors';
import { config } from '../config.js';

/**
 * Creates CORS middleware configured for the frontend origin.
 */
export function createCorsMiddleware() {
  const options: CorsOptions = {
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  return cors(options);
}
