/**
 * Request logging middleware for MCP Bridge Server
 *
 * Logs incoming requests with method, URL, status, and duration.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Creates a request logging middleware.
 * Logs request details including method, URL, status code, and response time.
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl } = req;
      const { statusCode } = res;

      console.log(`${method} ${originalUrl} ${statusCode} ${duration}ms`);
    });

    next();
  };
}
