/**
 * SectionAccordion -- 9-section collapsible accordion for the Inscribing stage
 *
 * Displays 9 sections grouped in 3 waves:
 *   Wave 1 (Primary Narrative): Overview, Setup, Developments
 *   Wave 2 (Entities): NPCs Present, Adversaries, Items
 *   Wave 3 (Synthesis): Transitions, Portents, GM Notes
 *
 * Each wave has a divider label. Wave 3 is dimmed at 0.4 opacity
 * until Waves 1-2 are settled (all populated).
 *
 * Narrative sections (Setup, Developments, Transitions) have clickable
 * names that open a drill-in detail view via `onDrillIn`.
 */

import { useState, useCallback } from 'react';
import type {
  InscribingSectionId,
  InscribingSectionData,
  WaveNumber,
} from '@dagger-app/shared-types';
import { NPCCard } from './NPCCard';
import { AdversaryCard } from './AdversaryCard';
import { ItemCard } from './ItemCard';
import { PortentCard } from './PortentCard';

// =============================================================================
// Constants
// =============================================================================

const WAVE_LABEL: Record<WaveNumber, string> = {
  1: 'Primary Narrative',
  2: 'Entities',
  3: 'Synthesis',
};

const NARRATIVE_SECTION_IDS: Set<InscribingSectionId> = new Set([
  'setup',
  'developments',
  'transitions',
]);

// =============================================================================
// Types
// =============================================================================

