/**
 * AdversaryCard -- Compact row card for an adversary in the Inscribing accordion
 *
 * Displays: name (with optional quantity), type badge with color coding,
 * difficulty level, stat line (HP/Stress/ATK/DMG), and scene badge.
 *
 * Design reference: documentation/mockups/summoning-immersive.html
 */

import type { AdversaryCardData, AdversaryCardType } from '@dagger-app/shared-types';

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
// Helpers
// =============================================================================

function formatTypeName(type: AdversaryCardType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// =============================================================================
// Types
// =============================================================================

export interface AdversaryCardProps {
  adversary: AdversaryCardData;
  onClick: (adversaryId: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export function AdversaryCard({ adversary, onClick }: AdversaryCardProps) {
  const typeCss = TYPE_CSS_CLASS[adversary.type];
  const showQuantity = adversary.quantity > 1;

  return (
    <button
      className="adversary-card"
      onClick={() => onClick(adversary.id)}
      type="button"
      aria-label={`View adversary: ${adversary.name}`}
    >
      <span className="adversary-info">
        <span className="adversary-name-row">
          <span className="adversary-name">{adversary.name}</span>
          {showQuantity && (
            <span className="adversary-quantity">{'\u00D7'}{adversary.quantity}</span>
          )}
        </span>
        <span className="adversary-badges">
          <span className={`entity-tag ${typeCss}`}>
            {formatTypeName(adversary.type)}
          </span>
          <span className="adversary-difficulty">
            Difficulty {adversary.difficulty}
          </span>
        </span>
        <span className="adversary-stats">
          <StatPair label="HP" value={String(adversary.stats.hp)} />
          <StatPair label="Stress" value={String(adversary.stats.stress)} />
          <StatPair label="ATK" value={adversary.stats.attack} />
          <StatPair label="DMG" value={adversary.stats.damage} />
        </span>
      </span>

      <span className="adversary-meta">
        {adversary.sceneAppearances.map((scene) => (
          <span key={scene} className="npc-scene-pill">
            {scene}
          </span>
        ))}
      </span>
    </button>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StatPairProps {
  label: string;
  value: string;
}

function StatPair({ label, value }: StatPairProps) {
  return (
    <span className="adversary-stat">
      <span className="adversary-stat-label">{label}</span>{' '}
      {value}
    </span>
  );
}
