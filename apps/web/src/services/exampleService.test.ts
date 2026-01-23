/**
 * Example Service Tests
 *
 * Tests for the pop culture example generation service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateExample,
  generateToneExample,
  generateEmotionalRegisterExample,
  getCachedExample,
  cacheExample,
  clearExampleCache,
  clearCachedExample,
} from './exampleService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('exampleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearExampleCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearExampleCache();
  });

  describe('generateExample', () => {
    it('should fetch example from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          example: "Dark and brooding like 'The Dark Knight'",
          dialType: 'tone',
          optionValue: 'grim',
        }),
      });

      const result = await generateExample('tone', 'grim');

      expect(result).toBe("Dark and brooding like 'The Dark Knight'");
      expect(mockFetch).toHaveBeenCalledWith('/api/content/example/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialType: 'tone',
          optionValue: 'grim',
        }),
      });
    });

    it('should return cached example on subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          example: "Cached example",
          dialType: 'tone',
          optionValue: 'grim',
        }),
      });

      // First call - should fetch
      const result1 = await generateExample('tone', 'grim');
      expect(result1).toBe("Cached example");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await generateExample('tone', 'grim');
      expect(result2).toBe("Cached example");
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should force refresh when requested', async () => {
      // Pre-cache an example
      cacheExample('tone', 'grim', 'Old cached example');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          example: "New fresh example",
          dialType: 'tone',
          optionValue: 'grim',
        }),
      });

      const result = await generateExample('tone', 'grim', undefined, true);

      expect(result).toBe("New fresh example");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should include context in request when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          example: "Contextual example",
          dialType: 'tone',
          optionValue: 'grim',
        }),
      });

      await generateExample('tone', 'grim', { themes: ['redemption', 'sacrifice'] });

      expect(mockFetch).toHaveBeenCalledWith('/api/content/example/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialType: 'tone',
          optionValue: 'grim',
          context: { themes: ['redemption', 'sacrifice'] },
        }),
      });
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Generation failed' }),
      });

      await expect(generateExample('tone', 'grim')).rejects.toThrow('Generation failed');
    });

    it('should throw generic error when no message provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(generateExample('tone', 'grim')).rejects.toThrow('HTTP 500');
    });
  });

  describe('generateToneExample', () => {
    it('should call generateExample with tone type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          example: "Tone example",
          dialType: 'tone',
          optionValue: 'serious',
        }),
      });

      const result = await generateToneExample('serious');

      expect(result).toBe("Tone example");
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/content/example/generate',
        expect.objectContaining({
          body: expect.stringContaining('"dialType":"tone"'),
        })
      );
    });
  });

  describe('generateEmotionalRegisterExample', () => {
    it('should call generateExample with emotionalRegister type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          example: "Register example",
          dialType: 'emotionalRegister',
          optionValue: 'thrilling',
        }),
      });

      const result = await generateEmotionalRegisterExample('thrilling');

      expect(result).toBe("Register example");
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/content/example/generate',
        expect.objectContaining({
          body: expect.stringContaining('"dialType":"emotionalRegister"'),
        })
      );
    });
  });

  describe('cache management', () => {
    it('should cache and retrieve examples', () => {
      cacheExample('tone', 'grim', 'Cached grim example');

      expect(getCachedExample('tone', 'grim')).toBe('Cached grim example');
    });

    it('should return null for uncached examples', () => {
      expect(getCachedExample('tone', 'whimsical')).toBeNull();
    });

    it('should clear specific cached example', () => {
      cacheExample('tone', 'grim', 'Grim example');
      cacheExample('tone', 'serious', 'Serious example');

      clearCachedExample('tone', 'grim');

      expect(getCachedExample('tone', 'grim')).toBeNull();
      expect(getCachedExample('tone', 'serious')).toBe('Serious example');
    });

    it('should clear all cached examples', () => {
      cacheExample('tone', 'grim', 'Grim example');
      cacheExample('emotionalRegister', 'thrilling', 'Thrilling example');

      clearExampleCache();

      expect(getCachedExample('tone', 'grim')).toBeNull();
      expect(getCachedExample('emotionalRegister', 'thrilling')).toBeNull();
    });
  });
});
