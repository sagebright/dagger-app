/**
 * CelebrationPanel -- Right panel for the Delivering stage
 *
 * Renders a narrative journey through the completed adventure:
 *   - Adventure title (gold serif, centered)
 *   - Spark callback (bordered card echoing the Invoking vision)
 *   - Frame overview (name + description)
 *   - Inciting incident (first scene's description)
 *   - Narrative send-off (italic Sage farewell)
 *   - "Bring This Tale to Life" download button (footer)
 *
 * DESIGN RATIONALE: This is a celebration, not a review. No checklists,
 * no stat boxes, no format selectors. The user should feel "look at what
 * we created together." The download button is the only interactive element.
 */

import { StageDropdown } from '@/components/layout/StageDropdown';
import { StageFooter } from '@/components/layout/StageFooter';
import type { AdventureSpark, BoundFrame, SceneArc } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface CelebrationPanelProps {
  /** Final adventure name (gold serif title) */
  adventureName: string | null;
  /** The original spark from Invoking */
  spark: AdventureSpark | null;
  /** The selected frame from Binding */
  frame: BoundFrame | null;
  /** Scene arcs for deriving the inciting incident */
  sceneArcs: SceneArc[];
  /** Whether the download is ready */
  isReady: boolean;
  /** Whether a download is currently in progress */
  isDownloading: boolean;
  /** Called when the download button is clicked */
  onDownload: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const SEND_OFF_TEXT =
  'Your adventure has been delivered. It is now in your hands \u2014 ' +
  'take this tale from the pages of the Sage Codex and bring it to life ' +
  'at your table. The story doesn\u2019t truly begin until your players ' +
  'sit down and make it their own.';

const FOOTER_HELPER_TEXT =
  'Downloads Markdown + PDF as a zip file.';

// =============================================================================
// Component
// =============================================================================

export function CelebrationPanel({
  adventureName,
  spark,
  frame,
  sceneArcs,
  isReady,
  isDownloading,
  onDownload,
}: CelebrationPanelProps) {
  const incitingIncident = deriveIncitingIncident(sceneArcs);
  const downloadLabel = isDownloading
    ? 'Preparing Download\u2026'
    : 'Bring This Tale to Life';

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Panel header with stage dropdown */}
      <div
        className="flex-shrink-0 flex items-center gap-3"
        style={{ padding: '12px var(--panel-padding) 4px' }}
      >
        <StageDropdown currentStage="delivering" />
      </div>

      {/* Scrollable celebration content */}
      <div
        className="flex-1 overflow-y-auto scrollbar-panel"
        style={{ padding: '8px var(--panel-padding) var(--panel-padding)' }}
      >
        {/* Adventure title */}
        <AdventureTitle name={adventureName} />

        <Divider />

        {/* Spark callback */}
        {spark && <SparkCallback spark={spark} />}

        {/* Frame overview */}
        {frame && <FrameOverview frame={frame} />}

        {/* Inciting incident */}
        {incitingIncident && <IncitingIncident text={incitingIncident} />}

        {/* Narrative send-off */}
        <SendOff />
      </div>

      {/* Fixed footer with download button */}
      <div className="panel-footer">
        <div
          className="text-[11px] text-center mb-2 leading-[1.4]"
          style={{ color: 'var(--text-muted)' }}
        >
          {FOOTER_HELPER_TEXT}
        </div>
        <StageFooter
          label={downloadLabel}
          isReady={isReady && !isDownloading}
          onAdvance={onDownload}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function AdventureTitle({ name }: { name: string | null }) {
  return (
    <div
      className="font-serif text-[22px] font-semibold text-center leading-[1.3]"
      style={{ color: 'var(--accent-gold)', padding: '16px 0 8px' }}
    >
      {name ?? 'Untitled Adventure'}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--border-subtle)',
        margin: '4px 0 16px',
      }}
    />
  );
}

function SparkCallback({ spark }: { spark: AdventureSpark }) {
  return (
    <>
      <SectionLabel text="Your Spark" />
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderLeft: '3px solid var(--accent-gold-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 16px',
          marginBottom: 20,
        }}
      >
        <div
          className="text-[13px] leading-[1.65]"
          style={{ color: 'var(--text-secondary)' }}
        >
          &ldquo;{spark.vision}&rdquo;
        </div>
      </div>
    </>
  );
}

function FrameOverview({ frame }: { frame: BoundFrame }) {
  return (
    <>
      <SectionLabel text="The Frame" />
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div
          className="font-serif text-[16px] font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {frame.name}
        </div>
        <div
          className="text-[13px] leading-[1.65]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {frame.description}
        </div>
      </div>
    </>
  );
}

function IncitingIncident({ text }: { text: string }) {
  return (
    <>
      <SectionLabel text="The Inciting Incident" />
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div
          className="text-[13px] leading-[1.65]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {text}
        </div>
      </div>
    </>
  );
}

function SendOff() {
  return (
    <div
      className="text-center"
      style={{ padding: '16px 8px 24px', marginBottom: 16 }}
    >
      <div
        className="font-serif text-[15px] italic leading-[1.7]"
        style={{ color: 'var(--text-secondary)' }}
      >
        {SEND_OFF_TEXT}
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      className="font-serif text-[11px] font-semibold uppercase mb-2"
      style={{
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
      }}
    >
      {text}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Derive the inciting incident from the first scene arc's description.
 *
 * Falls back to null if there are no scene arcs.
 */
function deriveIncitingIncident(sceneArcs: SceneArc[]): string | null {
  if (sceneArcs.length === 0) return null;
  return sceneArcs[0].description;
}
