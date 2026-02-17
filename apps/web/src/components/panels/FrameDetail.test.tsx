/**
 * Tests for FrameDetail component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FrameDetail } from './FrameDetail';
import type { FrameCardData } from '@dagger-app/shared-types';

const MOCK_FRAME: FrameCardData = {
  id: 'frame-1',
  name: 'The Witherwild',
  pitch: 'A stolen relic triggers endless spring.',
  themes: ['nature', 'conflict'],
  sections: [
    {
      key: 'overview',
      label: 'Overview',
      content: 'The nation of Haven invaded the forest realm.',
      expandedByDefault: true,
    },
    {
      key: 'themes',
      label: 'Themes',
      content: 'Cultural Clash, Grief',
      pills: ['Cultural Clash', 'Grief', 'Survival'],
    },
    {
      key: 'lore',
      label: 'Lore',
      content: 'The Reaping Eye was stolen from Nikta.',
    },
  ],
};

describe('FrameDetail', () => {
  it('renders the frame name and pitch', () => {
    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={vi.fn()}
        onSelectFrame={vi.fn()}
      />
    );

    expect(screen.getByText('The Witherwild')).toBeInTheDocument();
    expect(
      screen.getByText('A stolen relic triggers endless spring.')
    ).toBeInTheDocument();
  });

  it('renders the "Back to Frames" button', () => {
    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={vi.fn()}
        onSelectFrame={vi.fn()}
      />
    );

    expect(screen.getByText('Back to Frames')).toBeInTheDocument();
  });

  it('calls onBack when "Back to Frames" is clicked', async () => {
    const handleBack = vi.fn();
    const user = userEvent.setup();

    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={handleBack}
        onSelectFrame={vi.fn()}
      />
    );

    await user.click(screen.getByText('Back to Frames'));
    expect(handleBack).toHaveBeenCalledOnce();
  });

  it('renders the "Select Frame" button', () => {
    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={vi.fn()}
        onSelectFrame={vi.fn()}
      />
    );

    expect(screen.getByText('Select Frame')).toBeInTheDocument();
  });

  it('calls onSelectFrame when "Select Frame" is clicked', async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={vi.fn()}
        onSelectFrame={handleSelect}
      />
    );

    await user.click(screen.getByText('Select Frame'));
    expect(handleSelect).toHaveBeenCalledWith('frame-1');
  });

  it('renders expanded sections by default', () => {
    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={vi.fn()}
        onSelectFrame={vi.fn()}
      />
    );

    // Overview section is expanded by default
    expect(
      screen.getByText('The nation of Haven invaded the forest realm.')
    ).toBeInTheDocument();
  });

  it('renders collapsed sections that expand on click', async () => {
    const user = userEvent.setup();

    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={vi.fn()}
        onSelectFrame={vi.fn()}
      />
    );

    // Lore section is collapsed by default
    expect(
      screen.queryByText('The Reaping Eye was stolen from Nikta.')
    ).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText('Lore'));

    expect(
      screen.getByText('The Reaping Eye was stolen from Nikta.')
    ).toBeInTheDocument();
  });

  it('renders pills for theme sections', async () => {
    const user = userEvent.setup();

    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={vi.fn()}
        onSelectFrame={vi.fn()}
      />
    );

    // Click Themes to expand
    await user.click(screen.getByText('Themes'));

    expect(screen.getByText('Cultural Clash')).toBeInTheDocument();
    expect(screen.getByText('Grief')).toBeInTheDocument();
    expect(screen.getByText('Survival')).toBeInTheDocument();
  });

  it('renders all section labels', () => {
    render(
      <FrameDetail
        frame={MOCK_FRAME}
        onBack={vi.fn()}
        onSelectFrame={vi.fn()}
      />
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
    expect(screen.getByText('Lore')).toBeInTheDocument();
  });
});
