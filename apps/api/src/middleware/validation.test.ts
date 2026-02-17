/**
 * Tests for input validation middleware
 *
 * Verifies:
 * - XSS sanitization (script tags, iframes, dangerous HTML)
 * - Safe content preservation (normal text with angle brackets)
 * - Deep object sanitization (nested objects and arrays)
 * - Message validation (empty, too long, non-string)
 * - Title validation (empty, too long, non-string)
 * - ID validation (empty, too long, non-string)
 * - UUID format validation
 * - Middleware integration (sanitizes req.body)
 */

import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  sanitizeString,
  sanitizeBody,
  isValidUUID,
  validateMessage,
  validateTitle,
  validateId,
  sanitizeInput,
} from './validation.js';

// =============================================================================
// sanitizeString
// =============================================================================

describe('sanitizeString', () => {
  it('should strip script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeString(input)).toBe('Hello alert("xss") World');
  });

  it('should strip iframe tags', () => {
    const input = 'Content <iframe src="evil.com"></iframe> here';
    expect(sanitizeString(input)).toBe('Content  here');
  });

  it('should strip object and embed tags', () => {
    expect(sanitizeString('<object data="x"></object>')).toBe('');
    expect(sanitizeString('<embed src="x">')).toBe('');
  });

  it('should strip form and input tags', () => {
    expect(sanitizeString('<form action="x"><input type="text"></form>')).toBe('');
  });

  it('should strip style and meta tags', () => {
    expect(sanitizeString('<style>body{}</style>')).toBe('body{}');
    expect(sanitizeString('<meta charset="utf-8">')).toBe('');
  });

  it('should preserve safe content with angle brackets', () => {
    expect(sanitizeString('2 < 3 and 5 > 4')).toBe('2 < 3 and 5 > 4');
    expect(sanitizeString('Use <b>bold</b> text')).toBe('Use <b>bold</b> text');
  });

  it('should handle empty strings', () => {
    expect(sanitizeString('')).toBe('');
  });
});

// =============================================================================
// sanitizeBody
// =============================================================================

describe('sanitizeBody', () => {
  it('should sanitize string values', () => {
    expect(sanitizeBody('Hello <script>x</script>')).toBe('Hello x');
  });

  it('should sanitize nested objects', () => {
    const input = {
      name: 'Safe',
      bio: '<script>evil()</script>Bio',
      nested: { desc: '<iframe src="evil.com"></iframe>Clean' },
    };
    const result = sanitizeBody(input) as Record<string, unknown>;

    expect(result.name).toBe('Safe');
    expect(result.bio).toBe('evil()Bio');
    expect((result.nested as Record<string, string>).desc).toBe('Clean');
  });

  it('should sanitize arrays', () => {
    const input = ['safe', '<script>x</script>bad'];
    const result = sanitizeBody(input) as string[];

    expect(result[0]).toBe('safe');
    expect(result[1]).toBe('xbad');
  });

  it('should preserve non-string values', () => {
    const input = { count: 42, active: true, data: null };
    const result = sanitizeBody(input) as Record<string, unknown>;

    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.data).toBe(null);
  });
});

// =============================================================================
// isValidUUID
// =============================================================================

describe('isValidUUID', () => {
  it('should accept valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should accept uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('should reject non-UUID strings', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('12345')).toBe(false);
  });
});

// =============================================================================
// validateMessage
// =============================================================================

describe('validateMessage', () => {
  it('should accept valid messages', () => {
    expect(validateMessage('Hello, Sage!')).toBeNull();
  });

  it('should reject non-string input', () => {
    expect(validateMessage(42)).toBe('message must be a string');
    expect(validateMessage(null)).toBe('message must be a string');
  });

  it('should reject empty strings', () => {
    expect(validateMessage('')).toBe('message must not be empty');
    expect(validateMessage('   ')).toBe('message must not be empty');
  });

  it('should reject messages exceeding max length', () => {
    const longMessage = 'a'.repeat(10001);
    expect(validateMessage(longMessage)).toContain('exceeds maximum length');
  });
});

// =============================================================================
// validateTitle
// =============================================================================

describe('validateTitle', () => {
  it('should accept valid titles', () => {
    expect(validateTitle('The Hollow Vigil')).toBeNull();
  });

  it('should reject non-string input', () => {
    expect(validateTitle(123)).toBe('title must be a string');
  });

  it('should reject empty titles', () => {
    expect(validateTitle('')).toBe('title must not be empty');
  });

  it('should reject titles exceeding max length', () => {
    const longTitle = 'a'.repeat(201);
    expect(validateTitle(longTitle)).toContain('exceeds maximum length');
  });
});

// =============================================================================
// validateId
// =============================================================================

describe('validateId', () => {
  it('should accept valid IDs', () => {
    expect(validateId('abc-123')).toBeNull();
  });

  it('should reject non-string input', () => {
    expect(validateId(42)).toBe('id must be a string');
  });

  it('should reject empty IDs', () => {
    expect(validateId('')).toContain('must be between');
  });
});

// =============================================================================
// sanitizeInput middleware
// =============================================================================

describe('sanitizeInput middleware', () => {
  it('should sanitize request body strings', () => {
    const req = {
      body: { message: '<script>alert("xss")</script>Hello' },
    } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    sanitizeInput(req, res, next);

    expect(req.body.message).toBe('alert("xss")Hello');
    expect(next).toHaveBeenCalledOnce();
  });

  it('should call next when body is empty', () => {
    const req = { body: undefined } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    sanitizeInput(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
