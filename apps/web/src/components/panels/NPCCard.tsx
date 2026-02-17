/**
 * NPCCard -- Compact row card for an NPC in the Inscribing accordion
 *
 * Displays: avatar initials, name, role-colored label, scene badges,
 * and enriched/basic status indicator. Enriched NPCs get a gold
 * left border matching the confirmed-component visual pattern.
 *
 * Design reference: documentation/mockups/conjuring-immersive.html
 */

import type { NPCCardData, NPCCardRole } from '@dagger-app/shared-types';

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
// Helpers
// =============================================================================

/** Extract uppercase initials from a name (first letter of each word) */
function extractInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/** Capitalize first letter of a role string */
function formatRole(role: NPCCardRole): string {
  const display = role.replace(/-/g, ' ');
  return display.charAt(0).toUpperCase() + display.slice(1);
}

// =============================================================================
// Types
// =============================================================================

export interface NPCCardProps {
  npc: NPCCardData;
  onClick: (npcId: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export function NPCCard({ npc, onClick }: NPCCardProps) {
  const initials = extractInitials(npc.name);
  const roleCss = ROLE_CSS_CLASS[npc.role] ?? 'role-minor';
  const cardClass = npc.isEnriched ? 'npc-card npc-card--enriched' : 'npc-card';
  const avatarClass = npc.isEnriched ? 'npc-avatar npc-avatar--enriched' : 'npc-avatar';

  return (
    <button
      className={cardClass}
      onClick={() => onClick(npc.id)}
      type="button"
      aria-label={`View NPC: ${npc.name}`}
    >
      <span className={avatarClass}>{initials}</span>

      <span className="npc-info">
        <span className="npc-name">{npc.name}</span>
        <span className={`entity-tag ${roleCss}`}>{formatRole(npc.role)}</span>
      </span>

      <span className="npc-meta">
        <span className="npc-scene-badges">
          {npc.sceneAppearances.map((scene) => (
            <span key={scene} className="npc-scene-pill">
              {scene}
            </span>
          ))}
        </span>
        <span
          className={
            npc.isEnriched
              ? 'npc-enrichment npc-enrichment--enriched'
              : 'npc-enrichment npc-enrichment--basic'
          }
          data-enriched={npc.isEnriched}
          title={npc.isEnriched ? 'Enriched' : 'Basic'}
        >
          {npc.isEnriched ? '\u2714' : '\u2014'}
        </span>
      </span>
    </button>
  );
}
