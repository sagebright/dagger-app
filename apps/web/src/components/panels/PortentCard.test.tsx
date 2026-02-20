/**
 * Tests for PortentCard component
 *
 * Verifies portent category cards render with:
 * - Category name and entry count
 * - Expandable/collapsible behavior
 * - Trigger/benefit/complication fields per entry
 * - Scene badges on entries
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { PortentCard } from './PortentCard';
import type { PortentCategoryData } from '@sage-codex/shared-types';

const MOCK_PORTENT_CATEGORY: PortentCategoryData = {
  category: 'items_clues',
  label: 'Items & Clues',
  entries: [
    {
      id: 'echo-1',
      title: "The Merchant's Ledger",
      sceneBadge: 'Scene 1',
      trigger: 'A player describes searching the overturned cart carefully',
      benefit: 'Find a wax-sealed ledger with merchant routes and contacts',
      complication:
        'The ledger also contains coded messages suggesting the merchant was smuggling something',
    },
    {
      id: 'echo-2',
      title: 'Hollow Bark Cache',
      sceneBadge: 'Scene 1',
      trigger: 'A player examines the unusually thick tree trunks',
      benefit: 'Discover a Wickling supply cache with herbs and a crude map',
      complication:
        'Taking from the cache may mark them as thieves to the Wicklings',
    },
  ],
};

describe('PortentCard', () => {
  it('renders category name', () => {
    render(<PortentCard category={MOCK_PORTENT_CATEGORY} />);

    expect(screen.getByText('Items & Clues')).toBeInTheDocument();
  });

  it('renders entry count', () => {
    render(<PortentCard category={MOCK_PORTENT_CATEGORY} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('is collapsed by default', () => {
    render(<PortentCard category={MOCK_PORTENT_CATEGORY} />);

    expect(
      screen.queryByText("The Merchant's Ledger")
    ).not.toBeInTheDocument();
  });

  it('expands to show entries when clicked', async () => {
    const user = userEvent.setup();
    render(<PortentCard category={MOCK_PORTENT_CATEGORY} />);

    const header = screen.getByRole('button', { name: /items & clues/i });
    await user.click(header);

    expect(screen.getByText("The Merchant's Ledger")).toBeInTheDocument();
    expect(screen.getByText('Hollow Bark Cache')).toBeInTheDocument();
  });

  it('renders trigger/benefit/complication when expanded', () => {
    render(
      <PortentCard category={MOCK_PORTENT_CATEGORY} defaultExpanded={true} />
    );

    const triggers = screen.getAllByText('Trigger:');
    const benefits = screen.getAllByText('Benefit:');
    const complications = screen.getAllByText('Complication:');

    expect(triggers).toHaveLength(2);
    expect(benefits).toHaveLength(2);
    expect(complications).toHaveLength(2);
  });

  it('renders scene badges on entries when expanded', async () => {
    render(
      <PortentCard category={MOCK_PORTENT_CATEGORY} defaultExpanded={true} />
    );

    const sceneBadges = screen.getAllByText('Scene 1');
    expect(sceneBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('collapses when clicked again', async () => {
    const user = userEvent.setup();
    render(<PortentCard category={MOCK_PORTENT_CATEGORY} />);

    const header = screen.getByRole('button', { name: /items & clues/i });
    await user.click(header);
    expect(screen.getByText("The Merchant's Ledger")).toBeInTheDocument();

    await user.click(header);
    expect(
      screen.queryByText("The Merchant's Ledger")
    ).not.toBeInTheDocument();
  });
});
