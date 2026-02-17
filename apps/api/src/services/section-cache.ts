/**
 * Section content cache for cross-section propagation
 *
 * In-memory cache of section content per scene arc. Populated by
 * the Inscribing tool handlers (update_section, set_wave) so that
 * propagation tools can scan all sections without DB lookups.
 *
 * This is a module-level singleton -- all tool handlers share
 * the same cache instance within a request lifecycle.
 */

// =============================================================================
// Types
// =============================================================================

export interface CachedSection {
  sectionId: string;
  content: string;
}

// =============================================================================
// Cache Store
// =============================================================================

const sectionCache = new Map<string, Map<string, string>>();

/**
 * Update the section cache for a given scene arc.
 */
export function cacheSection(
  sceneArcId: string,
  sectionId: string,
  content: string
): void {
  if (!sectionCache.has(sceneArcId)) {
    sectionCache.set(sceneArcId, new Map());
  }
  sectionCache.get(sceneArcId)!.set(sectionId, content);
}

/**
 * Get all cached sections for a scene arc.
 */
export function getCachedSections(sceneArcId: string): CachedSection[] {
  const sceneMap = sectionCache.get(sceneArcId);
  if (!sceneMap) return [];

  return Array.from(sceneMap.entries()).map(([sectionId, content]) => ({
    sectionId,
    content,
  }));
}

/**
 * Clear the entire section cache (for testing).
 */
export function clearSectionCache(): void {
  sectionCache.clear();
}

/**
 * Seed the section cache with pre-existing content (for testing).
 */
export function seedSectionCache(
  sceneArcId: string,
  sections: CachedSection[]
): void {
  for (const section of sections) {
    cacheSection(sceneArcId, section.sectionId, section.content);
  }
}