export interface SectionAccordionProps {
  /** All 9 section data entries */
  sections: InscribingSectionData[];
  /** Whether Wave 3 should be dimmed */
  isWave3Dimmed: boolean;
  /** Called when a narrative section name is clicked for drill-in */
  onDrillIn: (sectionId: InscribingSectionId) => void;
  /** Called when an NPC card is clicked for drill-in detail */
  onNPCClick?: (npcId: string) => void;
  /** Called when an adversary card is clicked for drill-in detail */
  onAdversaryClick?: (adversaryId: string) => void;
  /** Whether section content is streaming */
  isStreaming?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

/** Group sections by wave number */
function groupByWave(
  sections: InscribingSectionData[]
): Map<WaveNumber, InscribingSectionData[]> {
  const groups = new Map<WaveNumber, InscribingSectionData[]>();
  for (const section of sections) {
    const existing = groups.get(section.wave) ?? [];
    existing.push(section);
    groups.set(section.wave, existing);
  }
  return groups;
}

/** Check if a section supports narrative drill-in */
function isNarrativeSection(sectionId: InscribingSectionId): boolean {
  return NARRATIVE_SECTION_IDS.has(sectionId);
}

// =============================================================================
// Component
// =============================================================================

export function SectionAccordion({
  sections,
  isWave3Dimmed,
  onDrillIn,
  onNPCClick,
  onAdversaryClick,
  isStreaming = false,
}: SectionAccordionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<InscribingSectionId>>(
    new Set()
  );

  const toggleSection = useCallback((sectionId: InscribingSectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const waveGroups = groupByWave(sections);
  const waves: WaveNumber[] = [1, 2, 3];

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-panel"
      style={{ padding: '0 var(--panel-padding)' }}
      role="region"
      aria-label="Scene sections"
    >
      {waves.map((wave) => {
        const waveSections = waveGroups.get(wave) ?? [];
        if (waveSections.length === 0) return null;

        const isDimmed = wave === 3 && isWave3Dimmed;
        const waveClassName = isDimmed
          ? 'wave-group--dimmed'
          : 'wave-group--active';

        return (
          <div key={wave} className={waveClassName}>
            <WaveDivider wave={wave} />
            {waveSections.map((section) => (
              <SectionItem
                key={section.id}
                section={section}
                isExpanded={expandedSections.has(section.id)}
                isStreaming={isStreaming}
                onToggle={() => toggleSection(section.id)}
                onDrillIn={() => onDrillIn(section.id)}
                onNPCClick={onNPCClick}
                onAdversaryClick={onAdversaryClick}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface WaveDividerProps {
  wave: WaveNumber;
}

function WaveDivider({ wave }: WaveDividerProps) {
  return (
    <div className="wave-divider">
      <span className="wave-divider-label">
        Wave {wave} — {WAVE_LABEL[wave]}
      </span>
      <div className="wave-divider-line" />
    </div>
  );
}

/** Entity section IDs that render card components instead of plain text */
const ENTITY_SECTION_IDS: Set<InscribingSectionId> = new Set([
  'npcs_present',
  'adversaries',
  'items',
  'portents',
]);

/** Check if a section renders entity cards */
function isEntitySection(sectionId: InscribingSectionId): boolean {
  return ENTITY_SECTION_IDS.has(sectionId);
}

/** Check if a section has entity data populated */
function hasEntityData(section: InscribingSectionData): boolean {
  switch (section.id) {
    case 'npcs_present':
      return (section.entityNPCs?.length ?? 0) > 0;
    case 'adversaries':
      return (section.entityAdversaries?.length ?? 0) > 0;
    case 'items':
      return (section.entityItems?.length ?? 0) > 0;
    case 'portents':
      return (section.entityPortents?.length ?? 0) > 0;
    default:
      return false;
  }
}

interface SectionItemProps {
  section: InscribingSectionData;
  isExpanded: boolean;
  isStreaming: boolean;
  onToggle: () => void;
  onDrillIn: () => void;
  onNPCClick?: (npcId: string) => void;
  onAdversaryClick?: (adversaryId: string) => void;
}

function SectionItem({
  section,
  isExpanded,
  isStreaming,
  onToggle,
  onDrillIn,
  onNPCClick,
  onAdversaryClick,
}: SectionItemProps) {
  const hasDetail = isNarrativeSection(section.id);
  const hasContent = section.content.length > 0;
  const hasEntities = isEntitySection(section.id) && hasEntityData(section);

  const itemClassNames = [
    'section-accordion-item',
    isExpanded ? 'section-accordion-item--expanded' : '',
    hasDetail ? 'section-accordion-item--has-detail' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleNameClick = useCallback(
    (e: React.MouseEvent) => {
      if (hasDetail && hasContent) {
        e.stopPropagation();
        onDrillIn();
      }
    },
    [hasDetail, hasContent, onDrillIn]
  );

  return (
    <div className={itemClassNames}>
      <button
        className="section-accordion-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        type="button"
      >
        <span className="section-accordion-chevron">&#x25B6;</span>
        <span
          className="section-accordion-name"
          onClick={handleNameClick}
          role={hasDetail ? 'link' : undefined}
        >
          {section.label}
        </span>
      </button>

      {isExpanded && hasEntities && (
        <div className="section-accordion-body">
          <EntitySectionContent
            section={section}
            onNPCClick={onNPCClick}
            onAdversaryClick={onAdversaryClick}
          />
        </div>
      )}

      {isExpanded && !hasEntities && hasContent && (
        <div className="section-accordion-body">
          <SectionContent
            content={section.content}
            isStreaming={isStreaming}
          />
        </div>
      )}

      {isExpanded && !hasEntities && !hasContent && (
        <div className="section-accordion-body">
          <p
            className="font-serif text-[13px] italic"
            style={{ color: 'var(--text-muted)' }}
          >
            Awaiting the Sage...
          </p>
        </div>
      )}
    </div>
  );
}

interface SectionContentProps {
  content: string;
  isStreaming: boolean;
}

function SectionContent({ content, isStreaming }: SectionContentProps) {
  const paragraphs = content.split('\n\n').filter(Boolean);

  return (
    <>
      {paragraphs.map((paragraph, index) => {
        const isLast = index === paragraphs.length - 1;
        const showCursor = isStreaming && isLast;

        return (
          <p
            key={index}
            className={showCursor ? 'streaming-cursor' : ''}
            style={{
              marginTop: index > 0 ? '8px' : '0',
            }}
          >
            {paragraph}
          </p>
        );
      })}
    </>
  );
}

interface EntitySectionContentProps {
  section: InscribingSectionData;
  onNPCClick?: (npcId: string) => void;
  onAdversaryClick?: (adversaryId: string) => void;
}

function EntitySectionContent({
  section,
  onNPCClick,
  onAdversaryClick,
}: EntitySectionContentProps) {
  const npcClickHandler = onNPCClick ?? (() => {});
  const adversaryClickHandler = onAdversaryClick ?? (() => {});

  switch (section.id) {
    case 'npcs_present':
      return (
        <div className="entity-card-list">
          {(section.entityNPCs ?? []).map((npc) => (
            <NPCCard key={npc.id} npc={npc} onClick={npcClickHandler} />
          ))}
        </div>
      );
    case 'adversaries':
      return (
        <div className="entity-card-list">
          {(section.entityAdversaries ?? []).map((adv) => (
            <AdversaryCard key={adv.id} adversary={adv} onClick={adversaryClickHandler} />
          ))}
        </div>
      );
    case 'items':
      return (
        <div className="entity-card-list">
          {(section.entityItems ?? []).map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      );
    case 'portents':
      return (
        <div className="entity-card-list">
          {(section.entityPortents ?? []).map((cat) => (
            <PortentCard key={cat.category} category={cat} />
          ))}
        </div>
      );
    default:
      return null;
  }
}
