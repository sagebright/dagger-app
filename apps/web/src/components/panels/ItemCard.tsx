/**
 * ItemCard -- Row card for an item in the Inscribing accordion
 *
 * Displays: name, category type label, stat line, and scene badge.
 * Assigned items (those with scene appearances) get a gold left border.
 *
 * Design reference: documentation/mockups/enchanting-immersive.html
 */

import type { ItemCardData, ItemCardCategory } from '@dagger-app/shared-types';

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_CSS_CLASS: Record<ItemCardCategory, string> = {
  weapon: 'type-weapon',
  armor: 'type-armor',
  item: 'type-item',
  consumable: 'type-consumable',
};

const CATEGORY_LABELS: Record<ItemCardCategory, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  item: 'Item',
  consumable: 'Consumable',
};

// =============================================================================
// Types
// =============================================================================

export interface ItemCardProps {
  item: ItemCardData;
}

// =============================================================================
// Component
// =============================================================================

export function ItemCard({ item }: ItemCardProps) {
  const categoryCss = CATEGORY_CSS_CLASS[item.category];
  const isAssigned = item.sceneAppearances.length > 0;
  const cardClass = isAssigned
    ? 'item-card item-card--assigned'
    : 'item-card';

  return (
    <div className={cardClass}>
      <div className="item-card-header">
        <span className="item-card-name">{item.name}</span>
        <span className={`entity-tag ${categoryCss}`}>
          {CATEGORY_LABELS[item.category]}
        </span>
      </div>
      <p className="item-card-stat">{item.statLine}</p>
      {item.sceneAppearances.map((scene) => (
        <span key={scene} className="npc-scene-pill" style={{ marginTop: 6 }}>
          {scene}
        </span>
      ))}
    </div>
  );
}
