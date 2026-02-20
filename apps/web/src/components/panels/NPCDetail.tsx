/**
 * NPCDetail -- Drill-in detail view for an NPC entity
 *
 * Shows all NPC fields: name, role, description, backstory, voice,
 * motivation, and secret. Uses the same back-link pattern as
 * NarrativeDetail for navigation consistency.
 *
 * Design reference: documentation/mockups/conjuring-immersive.html
 */

import type { NPCDetailData, NPCCardRole } from '@sage-codex/shared-types';

// =============================================================================
// Constants
// =============================================================================

const ROLE_CSS_CLASS: Record<string, string> = {
  leader: 'role-leader',
  antagonist: 'role-antagonist',
  oracle: 'role-oracle',
  scout: 'role-scout',
  ally: 'role-leader',
  neutral: 'role-minor',
  'quest-giver': 'role-oracle',
  bystander: 'role-minor',
  informant: 'role-scout',
};

// =============================================================================
// Types
// =============================================================================

export interface NPCDetailProps {
  npc: NPCDetailData;
  onBack: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

function formatRole(role: NPCCardRole): string {
  const display = role.replace(/-/g, ' ');
  return display.charAt(0).toUpperCase() + display.slice(1);
}

// =============================================================================
// Component
// =============================================================================

export function NPCDetail({ npc, onBack }: NPCDetailProps) {
  const roleCss = ROLE_CSS_CLASS[npc.role] ?? 'role-minor';

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-panel"
      style={{ padding: '0 var(--panel-padding)' }}
    >
      {/* Back navigation */}
      <button className="back-link" onClick={onBack} type="button">
        <BackArrow />
        Back to Scene
      </button>

      {/* NPC header */}
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <h3
          className="font-serif text-[16px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {npc.name}
        </h3>
        <span className={`entity-tag ${roleCss}`} style={{ marginTop: 4 }}>
          {formatRole(npc.role)}
        </span>
      </div>

      {/* NPC detail fields */}
      <div style={{ paddingBottom: 24 }}>
        <DetailField label="Description" content={npc.description} />

        {npc.backstory && (
          <DetailField label="Backstory" content={npc.backstory} />
        )}

        {npc.voice && <DetailField label="Voice" content={npc.voice} />}

        {npc.motivation && (
          <DetailField label="Motivation" content={npc.motivation} />
        )}

        {npc.secret && (
          <DetailField label="Secret" content={npc.secret} isSecret />
        )}

        {npc.sceneAppearances.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <span className="npc-detail-label">Appears In</span>
            <div className="npc-detail-scenes">
              {npc.sceneAppearances.map((scene) => (
                <span key={scene} className="npc-scene-pill">
                  {scene}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface DetailFieldProps {
  label: string;
  content: string;
  isSecret?: boolean;
}

function DetailField({ label, content, isSecret = false }: DetailFieldProps) {
  return (
    <div style={{ marginTop: 16 }}>
      <span
        className="npc-detail-label"
        style={isSecret ? { color: 'var(--accent-gold)' } : undefined}
      >
        {label}
      </span>
      <p className="npc-detail-content">{content}</p>
    </div>
  );
}

function BackArrow() {
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
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
