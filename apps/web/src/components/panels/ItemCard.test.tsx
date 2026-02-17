/**
 * Tests for ItemCard component
 *
 * Verifies item cards render with:
 * - Name display
 * - Category type label (weapon, armor, item, consumable)
 * - Stat line
 * - Scene badge
 * - Gold left border for assigned items
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ItemCard } from './ItemCard';
import type { ItemCardData } from '@dagger-app/shared-types';

const MOCK_WEAPON: ItemCardData = {
  id: 'item-1',
  name: 'Thornbark Longbow',
  category: 'weapon',
  tier: 2,
  statLine: 'Ranged · Tier 2 · d8 damage',
  sceneAppearances: ['Scene 3'],
};

const MOCK_CONSUMABLE: ItemCardData = {
  id: 'item-2',
  name: 'Witherwild Salve',
  category: 'consumable',
  tier: 2,
  statLine: '2 uses · Heal d6+2',
  sceneAppearances: ['Scene 1'],
};

describe('ItemCard', () => {
  it('renders the item name', () => {
    render(<ItemCard item={MOCK_WEAPON} />);

    expect(screen.getByText('Thornbark Longbow')).toBeInTheDocument();
  });

  it('renders the category type label', () => {
    render(<ItemCard item={MOCK_WEAPON} />);

    expect(screen.getByText('Weapon')).toBeInTheDocument();
  });

  it('renders the stat line', () => {
    render(<ItemCard item={MOCK_WEAPON} />);

    expect(screen.getByText('Ranged · Tier 2 · d8 damage')).toBeInTheDocument();
  });

  it('renders scene badge', () => {
    render(<ItemCard item={MOCK_WEAPON} />);

    expect(screen.getByText('Scene 3')).toBeInTheDocument();
  });

  it('applies category-specific class', () => {
    const { container } = render(<ItemCard item={MOCK_WEAPON} />);

    const tag = container.querySelector('.type-weapon');
    expect(tag).toBeInTheDocument();
  });

  it('renders consumable category correctly', () => {
    render(<ItemCard item={MOCK_CONSUMABLE} />);

    expect(screen.getByText('Consumable')).toBeInTheDocument();
    expect(screen.getByText('2 uses · Heal d6+2')).toBeInTheDocument();
  });

  it('renders with gold left border (assigned class)', () => {
    const { container } = render(<ItemCard item={MOCK_WEAPON} />);

    const card = container.querySelector('.item-card--assigned');
    expect(card).toBeInTheDocument();
  });
});
