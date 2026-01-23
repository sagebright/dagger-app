/**
 * Example Service
 *
 * Frontend service for fetching AI-generated pop culture examples
 * for Tone and Emotional Register dials. Includes caching to avoid
 * redundant API calls.
 */

import type {
  GenerateExampleRequest,
  GenerateExampleResponse,
  ExampleDialType,
  ToneOption,
  EmotionalRegisterOption,
} from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export type ExampleCacheKey = `${ExampleDialType}:${string}`;

export interface ExampleCache {
  [key: ExampleCacheKey]: string;
}

// =============================================================================
// Cache Management
// =============================================================================

/** In-memory cache for generated examples */
const exampleCache: ExampleCache = {};

/**
 * Build a cache key for an example
 */
function buildCacheKey(dialType: ExampleDialType, optionValue: string): ExampleCacheKey {
  return `${dialType}:${optionValue}`;
}

/**
 * Get a cached example if available
 */
export function getCachedExample(dialType: ExampleDialType, optionValue: string): string | null {
  const key = buildCacheKey(dialType, optionValue);
  return exampleCache[key] || null;
}

/**
 * Cache an example
 */
export function cacheExample(dialType: ExampleDialType, optionValue: string, example: string): void {
  const key = buildCacheKey(dialType, optionValue);
  exampleCache[key] = example;
}

/**
 * Clear all cached examples
 */
export function clearExampleCache(): void {
  Object.keys(exampleCache).forEach((key) => {
    delete exampleCache[key as ExampleCacheKey];
  });
}

/**
 * Clear cached example for a specific option
 */
export function clearCachedExample(dialType: ExampleDialType, optionValue: string): void {
  const key = buildCacheKey(dialType, optionValue);
  delete exampleCache[key];
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Generate a pop culture example for a dial option
 *
 * @param dialType - The type of dial (tone or emotionalRegister)
 * @param optionValue - The option value (e.g., 'grim', 'thrilling')
 * @param context - Optional context for more relevant examples
 * @param forceRefresh - Skip cache and force a new generation
 */
export async function generateExample(
  dialType: ExampleDialType,
  optionValue: string,
  context?: GenerateExampleRequest['context'],
  forceRefresh = false
): Promise<string> {
  // Check cache unless force refresh
  if (!forceRefresh) {
    const cached = getCachedExample(dialType, optionValue);
    if (cached) {
      return cached;
    }
  }

  const request: GenerateExampleRequest = {
    dialType,
    optionValue,
    context,
  };

  const response = await fetch('/api/content/example/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as GenerateExampleResponse;

  // Cache the result
  cacheExample(dialType, optionValue, data.example);

  return data.example;
}

/**
 * Generate a tone example
 */
export async function generateToneExample(
  tone: ToneOption,
  context?: GenerateExampleRequest['context'],
  forceRefresh = false
): Promise<string> {
  return generateExample('tone', tone, context, forceRefresh);
}

/**
 * Generate an emotional register example
 */
export async function generateEmotionalRegisterExample(
  register: EmotionalRegisterOption,
  context?: GenerateExampleRequest['context'],
  forceRefresh = false
): Promise<string> {
  return generateExample('emotionalRegister', register, context, forceRefresh);
}
