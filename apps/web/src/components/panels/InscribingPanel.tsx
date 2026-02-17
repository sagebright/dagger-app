/**
 * InscribingPanel -- Right-side panel for the Inscribing stage
 *
 * Renders the panel layout with:
 * - Stage dropdown + wave indicator header
 * - Scene tabs for multi-scene navigation
 * - Invalidation/balance warning banners
 * - SectionAccordion or NarrativeDetail content area
 * - StageFooter for scene confirmation
 *
 * Extracted from InscribingPage for code organization.
 */

import { StageDropdown } from '@/components/layout/StageDropdown';
import { SceneTabs } from '@/components/panels/SceneTabs';
import { WaveIndicator } from '@/components/panels/WaveIndicator';
import { SectionAccordion } from '@/components/panels/SectionAccordion';
import { NarrativeDetail } from '@/components/panels/NarrativeDetail';
import { StageFooter } from '@/components/layout/StageFooter';
import type {
  SceneArcData,
  InscribingSectionData,
  InscribingSectionId,
  WaveNumber,
} from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

/** Per-scene state for the Inscribing panel */
export interface SceneInscriptionState {
  sections: InscribingSectionData[];
  confirmed: boolean;
  wave3Invalidated: boolean;
  invalidationReason: string | null;
  balanceWarning: string | null;
}

/** View mode for the right panel */
export type PanelView = 'accordion' | 'detail';

export interface InscribingPanelProps {
  sceneArcs: SceneArcData[];
  activeSceneIndex: number;
  panelView: PanelView;
  detailSectionId: InscribingSectionId | null;
  sceneState: SceneInscriptionState;
  populatedWaves: Set<WaveNumber>;
  isWave3Dimmed: boolean;
  isSectionStreaming: boolean;
  sceneTitle: string;
  footerLabel: string;
  footerReady: boolean;
  onTabClick: (index: number) => void;
  onDrillIn: (sectionId: InscribingSectionId) => void;
  onBackToScene: () => void;
  onFooterAction: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function InscribingPanel({
  sceneArcs,
  activeSceneIndex,
  panelView,
  detailSectionId,
  sceneState,
  populatedWaves,
  isWave3Dimmed,
  isSectionStreaming,
  sceneTitle,
  footerLabel,
  footerReady,
  onTabClick,
  onDrillIn,
  onBackToScene,
  onFooterAction,
}: InscribingPanelProps) {
  const detailSection = detailSectionId
    ? sceneState.sections.find((s) => s.id === detailSectionId)
    : null;

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Panel header with stage dropdown and wave indicator */}
      <div
        className="flex-shrink-0 flex items-center justify-between"
        style={{ padding: '12px var(--panel-padding) 4px' }}
      >
        <StageDropdown currentStage="inscribing" />
        <WaveIndicator
          populatedWaves={populatedWaves}
          isWave3Dimmed={isWave3Dimmed}
        />
      </div>

      {/* Scene tabs */}
      {sceneArcs.length > 0 && (
        <SceneTabs
          sceneArcs={sceneArcs}
          activeSceneIndex={activeSceneIndex}
          onTabClick={onTabClick}
        />
      )}

      {/* Invalidation banner */}
      {sceneState.wave3Invalidated && sceneState.invalidationReason && (
        <div
          className="invalidation-banner"
          style={{ margin: '0 var(--panel-padding)' }}
        >
          <InvalidationIcon />
          <span>Wave 3 invalidated: {sceneState.invalidationReason}</span>
        </div>
      )}

      {/* Balance warning */}
      {sceneState.balanceWarning && (
        <div
          className="balance-warning"
          style={{ margin: '4px var(--panel-padding) 0' }}
        >
          <WarningIcon />
          <span>{sceneState.balanceWarning}</span>
        </div>
      )}

      {/* Panel content: accordion or detail */}
      {panelView === 'detail' && detailSectionId && detailSection ? (
        <NarrativeDetail
          sectionId={detailSectionId}
          content={detailSection.content}
          sceneTitle={sceneTitle}
          onBack={onBackToScene}
        />
      ) : (
        <SectionAccordion
          sections={sceneState.sections}
          isWave3Dimmed={isWave3Dimmed}
          onDrillIn={onDrillIn}
          isStreaming={isSectionStreaming}
        />
      )}

      {/* Fixed footer */}
      <StageFooter
        label={footerLabel}
        isReady={footerReady}
        onAdvance={onFooterAction}
      />
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function InvalidationIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
