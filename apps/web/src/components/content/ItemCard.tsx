/**
 * ItemCard Component
 *
 * Displays individual item information including:
 * - Name, category, description
 * - Tier (for weapons/armor)
 * - Category-specific stats (weapon damage, armor score, consumable uses)
 * - Selection checkbox with quantity stepper
 * - Confirm action
 * Fantasy-themed styling consistent with other content components.
 */

import { useState, useCallback } from 'react';
import type { UnifiedItem, ItemCategory } from '@dagger-app/shared-types';

// =============================================================================
// Props
// =============================================================================

export interface ItemCardProps {
  /** The unified item to display */
  item: UnifiedItem;
  /** Whether the item is selected */
  isSelected?: boolean;
  /** Current quantity if selected */
  quantity?: number;
  /** Whether the item is confirmed */
  isConfirmed?: boolean;
  /** Callback when selection is toggled */
  onToggleSelect: (itemId: string, category: ItemCategory) => void;
  /** Callback when quantity changes */
  onQuantityChange?: (itemId: string, category: ItemCategory, quantity: number) => void;
  /** Callback when item is confirmed */
  onConfirm?: (itemId: string, category: ItemCategory) => void;
  /** Whether to show expanded details by default */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Category Styling Helpers
// =============================================================================

const categoryStyles: Record<ItemCategory, { bg: string; text: string; icon: string }> = {
  item: {
    bg: 'bg-parchment-200 dark:bg-shadow-600',
    text: 'text-ink-600 dark:text-parchment-400',
    icon: '📦',
  },
  weapon: {
    bg: 'bg-blood-100 dark:bg-blood-900/40',
    text: 'text-blood-700 dark:text-blood-400',
    icon: '⚔️',
  },
  armor: {
    bg: 'bg-ink-100 dark:bg-ink-800',
    text: 'text-ink-600 dark:text-ink-400',
    icon: '🛡️',
  },
  consumable: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-400',
    icon: '🧪',
  },
};

const tierStyles: Record<number, { bg: string; text: string; border: string }> = {
  1: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-300 dark:border-green-700',
  },
  2: {
    bg: 'bg-gold-100 dark:bg-gold-900/40',
    text: 'text-gold-700 dark:text-gold-400',
    border: 'border-gold-300 dark:border-gold-700',
  },
  3: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-300 dark:border-orange-700',
  },
  4: {
    bg: 'bg-blood-100 dark:bg-blood-900/40',
    text: 'text-blood-700 dark:text-blood-400',
    border: 'border-blood-300 dark:border-blood-700',
  },
};

/**
 * Get item tier (only weapons and armor have tiers)
 */
function getItemTier(item: UnifiedItem): number | null {
  if (item.category === 'weapon') {
    return item.data.tier;
  }
  if (item.category === 'armor') {
    return item.data.tier;
  }
  return null;
}

/**
 * Get display name for category
 */
function getCategoryDisplayName(category: ItemCategory): string {
  switch (category) {
    case 'item':
      return 'Item';
    case 'weapon':
      return 'Weapon';
    case 'armor':
      return 'Armor';
    case 'consumable':
      return 'Consumable';
  }
}

/**
 * Get description from any item type (weapons don't have description field)
 */
function getItemDescription(item: UnifiedItem): string {
  switch (item.category) {
    case 'item':
    case 'consumable':
      return item.data.description || '';
    case 'weapon':
      // Weapons don't have description, construct one from stats
      return `${item.data.weapon_category} weapon. ${item.data.trait}, ${item.data.damage} damage, ${item.data.range} range.`;
    case 'armor':
      // Armor doesn't have description, construct one from stats
      return `Base score ${item.data.base_score}, thresholds ${item.data.base_thresholds}.${item.data.feature ? ` ${item.data.feature}` : ''}`;
  }
}

// =============================================================================
// Component
// =============================================================================

