/**
 * Review panel mapping helpers
 *
 * Utility functions for converting adventure store data to panel display formats.
 * Extracted from ReviewPanels.tsx to satisfy react-refresh/only-export-components.
 */

import type {
  BoundFrame,
  FrameCardData,
  InscribingSectionData,
} from '@sage-codex/shared-types';
import { WAVE_SECTIONS, SECTION_LABELS } from '@sage-codex/shared-types';
import type { WaveNumber } from '@sage-codex/shared-types';
import type { SceneInscriptionState } from './InscribingPanel';

/** Convert a BoundFrame (adventure store) to FrameCardData (panel display) */
export function boundFrameToCardData(frame: BoundFrame): FrameCardData {
  return {
    id: frame.id,
    name: frame.name,
    pitch: frame.description,
    themes: frame.themes,
    sections: frame.sections,
  };
}

/** Convert persisted inscribing sections to SceneInscriptionState for the panel */
export function inscribingSectionsToSceneState(
  sections: InscribingSectionData[]
): SceneInscriptionState {
  // Build a complete 9-section array, merging persisted data with defaults
  const fullSections = buildFullSections(sections);

  return {
    sections: fullSections,
    confirmed: true,
    wave3Invalidated: false,
    invalidationReason: null,
    balanceWarning: null,
  };
}

/** Build all 9 sections, merging persisted data with empty defaults */
function buildFullSections(
  persisted: InscribingSectionData[]
): InscribingSectionData[] {
  const fullSections: InscribingSectionData[] = [];

  for (const [waveStr, sectionIds] of Object.entries(WAVE_SECTIONS)) {
    const wave = Number(waveStr) as WaveNumber;
    for (const sectionId of sectionIds) {
      const existing = persisted.find((s) => s.id === sectionId);
      fullSections.push(
        existing ?? {
          id: sectionId,
          label: SECTION_LABELS[sectionId],
          content: '',
          wave,
          hasDetail: ['setup', 'developments', 'transitions'].includes(sectionId),
        }
      );
    }
  }

  return fullSections;
}
