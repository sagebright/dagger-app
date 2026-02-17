/**
 * PortentCard -- Collapsible category card for portents (echoes)
 *
 * Displays a category header with entry count and a chevron.
 * Expands to show portent entries with trigger/benefit/complication
 * fields and scene badges. Mirrors the scrying-immersive mockup
 * accordion pattern.
 *
 * Design reference: documentation/mockups/scrying-immersive.html
 */

import { useState, useCallback } from 'react';
import type { PortentCategoryData, PortentEntry } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

export interface PortentCardProps {
  category: PortentCategoryData;
  defaultExpanded?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function PortentCard({
  category,
  defaultExpanded = false,
}: PortentCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const containerClass = isExpanded
    ? 'portent-category portent-category--expanded'
    : 'portent-category';

  return (
    <div className={containerClass}>
      <button
        className="portent-category-header"
        onClick={toggleExpanded}
        type="button"
        aria-expanded={isExpanded}
        aria-label={category.label}
      >
        <span className="portent-category-chevron">{'\u25B8'}</span>
        <span className="portent-category-name">{category.label}</span>
        <span className="portent-category-count">
          {category.entries.length}
        </span>
      </button>

      {isExpanded && (
        <div className="portent-category-content">
          {category.entries.map((entry) => (
            <PortentEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface PortentEntryCardProps {
  entry: PortentEntry;
}

function PortentEntryCard({ entry }: PortentEntryCardProps) {
  return (
    <div className="portent-entry">
      <div className="portent-entry-title">
        {entry.title}
        <span className="npc-scene-pill" style={{ marginLeft: 8 }}>
          {entry.sceneBadge}
        </span>
      </div>
      <PortentField label="Trigger:" labelClass="portent-label--trigger" text={entry.trigger} />
      <PortentField label="Benefit:" labelClass="portent-label--benefit" text={entry.benefit} />
      <PortentField
        label="Complication:"
        labelClass="portent-label--complication"
        text={entry.complication}
      />
    </div>
  );
}

interface PortentFieldProps {
  label: string;
  labelClass: string;
  text: string;
}

function PortentField({ label, labelClass, text }: PortentFieldProps) {
  return (
    <div className="portent-field">
      <span className={`portent-field-label ${labelClass}`}>{label}</span>
      <span className="portent-field-text">{text}</span>
    </div>
  );
}
