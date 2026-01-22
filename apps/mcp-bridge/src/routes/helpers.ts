/**
 * Route helper utilities
 *
 * Shared utilities for route handlers to reduce boilerplate.
 */

import type { Response } from 'express';
import type { StructuredErrorResponse } from '@dagger-app/shared-types';

/**
 * Standard error response structure for API endpoints
 */
export interface ErrorResponse {
  code: string;
  message: string;
}

/**
 * Send a standardized error response
 *
 * @param res - Express response object
 * @param code - Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 500)
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  status = 500
): void {
  const error: ErrorResponse = { code, message };
  res.status(status).json(error);
}

/**
 * Send a structured error response with user-friendly details
 *
 * Use this for errors that require actionable instructions for the user,
 * such as missing dependencies or authentication issues.
 *
 * @param res - Express response object
 * @param error - Structured error response with title, message, and instructions
 * @param status - HTTP status code (default: 500)
 */
export function sendStructuredError(
  res: Response,
  error: StructuredErrorResponse,
  status = 500
): void {
  res.status(status).json(error);
}
