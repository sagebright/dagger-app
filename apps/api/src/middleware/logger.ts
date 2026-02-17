/**
 * Request logging middleware for Sage Codex API
 *
 * Logs incoming requests with method, URL, status code, and duration.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Create a request logging middleware
 *
 * Logs each request with timing information when the response finishes.
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLine = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
      console.log(`[api] ${logLine}`);
    });

    next();
  };
}
