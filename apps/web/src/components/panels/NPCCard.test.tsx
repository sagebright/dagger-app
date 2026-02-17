/**
 * Tests for NPCCard component
 *
 * Verifies NPC cards render with:
 * - Name display
 * - Role-colored labels (entity-tag CSS classes)
 * - Scene appearance badges
 * - Enriched/basic visual distinction
 * - Click handler for drill-in
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NPCCard } from './NPCCard';
import type { NPCCardData } from '@dagger-app/shared-types';

const MOCK_ENRICHED_NPC: NPCCardData = {
  id: 'npc-1',
  name: 'Elder Thornweave',
  role: 'leader',
  description: 'The last of the Wickling root-speakers.',
  sceneAppearances: ['Scene 2', 'Scene 4'],
  isEnriched: true,
};

const MOCK_BASIC_NPC: NPCCardData = {
  id: 'npc-2',
  name: 'Moss',
  role: 'scout',
  description: 'A young Wickling forager.',
  sceneAppearances: ['Scene 2'],
  isEnriched: false,
};

describe('NPCCard', () => {
  it('renders the NPC name', () => {
    render(<NPCCard npc={MOCK_ENRICHED_NPC} onClick={vi.fn()} />);

    expect(screen.getByText('Elder Thornweave')).toBeInTheDocument();
  });

  it('renders the role label', () => {
    render(<NPCCard npc={MOCK_ENRICHED_NPC} onClick={vi.fn()} />);

    expect(screen.getByText('Leader')).toBeInTheDocument();
  });

  it('renders scene badges', () => {
    render(<NPCCard npc={MOCK_ENRICHED_NPC} onClick={vi.fn()} />);

    expect(screen.getByText('Scene 2')).toBeInTheDocument();
    expect(screen.getByText('Scene 4')).toBeInTheDocument();
  });

  it('shows enriched check mark for enriched NPCs', () => {
    const { container } = render(
      <NPCCard npc={MOCK_ENRICHED_NPC} onClick={vi.fn()} />
    );

    const enrichedIndicator = container.querySelector('[data-enriched="true"]');
    expect(enrichedIndicator).toBeInTheDocument();
  });

  it('shows dash for basic NPCs', () => {
    const { container } = render(
      <NPCCard npc={MOCK_BASIC_NPC} onClick={vi.fn()} />
    );

    const basicIndicator = container.querySelector('[data-enriched="false"]');
    expect(basicIndicator).toBeInTheDocument();
  });

  it('calls onClick with NPC id when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<NPCCard npc={MOCK_ENRICHED_NPC} onClick={handleClick} />);

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledWith('npc-1');
  });

  it('renders avatar initials from name', () => {
    render(<NPCCard npc={MOCK_ENRICHED_NPC} onClick={vi.fn()} />);

    expect(screen.getByText('ET')).toBeInTheDocument();
  });

  it('applies gold border for enriched NPCs', () => {
    const { container } = render(
      <NPCCard npc={MOCK_ENRICHED_NPC} onClick={vi.fn()} />
    );

    const card = container.querySelector('.npc-card--enriched');
    expect(card).toBeInTheDocument();
  });
});
