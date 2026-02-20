/**
 * Tests for FrameGallery component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FrameGallery } from './FrameGallery';
import type { FrameCardData } from '@sage-codex/shared-types';

const MOCK_FRAMES: FrameCardData[] = [
  {
    id: 'frame-1',
    name: 'The Witherwild',
    pitch: 'A stolen relic triggers endless spring.',
    themes: ['nature', 'conflict'],
    sections: [],
  },
  {
    id: 'frame-2',
    name: 'The Shattered Bastion',
    pitch: 'A disgraced knight carries a stolen fragment.',
    themes: ['honor', 'duty'],
    sections: [],
  },
  {
    id: 'frame-3',
    name: 'The Drowned Court',
    pitch: 'Fishing boats vanish near the coast.',
    themes: ['mystery', 'ocean'],
    sections: [],
  },
];

describe('FrameGallery', () => {
  it('renders all frame cards', () => {
    render(
      <FrameGallery
        frames={MOCK_FRAMES}
        exploringFrameId={null}
        activeFrameId={null}
        onExploreFrame={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    expect(screen.getByText('The Witherwild')).toBeInTheDocument();
    expect(screen.getByText('The Shattered Bastion')).toBeInTheDocument();
    expect(screen.getByText('The Drowned Court')).toBeInTheDocument();
  });

  it('renders empty state when no frames', () => {
    render(
      <FrameGallery
        frames={[]}
        exploringFrameId={null}
        activeFrameId={null}
        onExploreFrame={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    expect(
      screen.getByText(/searching the archives/i)
    ).toBeInTheDocument();
  });

  it('calls onExploreFrame when a frame card is clicked', async () => {
    const handleExplore = vi.fn();
    const user = userEvent.setup();

    render(
      <FrameGallery
        frames={MOCK_FRAMES}
        exploringFrameId={null}
        activeFrameId={null}
        onExploreFrame={handleExplore}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    const card = screen.getByLabelText('The Witherwild');
    await user.click(card);

    expect(handleExplore).toHaveBeenCalledWith('frame-1');
  });

  it('renders disabled Continue button when not ready', () => {
    render(
      <FrameGallery
        frames={MOCK_FRAMES}
        exploringFrameId={null}
        activeFrameId={null}
        onExploreFrame={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    const button = screen.getByText('Continue to Weaving');
    expect(button).toBeDisabled();
  });

  it('renders enabled Continue button when ready', () => {
    render(
      <FrameGallery
        frames={MOCK_FRAMES}
        exploringFrameId={null}
        activeFrameId="frame-1"
        onExploreFrame={vi.fn()}
        onAdvance={vi.fn()}
        isReady={true}
      />
    );

    const button = screen.getByText('Continue to Weaving');
    expect(button).not.toBeDisabled();
  });

  it('calls onAdvance when Continue button is clicked', async () => {
    const handleAdvance = vi.fn();
    const user = userEvent.setup();

    render(
      <FrameGallery
        frames={MOCK_FRAMES}
        exploringFrameId={null}
        activeFrameId="frame-1"
        onExploreFrame={vi.fn()}
        onAdvance={handleAdvance}
        isReady={true}
      />
    );

    const button = screen.getByText('Continue to Weaving');
    await user.click(button);

    expect(handleAdvance).toHaveBeenCalledOnce();
  });

  it('shows pitch text for each frame', () => {
    render(
      <FrameGallery
        frames={MOCK_FRAMES}
        exploringFrameId={null}
        activeFrameId={null}
        onExploreFrame={vi.fn()}
        onAdvance={vi.fn()}
        isReady={false}
      />
    );

    expect(
      screen.getByText('A stolen relic triggers endless spring.')
    ).toBeInTheDocument();
  });
});
