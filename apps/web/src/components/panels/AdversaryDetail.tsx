/**
 * AdversaryDetail -- Drill-in detail view for an adversary entity
 *
 * Shows full stat block, description, traits, and moves.
 * Uses the same back-link pattern as NarrativeDetail.
 *
 * Design reference: documentation/mockups/summoning-immersive.html
 */

import type {
  AdversaryDetailData,
  AdversaryCardType,
} from '@sage-codex/shared-types';

// =============================================================================
// Constants
// =============================================================================

const TYPE_CSS_CLASS: Record<AdversaryCardType, string> = {
  bruiser: 'type-bruiser',
  minion: 'type-minion',
  leader: 'type-leader',
  solo: 'type-solo',
  skulk: 'type-minion',
  horde: 'type-minion',
  environment: 'type-solo',
};

// =============================================================================
// Types
// =============================================================================

export interface AdversaryDetailProps {
  adversary: AdversaryDetailData;
  onBack: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

function formatTypeName(type: AdversaryCardType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// =============================================================================
// Component
// =============================================================================

export function AdversaryDetail({ adversary, onBack }: AdversaryDetailProps) {
  const typeCss = TYPE_CSS_CLASS[adversary.type];

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

      {/* Adversary header */}
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <h3
          className="font-serif text-[16px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {adversary.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span className={`entity-tag ${typeCss}`}>
            {formatTypeName(adversary.type)}
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            Difficulty {adversary.difficulty}
          </span>
        </div>
      </div>

      {/* Stat block */}
      <div className="adversary-detail-statblock">
        <StatRow label="HP" value={String(adversary.stats.hp)} />
        <StatRow label="Stress" value={String(adversary.stats.stress)} />
        <StatRow label="Attack" value={adversary.stats.attack} />
        <StatRow label="Damage" value={adversary.stats.damage} />
      </div>

      {/* Description */}
      {adversary.description && (
        <div style={{ marginTop: 16 }}>
          <span className="npc-detail-label">Description</span>
          <p className="npc-detail-content">{adversary.description}</p>
        </div>
      )}

      {/* Traits */}
      {adversary.traits.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <span className="npc-detail-label">Traits</span>
          <ul className="adversary-detail-traits">
            {adversary.traits.map((trait, index) => (
              <li key={index}>{trait}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Moves */}
      {adversary.moves.length > 0 && (
        <div style={{ marginTop: 16, paddingBottom: 24 }}>
          <span className="npc-detail-label">Moves</span>
          {adversary.moves.map((move, index) => (
            <div key={index} className="adversary-detail-move">
              <span className="adversary-move-name">{move.name}</span>
              <p className="adversary-move-desc">{move.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StatRowProps {
  label: string;
  value: string;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="adversary-detail-stat-row">
      <span className="adversary-detail-stat-label">{label}</span>
      <span className="adversary-detail-stat-value">{value}</span>
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
