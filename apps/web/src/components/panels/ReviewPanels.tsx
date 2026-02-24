/**
 * ReviewPanels — Read-only panel wrappers for reviewing completed stages
 *
 * Each wrapper renders the stage-specific panel in read-only mode:
 * - ReviewComponentSummary: Attuning components (no footer, no interaction)
 * - ReviewFrameDetail: Bound frame detail (no back/select buttons)
 * - ReviewWeavingPanel: Scene tabs + scene arc content (all confirmed)
 * - ReviewInscribingPanel: Section accordion (no footer, static stage label)
 *
 * Mapping helpers live in ./review-helpers.ts (split for react-refresh).
 */

import { useState, useCallback } from 'react';
import { ComponentSummary } from './ComponentSummary';
import { FrameDetail } from './FrameDetail';
import { SceneTabs } from './SceneTabs';
import { SceneArc } from './SceneArc';
import { InscribingPanel } from './InscribingPanel';
import { boundFrameToCardData, inscribingSectionsToSceneState } from './review-helpers';
import type {
  SerializableComponentsState,
  BoundFrame,
  SceneArc as SceneArcType,
  SceneArcData,
  InscribingSectionData,
  InscribingSectionId,
} from '@sage-codex/shared-types';
import type { WaveNumber } from '@sage-codex/shared-types';

// =============================================================================
// ReviewComponentSummary — Attuning stage review
// =============================================================================

export interface ReviewComponentSummaryProps {
  components: SerializableComponentsState;
}

export function ReviewComponentSummary({ components }: ReviewComponentSummaryProps) {
  return (
    <ComponentSummary
      components={components}
      onSelectComponent={() => {}}
      onAdvance={() => {}}
      isReady={false}
      readOnly
    />
  );
}

// =============================================================================
// ReviewFrameDetail — Binding stage review
// =============================================================================

export interface ReviewFrameDetailProps {
  frame: BoundFrame;
}

export function ReviewFrameDetail({ frame }: ReviewFrameDetailProps) {
  const cardData = boundFrameToCardData(frame);

  return (
    <FrameDetail
      frame={cardData}
      onBack={() => {}}
      onSelectFrame={() => {}}
      readOnly
    />
  );
}

// =============================================================================
// ReviewWeavingPanel — Weaving stage review
// =============================================================================

export interface ReviewWeavingPanelProps {
  sceneArcs: SceneArcType[];
}

/** Convert store SceneArc to display SceneArcData (all marked confirmed) */
function toReviewSceneArcData(arcs: SceneArcType[]): SceneArcData[] {
  return arcs.map((arc) => ({
    id: arc.id,
    sceneNumber: arc.sceneNumber,
    title: arc.title,
    description: arc.description,
    confirmed: true,
  }));
}

export function ReviewWeavingPanel({ sceneArcs }: ReviewWeavingPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const displayArcs = toReviewSceneArcData(sceneArcs);
  const activeArc = displayArcs[activeIndex] ?? null;

  const handleTabClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Static stage label */}
      <div
        className="flex-shrink-0 flex items-center gap-3"
        style={{ padding: '12px var(--panel-padding) 4px' }}
      >
        <span
          className="text-[13px] font-medium"
          style={{ color: 'var(--accent-gold)' }}
        >
          Weaving
        </span>
      </div>

      {/* Scene tabs (all confirmed, clickable for review) */}
      {displayArcs.length > 0 && (
        <SceneTabs
          sceneArcs={displayArcs}
          activeSceneIndex={activeIndex}
          onTabClick={handleTabClick}
        />
      )}

      {/* Scene arc content */}
      <SceneArc sceneArc={activeArc} isStreaming={false} />
    </div>
  );
}

// =============================================================================
// ReviewInscribingPanel — Inscribing stage review
// =============================================================================

export interface ReviewInscribingPanelProps {
  sceneArcs: SceneArcType[];
  inscribingSections: Record<string, InscribingSectionData[]>;
}

export function ReviewInscribingPanel({
  sceneArcs,
  inscribingSections,
}: ReviewInscribingPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailSectionId, setDetailSectionId] = useState<InscribingSectionId | null>(null);

  const displayArcs = toReviewSceneArcData(sceneArcs);
  const activeArc = sceneArcs[activeIndex];
  const activeSceneId = activeArc?.id ?? '';

  // Build scene state from persisted sections
  const sections = inscribingSections[activeSceneId] ?? [];
  const sceneState = inscribingSectionsToSceneState(sections);

  // Derive populated waves
  const populatedWaves = new Set<WaveNumber>();
  for (const section of sceneState.sections) {
    if (section.content.length > 0) {
      populatedWaves.add(section.wave);
    }
  }

  const panelView = detailSectionId ? 'detail' as const : 'accordion' as const;

  const handleTabClick = useCallback((index: number) => {
    setActiveIndex(index);
    setDetailSectionId(null);
  }, []);

  const handleDrillIn = useCallback((sectionId: InscribingSectionId) => {
    setDetailSectionId(sectionId);
  }, []);

  const handleBackToScene = useCallback(() => {
    setDetailSectionId(null);
  }, []);

  return (
    <InscribingPanel
      sceneArcs={displayArcs}
      activeSceneIndex={activeIndex}
      panelView={panelView}
      detailSectionId={detailSectionId}
      sceneState={sceneState}
      populatedWaves={populatedWaves}
      isWave3Dimmed={false}
      isSectionStreaming={false}
      sceneTitle={activeArc?.title ?? ''}
      footerLabel=""
      footerReady={false}
      onTabClick={handleTabClick}
      onDrillIn={handleDrillIn}
      onBackToScene={handleBackToScene}
      onFooterAction={() => {}}
      readOnly
    />
  );
}
