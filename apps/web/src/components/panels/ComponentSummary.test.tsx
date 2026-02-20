/**
 * Tests for ComponentSummary panel
 *
 * Verifies the summary view for the 8 Attuning components:
 * - Group labels (Session / Party / Essence)
 * - Confirmed vs unconfirmed row styling
 * - Click handler on component rows
 * - "Continue to Binding" button state
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ComponentSummary } from './ComponentSummary';
import type { SerializableComponentsState } from '@sage-codex/shared-types';

const EMPTY_COMPONENTS: SerializableComponentsState = {
  span: null,
  scenes: null,
  members: null,
  tier: null,
  tenor: null,
  pillars: null,
  chorus: null,
  threads: [],
  confirmedComponents: [],
};

const PARTIAL_COMPONENTS: SerializableComponentsState = {
  span: '3-4 hours',
  scenes: 4,
  members: null,
  tier: null,
  tenor: 'balanced',
  pillars: 'discovery-led',
  chorus: 'moderate',
  threads: [],
  confirmedComponents: ['span', 'tenor', 'pillars', 'chorus'],
};

const ALL_CONFIRMED: SerializableComponentsState = {
  span: '3-4 hours',
  scenes: 4,
  members: 4,
  tier: 2,
  tenor: 'balanced',
  pillars: 'discovery-led',
  chorus: 'moderate',
  threads: ['found-family', 'trust-betrayal'],
  confirmedComponents: [
    'span', 'scenes', 'members', 'tier',
    'tenor', 'pillars', 'chorus', 'threads',
  ],
};

describe('ComponentSummary', () => {
  it('renders all three group labels', () => {
    render(
      <ComponentSummary
        components={EMPTY_COMPONENTS}
        onSelectComponent={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    expect(screen.getByText('Session')).toBeInTheDocument();
    expect(screen.getByText('Party')).toBeInTheDocument();
    expect(screen.getByText('Essence')).toBeInTheDocument();
  });

  it('renders all 8 component labels', () => {
    render(
      <ComponentSummary
        components={EMPTY_COMPONENTS}
        onSelectComponent={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    expect(screen.getByText('Span')).toBeInTheDocument();
    expect(screen.getByText('Scenes')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('Tenor')).toBeInTheDocument();
    expect(screen.getByText('Pillars')).toBeInTheDocument();
    expect(screen.getByText('Chorus')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
  });

  it('renders Attuning panel header', () => {
    render(
      <ComponentSummary
        components={EMPTY_COMPONENTS}
        onSelectComponent={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    expect(screen.getByText('Attuning')).toBeInTheDocument();
  });

  it('shows confirmed count in subtitle', () => {
    render(
      <ComponentSummary
        components={PARTIAL_COMPONENTS}
        onSelectComponent={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    expect(screen.getByText('of 8 gathered')).toBeInTheDocument();
    // The confirmed count "4" is rendered in a separate span
    const subtitle = screen.getByText('of 8 gathered').closest('div');
    expect(subtitle?.textContent).toContain('4');
  });

  it('displays component values when set', () => {
    render(
      <ComponentSummary
        components={PARTIAL_COMPONENTS}
        onSelectComponent={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    expect(screen.getByText('3\u20134 Hours')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Discovery-Led')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  it('calls onSelectComponent when a row is clicked', async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentSummary
        components={EMPTY_COMPONENTS}
        onSelectComponent={handleSelect}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    await user.click(screen.getByText('Tenor'));
    expect(handleSelect).toHaveBeenCalledWith('tenor');
  });

  it('disables Continue button when not all confirmed', () => {
    render(
      <ComponentSummary
        components={PARTIAL_COMPONENTS}
        onSelectComponent={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    const button = screen.getByText('Continue to Binding');
    expect(button).toBeDisabled();
  });

  it('enables Continue button when all confirmed and ready', () => {
    render(
      <ComponentSummary
        components={ALL_CONFIRMED}
        onSelectComponent={vi.fn()}
        onAdvance={vi.fn()}
        isReady={true}
      />
    );

    const button = screen.getByText('Continue to Binding');
    expect(button).not.toBeDisabled();
  });

  it('calls onAdvance when Continue button is clicked', async () => {
    const handleAdvance = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentSummary
        components={ALL_CONFIRMED}
        onSelectComponent={vi.fn()}
        onAdvance={handleAdvance}
        isReady={true}
      />
    );

    await user.click(screen.getByText('Continue to Binding'));
    expect(handleAdvance).toHaveBeenCalledOnce();
  });

  it('shows dash for unset components', () => {
    render(
      <ComponentSummary
        components={EMPTY_COMPONENTS}
        onSelectComponent={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    const dashes = screen.getAllByText('\u2014');
    expect(dashes.length).toBe(8);
  });
});
