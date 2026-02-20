/**
 * Tests for AdversaryCard component
 *
 * Verifies adversary cards render with:
 * - Name and optional quantity display
 * - Type badge with color coding (bruiser, minion, leader, solo)
 * - Difficulty level
 * - Stat line (HP, Stress, ATK, DMG)
 * - Scene badge
 * - Click handler for drill-in
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AdversaryCard } from './AdversaryCard';
import type { AdversaryCardData } from '@sage-codex/shared-types';

const MOCK_ADVERSARY: AdversaryCardData = {
  id: 'adv-1',
  name: 'Vine Horror',
  type: 'bruiser',
  difficulty: 3,
  quantity: 1,
  sceneAppearances: ['Scene 1'],
  stats: { hp: 12, stress: 3, attack: '+5', damage: 'd8' },
};

const MOCK_ADVERSARY_MULTI: AdversaryCardData = {
  id: 'adv-2',
  name: 'Witherwild Crawler',
  type: 'minion',
  difficulty: 1,
  quantity: 2,
  sceneAppearances: ['Scene 1'],
  stats: { hp: 4, stress: 1, attack: '+3', damage: 'd6' },
};

describe('AdversaryCard', () => {
  it('renders the adversary name', () => {
    render(<AdversaryCard adversary={MOCK_ADVERSARY} onClick={vi.fn()} />);

    expect(screen.getByText('Vine Horror')).toBeInTheDocument();
  });

  it('renders the type badge', () => {
    render(<AdversaryCard adversary={MOCK_ADVERSARY} onClick={vi.fn()} />);

    expect(screen.getByText('Bruiser')).toBeInTheDocument();
  });

  it('renders difficulty level', () => {
    render(<AdversaryCard adversary={MOCK_ADVERSARY} onClick={vi.fn()} />);

    expect(screen.getByText(/Difficulty 3/)).toBeInTheDocument();
  });

  it('renders stat line', () => {
    render(<AdversaryCard adversary={MOCK_ADVERSARY} onClick={vi.fn()} />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByText('d8')).toBeInTheDocument();
  });

  it('renders scene badge', () => {
    render(<AdversaryCard adversary={MOCK_ADVERSARY} onClick={vi.fn()} />);

    expect(screen.getByText('Scene 1')).toBeInTheDocument();
  });

  it('renders quantity when greater than 1', () => {
    render(
      <AdversaryCard adversary={MOCK_ADVERSARY_MULTI} onClick={vi.fn()} />
    );

    expect(screen.getByText(/×2/)).toBeInTheDocument();
  });

  it('does not render quantity when equal to 1', () => {
    render(<AdversaryCard adversary={MOCK_ADVERSARY} onClick={vi.fn()} />);

    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it('calls onClick with adversary id when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<AdversaryCard adversary={MOCK_ADVERSARY} onClick={handleClick} />);

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledWith('adv-1');
  });

  it('applies type-specific badge class', () => {
    const { container } = render(
      <AdversaryCard adversary={MOCK_ADVERSARY} onClick={vi.fn()} />
    );

    const badge = container.querySelector('.type-bruiser');
    expect(badge).toBeInTheDocument();
  });
});
