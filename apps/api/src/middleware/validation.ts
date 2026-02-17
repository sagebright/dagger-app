/**
 * Input validation middleware for Sage Codex API
 *
 * Provides reusable validation functions and an Express middleware
 * that sanitizes string inputs to prevent XSS and injection attacks.
 *
 * Validation strategy:
 * - Sanitize all string fields in request bodies (strip dangerous HTML)
 * - Enforce maximum lengths on string inputs
 * - Validate UUID format for ID parameters
 */

import type { Request, Response, NextFunction } from 'express';

// =============================================================================
// Constants
// =============================================================================

const MAX_MESSAGE_LENGTH = 10000;
const MAX_TITLE_LENGTH = 200;
const MAX_ID_LENGTH = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** HTML tags and script patterns to strip from user input */
const DANGEROUS_PATTERN = /<\/?(?:script|iframe|object|embed|form|input|link|style|meta)[^>]*>/gi;

// =============================================================================
// Sanitization
// =============================================================================

/**
 * Strip dangerous HTML tags from a string while preserving safe content.
 *
 * Removes script, iframe, object, embed, form, input, link, style, and meta tags.
 * Does NOT strip all HTML — angle brackets in normal text are fine.
 */
export function sanitizeString(input: string): string {
  return input.replace(DANGEROUS_PATTERN, '');
}

/**
 * Deep-sanitize all string values in an object.
 *
 * Recursively walks the object and applies sanitizeString to every
 * string value. Arrays and nested objects are handled.
 */
export function sanitizeBody(body: unknown): unknown {
  if (typeof body === 'string') {
    return sanitizeString(body);
  }

  if (Array.isArray(body)) {
    return body.map(sanitizeBody);
  }

  if (body !== null && typeof body === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      sanitized[key] = sanitizeBody(value);
    }
    return sanitized;
  }

  return body;
}

// =============================================================================
// Validators
// =============================================================================

/**
 * Validate that a string is a valid UUID v4 format.
 */
export function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Validate a chat message string.
 *
 * Returns null if valid, or an error message string if invalid.
 */
export function validateMessage(message: unknown): string | null {
  if (typeof message !== 'string') {
    return 'message must be a string';
  }
  if (message.trim().length === 0) {
    return 'message must not be empty';
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return `message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate a session title string.
 *
 * Returns null if valid, or an error message string if invalid.
 */
export function validateTitle(title: unknown): string | null {
  if (typeof title !== 'string') {
    return 'title must be a string';
  }
  if (title.trim().length === 0) {
    return 'title must not be empty';
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return `title exceeds maximum length of ${MAX_TITLE_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate a session or entity ID string.
 *
 * Returns null if valid, or an error message string if invalid.
 */
export function validateId(id: unknown): string | null {
  if (typeof id !== 'string') {
    return 'id must be a string';
  }
  if (id.length === 0 || id.length > MAX_ID_LENGTH) {
    return `id must be between 1 and ${MAX_ID_LENGTH} characters`;
  }
  return null;
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Express middleware that sanitizes all string values in the request body.
 *
 * Applied globally to strip dangerous HTML from user input before
 * it reaches route handlers.
 */
export function sanitizeInput(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeBody(req.body);
  }
  next();
}