export function ItemCard({
  item,
  isSelected = false,
  quantity = 1,
  isConfirmed = false,
  onToggleSelect,
  onQuantityChange,
  onConfirm,
  defaultExpanded = false,
  className = '',
}: ItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleToggleSelect = useCallback(() => {
    onToggleSelect(item.data.name, item.category);
  }, [item.data.name, item.category, onToggleSelect]);

  const handleQuantityIncrease = useCallback(() => {
    if (onQuantityChange && quantity < 10) {
      onQuantityChange(item.data.name, item.category, quantity + 1);
    }
  }, [item.data.name, item.category, onQuantityChange, quantity]);

  const handleQuantityDecrease = useCallback(() => {
    if (onQuantityChange && quantity > 1) {
      onQuantityChange(item.data.name, item.category, quantity - 1);
    }
  }, [item.data.name, item.category, onQuantityChange, quantity]);

  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm(item.data.name, item.category);
    }
  }, [item.data.name, item.category, onConfirm]);

  const categoryStyle = categoryStyles[item.category];
  const tier = getItemTier(item);
  const tierStyle = tier ? tierStyles[tier] : null;

  // Determine if there's expandable content based on category
  const hasExpandableContent =
    (item.category === 'weapon' && item.data.feature) ||
    (item.category === 'armor' && item.data.feature) ||
    (item.category === 'item' && item.data.item_type);

  return (
    <article
      className={`
        bg-parchment-50 dark:bg-shadow-800
        border border-ink-200 dark:border-shadow-600
        rounded-fantasy overflow-hidden
        transition-all duration-200
        motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-gold-glow-subtle
        ${isSelected ? 'ring-2 ring-gold-400 dark:ring-gold-500 motion-safe:animate-selection-glow' : ''}
        ${isConfirmed ? 'border-2 border-gold-400 dark:border-gold-500 shadow-gold-glow-subtle' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-ink-200 dark:border-shadow-600">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Selection checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleToggleSelect}
                className="
                  w-4 h-4 rounded
                  border-ink-300 dark:border-shadow-500
                  text-gold-500
                  dark:bg-shadow-700
                  focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
                  focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-900
                "
                aria-label={`Select ${item.data.name}`}
              />
              <h3 className="text-lg font-serif font-bold text-ink-800 dark:text-parchment-100 truncate">
                {item.data.name}
              </h3>
              {tierStyle && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${tierStyle.bg} ${tierStyle.text}`}
                >
                  T{tier}
                </span>
              )}
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${categoryStyle.bg} ${categoryStyle.text}`}
              >
                {categoryStyle.icon} {getCategoryDisplayName(item.category)}
              </span>
            </div>
            <p className="text-sm text-ink-600 dark:text-parchment-400 line-clamp-2">
              {getItemDescription(item)}
            </p>
          </div>
          {isConfirmed && (
            <span className="px-2 py-1 text-xs font-medium bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-400 rounded-full shrink-0">
              Confirmed
            </span>
          )}
        </div>
      </div>

      {/* Category-specific Stats Bar */}
      {renderStatsBar(item)}

      {/* Expandable details */}
      {isExpanded && hasExpandableContent && (
        <div className="p-4 space-y-3 border-b border-ink-100 dark:border-shadow-700">
          {renderExpandedDetails(item)}
        </div>
      )}

      {/* Show more/less toggle */}
      {hasExpandableContent && (
        <div className="px-4 py-2 border-b border-ink-100 dark:border-shadow-700">
          <button
            type="button"
            onClick={handleToggleExpand}
            className="
              text-xs text-gold-600 dark:text-gold-400
              hover:text-gold-500 dark:hover:text-gold-300 font-medium
              focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-1
              focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-800
              rounded
            "
            aria-label={isExpanded ? 'Show less details' : 'Show more details'}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}

      {/* Selection actions */}
      {isSelected && !isConfirmed && (
        <div className="p-3 border-t border-ink-200 dark:border-shadow-600 bg-parchment-100 dark:bg-shadow-800">
          <div className="flex items-center justify-between gap-3">
            {/* Quantity stepper */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-600 dark:text-parchment-400">Qty:</span>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleQuantityDecrease}
                  disabled={quantity <= 1}
                  className="
                    w-6 h-6 flex items-center justify-center
                    bg-parchment-200 dark:bg-shadow-600
                    text-ink-700 dark:text-parchment-300
                    border border-ink-300 dark:border-shadow-500
                    rounded-l
                    hover:bg-gold-100 dark:hover:bg-gold-900/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-1
                    focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-800
                  "
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span
                  className="
                    w-8 h-6 flex items-center justify-center
                    bg-white dark:bg-shadow-700
                    text-sm font-medium text-ink-800 dark:text-parchment-200
                    border-y border-ink-300 dark:border-shadow-500
                  "
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleQuantityIncrease}
                  disabled={quantity >= 10}
                  className="
                    w-6 h-6 flex items-center justify-center
                    bg-parchment-200 dark:bg-shadow-600
                    text-ink-700 dark:text-parchment-300
                    border border-ink-300 dark:border-shadow-500
                    rounded-r
                    hover:bg-gold-100 dark:hover:bg-gold-900/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-1
                    focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-800
                  "
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Confirm button */}
            {onConfirm && (
              <button
                type="button"
                onClick={handleConfirm}
                className="
                  py-1.5 px-4 text-sm font-medium
                  bg-gold-500 border-gold-600 text-ink-900
                  rounded-fantasy
                  hover:bg-gold-400 hover:border-gold-500
                  dark:bg-gold-600 dark:border-gold-500 dark:text-ink-900
                  dark:hover:bg-gold-500 dark:hover:border-gold-400
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2
                  focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-800
                "
                aria-label="Confirm item selection"
              >
                Confirm
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// =============================================================================
// Render Helpers
// =============================================================================

/**
 * Render category-specific stats bar
 */
function renderStatsBar(item: UnifiedItem): JSX.Element | null {
  switch (item.category) {
    case 'weapon':
      return (
        <div className="px-4 py-2 bg-parchment-100/50 dark:bg-shadow-700/50 border-b border-ink-100 dark:border-shadow-700">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-blood-600 dark:text-blood-400">Trait</span>
              <span className="text-ink-700 dark:text-parchment-300">{item.data.trait}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-orange-600 dark:text-orange-400">Dmg</span>
              <span className="text-ink-700 dark:text-parchment-300">{item.data.damage}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-ink-500 dark:text-parchment-500">Range</span>
              <span className="text-ink-700 dark:text-parchment-300">{item.data.range}</span>
            </div>
            {item.data.burden && (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-purple-600 dark:text-purple-400">Burden</span>
                <span className="text-ink-700 dark:text-parchment-300">{item.data.burden}</span>
              </div>
            )}
          </div>
        </div>
      );

    case 'armor':
      return (
        <div className="px-4 py-2 bg-parchment-100/50 dark:bg-shadow-700/50 border-b border-ink-100 dark:border-shadow-700">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gold-600 dark:text-gold-400">Score</span>
              <span className="text-ink-700 dark:text-parchment-300">{item.data.base_score}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-ink-500 dark:text-parchment-500">Thresholds</span>
              <span className="text-ink-700 dark:text-parchment-300">{item.data.base_thresholds}</span>
            </div>
          </div>
        </div>
      );

    case 'consumable':
      return item.data.uses ? (
        <div className="px-4 py-2 bg-parchment-100/50 dark:bg-shadow-700/50 border-b border-ink-100 dark:border-shadow-700">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-green-600 dark:text-green-400">Uses</span>
              <span className="text-ink-700 dark:text-parchment-300">{item.data.uses}</span>
            </div>
          </div>
        </div>
      ) : null;

    case 'item':
      return item.data.item_type ? (
        <div className="px-4 py-2 bg-parchment-100/50 dark:bg-shadow-700/50 border-b border-ink-100 dark:border-shadow-700">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-ink-500 dark:text-parchment-500">Type</span>
              <span className="text-ink-700 dark:text-parchment-300 capitalize">{item.data.item_type}</span>
            </div>
          </div>
        </div>
      ) : null;
  }
}

/**
 * Render expanded details based on category
 */
function renderExpandedDetails(item: UnifiedItem): JSX.Element | null {
  switch (item.category) {
    case 'weapon':
      return item.data.feature ? (
        <section>
          <h4 className="text-xs font-semibold text-ink-500 dark:text-parchment-500 uppercase tracking-wide mb-1">
            Feature
          </h4>
          <p className="text-sm text-ink-700 dark:text-parchment-300">{item.data.feature}</p>
        </section>
      ) : null;

    case 'armor':
      return item.data.feature ? (
        <section>
          <h4 className="text-xs font-semibold text-ink-500 dark:text-parchment-500 uppercase tracking-wide mb-1">
            Feature
          </h4>
          <p className="text-sm text-ink-700 dark:text-parchment-300">{item.data.feature}</p>
        </section>
      ) : null;

    case 'item':
      return item.data.item_type ? (
        <section>
          <h4 className="text-xs font-semibold text-ink-500 dark:text-parchment-500 uppercase tracking-wide mb-1">
            Item Type
          </h4>
          <p className="text-sm text-ink-700 dark:text-parchment-300 capitalize">{item.data.item_type}</p>
        </section>
      ) : null;

    default:
      return null;
  }
}
