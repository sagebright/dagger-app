/**
 * Tests for ReviewPanels — Read-only panel wrappers for stage review
 *
 * Validates:
 * - ReviewComponentSummary renders in read-only mode (no StageFooter)
 * - ReviewFrameDetail renders in read-only mode (no back/select buttons)
 * - ReviewWeavingPanel renders confirmed scene data
 * - ReviewInscribingPanel renders in read-only mode (no StageFooter, static label)
 * - Mapping helpers: boundFrameToCardData, inscribingSectionsToSceneState
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  ReviewComponentSummary,
  ReviewFrameDetail,
  ReviewWeavingPanel,
  ReviewInscribingPanel,
  boundFrameToCardData,
  inscribingSectionsToSceneState,
} from './ReviewPanels';
import type { BoundFrame, SerializableComponentsState, InscribingSectionData } from '@sage-codex/shared-types';

// =============================================================================
// Test Data
// =============================================================================

const MOCK_COMPONENTS: SerializableComponentsState = {
  span: '3-4 hours',
  scenes: 4,
  members: 4,
  tier: 2,
  tenor: 'balanced',
  pillars: 'interwoven',
  chorus: 'moderate',
  threads: ['redemption-sacrifice', 'identity-legacy'],
  confirmedComponents: ['span', 'scenes', 'members', 'tier', 'tenor', 'pillars', 'chorus', 'threads'],
};

const MOCK_BOUND_FRAME: BoundFrame = {
  id: 'frame-1',
  name: 'The Witherwild',
  description: 'A cursed forest realm.',
  themes: ['nature', 'conflict'],
  typicalAdversaries: ['undead', 'fey'],
  lore: 'Ancient lore of the forest.',
  isCustom: false,
  sections: [
    {
      key: 'overview',
      label: 'Overview',
      content: 'The Witherwild spreads across the northern reaches.',
      expandedByDefault: true,
    },
    {
      key: 'themes',
      label: 'Themes',
      content: 'Nature vs Civilization',
      pills: ['Nature', 'Conflict'],
    },
  ],
};

const MOCK_SCENE_ARCS = [
  { id: 'arc-1', sceneNumber: 1, title: 'The Arrival', description: 'Heroes arrive at the forest edge.', keyElements: [], location: '', sceneType: 'exploration' as const },
  { id: 'arc-2', sceneNumber: 2, title: 'The Confrontation', description: 'A dark foe awaits.', keyElements: [], location: '', sceneType: 'combat' as const },
];

const MOCK_INSCRIBING_SECTIONS: Record<string, InscribingSectionData[]> = {
  'arc-1': [
    { id: 'overview', label: 'Overview', content: 'Scene overview content', wave: 1, hasDetail: false },
    { id: 'setup', label: 'Setup', content: 'Scene setup content', wave: 1, hasDetail: true },
    { id: 'developments', label: 'Developments', content: 'Scene developments', wave: 1, hasDetail: true },
    { id: 'npcs_present', label: 'NPCs Present', content: '2 NPCs', wave: 2, hasDetail: false },
    { id: 'adversaries', label: 'Adversaries', content: '1 adversary', wave: 2, hasDetail: false },
    { id: 'items', label: 'Items', content: '3 items', wave: 2, hasDetail: false },
    { id: 'transitions', label: 'Transitions', content: 'Transition text', wave: 3, hasDetail: true },
    { id: 'portents', label: 'Portents', content: 'Portent content', wave: 3, hasDetail: false },
    { id: 'gm_notes', label: 'GM Notes', content: 'GM notes content', wave: 3, hasDetail: false },
  ],
};

// =============================================================================
// Tests: ReviewComponentSummary
// =============================================================================

describe('ReviewComponentSummary', () => {
  it('renders the ComponentSummary with component data', () => {
    render(<ReviewComponentSummary components={MOCK_COMPONENTS} />);

    expect(screen.getByText('Attuning')).toBeInTheDocument();
    expect(screen.getByText('Span')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
  });

  it('does not render StageFooter (no Continue button)', () => {
    render(<ReviewComponentSummary components={MOCK_COMPONENTS} />);

    expect(screen.queryByText('Continue to Binding')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Tests: ReviewFrameDetail
// =============================================================================

describe('ReviewFrameDetail', () => {
  it('renders frame name and pitch', () => {
    render(<ReviewFrameDetail frame={MOCK_BOUND_FRAME} />);

    expect(screen.getByText('The Witherwild')).toBeInTheDocument();
  });

  it('does not render "Back to Frames" button', () => {
    render(<ReviewFrameDetail frame={MOCK_BOUND_FRAME} />);

    expect(screen.queryByText('Back to Frames')).not.toBeInTheDocument();
  });

  it('does not render "Select Frame" button', () => {
    render(<ReviewFrameDetail frame={MOCK_BOUND_FRAME} />);

    expect(screen.queryByText('Select Frame')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Tests: ReviewWeavingPanel
// =============================================================================

describe('ReviewWeavingPanel', () => {
  it('renders scene tabs with all scenes marked confirmed', () => {
    render(<ReviewWeavingPanel sceneArcs={MOCK_SCENE_ARCS} />);

    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
  });

  it('renders scene arc content for the first scene', () => {
    render(<ReviewWeavingPanel sceneArcs={MOCK_SCENE_ARCS} />);

    expect(screen.getByText('The Arrival')).toBeInTheDocument();
  });
});

// =============================================================================
// Tests: ReviewInscribingPanel
// =============================================================================

describe('ReviewInscribingPanel', () => {
  it('renders section accordion with populated sections', () => {
    render(
      <ReviewInscribingPanel
        sceneArcs={MOCK_SCENE_ARCS}
        inscribingSections={MOCK_INSCRIBING_SECTIONS}
      />
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Setup')).toBeInTheDocument();
  });

  it('does not render StageFooter (no Confirm button)', () => {
    render(
      <ReviewInscribingPanel
        sceneArcs={MOCK_SCENE_ARCS}
        inscribingSections={MOCK_INSCRIBING_SECTIONS}
      />
    );

    expect(screen.queryByText('Confirm Scene')).not.toBeInTheDocument();
    expect(screen.queryByText('Continue to Delivering')).not.toBeInTheDocument();
  });

  it('renders a static stage label instead of StageDropdown', () => {
    render(
      <ReviewInscribingPanel
        sceneArcs={MOCK_SCENE_ARCS}
        inscribingSections={MOCK_INSCRIBING_SECTIONS}
      />
    );

    expect(screen.getByText('Inscribing')).toBeInTheDocument();
  });
});

// =============================================================================
// Tests: Mapping Helpers
// =============================================================================

describe('boundFrameToCardData', () => {
  it('converts BoundFrame to FrameCardData', () => {
    const cardData = boundFrameToCardData(MOCK_BOUND_FRAME);

    expect(cardData.id).toBe('frame-1');
    expect(cardData.name).toBe('The Witherwild');
    expect(cardData.pitch).toBe('A cursed forest realm.');
    expect(cardData.themes).toEqual(['nature', 'conflict']);
    expect(cardData.sections).toHaveLength(2);
    expect(cardData.sections[0].key).toBe('overview');
  });
});

describe('inscribingSectionsToSceneState', () => {
  it('converts inscribing sections to SceneInscriptionState', () => {
    const sections = MOCK_INSCRIBING_SECTIONS['arc-1'];
    const sceneState = inscribingSectionsToSceneState(sections);

    expect(sceneState.sections).toHaveLength(9);
    expect(sceneState.confirmed).toBe(true);
    expect(sceneState.wave3Invalidated).toBe(false);
    expect(sceneState.invalidationReason).toBeNull();
    expect(sceneState.balanceWarning).toBeNull();
  });

  it('returns all sections populated from the input', () => {
    const sections = MOCK_INSCRIBING_SECTIONS['arc-1'];
    const sceneState = inscribingSectionsToSceneState(sections);

    const overviewSection = sceneState.sections.find(s => s.id === 'overview');
    expect(overviewSection?.content).toBe('Scene overview content');
  });
});
