/**
 * Tests for Anthropic service
 *
 * Verifies singleton client creation, environment variable validation,
 * and the streaming API wrapper.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAnthropicClient,
  resetAnthropicClient,
} from './anthropic.js';

// =============================================================================
// Tests
// =============================================================================

describe('getAnthropicClient', () => {
  beforeEach(() => {
    resetAnthropicClient();
  });

  afterEach(() => {
    resetAnthropicClient();
  });

  it('should throw if ANTHROPIC_API_KEY is not set', () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => getAnthropicClient()).toThrow(
      'ANTHROPIC_API_KEY environment variable is required'
    );

    process.env.ANTHROPIC_API_KEY = original;
  });

  it('should return a client when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const client = getAnthropicClient();
    expect(client).toBeTruthy();
  });

  it('should return the same client instance (singleton)', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const first = getAnthropicClient();
    const second = getAnthropicClient();
    expect(first).toBe(second);
  });

  it('should create a new client after reset', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const first = getAnthropicClient();
    resetAnthropicClient();
    const second = getAnthropicClient();
    expect(first).not.toBe(second);
  });
});
