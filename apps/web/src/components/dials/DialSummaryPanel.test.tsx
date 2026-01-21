/**
 * DialSummaryPanel Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DialSummaryPanel } from './DialSummaryPanel';
import type { DialsState } from '../../stores/dialsStore';

describe('DialSummaryPanel', () => {
  const mockDials: DialsState = {
    partySize: 4,
    partyTier: 2,
    sceneCount: 4,
    sessionLength: '3-4 hours',
    tone: 'grim',
    pillarBalance: { primary: 'combat', secondary: 'exploration', tertiary: 'social' },
    npcDensity: null,
    lethality: null,
    emotionalRegister: null,
    themes: ['redemption', 'sacrifice'],
    confirmedDials: new Set(['partySize', 'partyTier', 'tone']),
    setDial: vi.fn(),
    confirmDial: vi.fn(),
    unconfirmDial: vi.fn(),
    resetDials: vi.fn(),
    resetDial: vi.fn(),
    addTheme: vi.fn(),
    removeTheme: vi.fn(),
  };

  const defaultProps = {
    dials: mockDials,
    onEditDial: vi.fn(),
    onConfirmDial: vi.fn(),
    onContinue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel with title', () => {
    render(<DialSummaryPanel {...defaultProps} />);
    expect(screen.getByText('Adventure Dials')).toBeInTheDocument();
  });

  it('renders progress bar showing dial configuration progress', () => {
    render(<DialSummaryPanel {...defaultProps} />);
    // 3 confirmed out of 10 total dials
    expect(screen.getByText('3 of 10 configured')).toBeInTheDocument();
  });

  it('renders Concrete section header', () => {
    render(<DialSummaryPanel {...defaultProps} />);
    expect(screen.getByText('Concrete')).toBeInTheDocument();
  });

  it('renders Conceptual section header', () => {
    render(<DialSummaryPanel {...defaultProps} />);
    expect(screen.getByText('Conceptual')).toBeInTheDocument();
  });

  it('renders all concrete dials', () => {
    render(<DialSummaryPanel {...defaultProps} />);
    expect(screen.getByText('Party Size')).toBeInTheDocument();
    expect(screen.getByText('Party Tier')).toBeInTheDocument();
    expect(screen.getByText('Scene Count')).toBeInTheDocument();
    expect(screen.getByText('Session Length')).toBeInTheDocument();
  });

  it('renders all conceptual dials', () => {
    render(<DialSummaryPanel {...defaultProps} />);
    expect(screen.getByText('Tone')).toBeInTheDocument();
    expect(screen.getByText('Pillar Balance')).toBeInTheDocument();
    expect(screen.getByText('NPC Density')).toBeInTheDocument();
    expect(screen.getByText('Lethality')).toBeInTheDocument();
    expect(screen.getByText('Emotional Register')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
  });

  it('calls onEditDial when Edit button is clicked', () => {
    const onEditDial = vi.fn();
    render(<DialSummaryPanel {...defaultProps} onEditDial={onEditDial} />);

    // Click first Edit button (for Party Size)
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(onEditDial).toHaveBeenCalledWith('partySize');
  });

  it('calls onConfirmDial when Confirm button is clicked in edit mode', () => {
    const onConfirmDial = vi.fn();
    render(
      <DialSummaryPanel
        {...defaultProps}
        onConfirmDial={onConfirmDial}
        editingDialId="sceneCount"
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    expect(onConfirmDial).toHaveBeenCalledWith('sceneCount');
  });

  it('does not render Continue button when not all dials are confirmed', () => {
    render(<DialSummaryPanel {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /continue to frame/i })).not.toBeInTheDocument();
  });

  it('renders Continue button when all dials are confirmed', () => {
    const allConfirmedDials: DialsState = {
      ...mockDials,
      confirmedDials: new Set([
        'partySize',
        'partyTier',
        'sceneCount',
        'sessionLength',
        'tone',
        'pillarBalance',
        'npcDensity',
        'lethality',
        'emotionalRegister',
        'themes',
      ]),
    };
    render(<DialSummaryPanel {...defaultProps} dials={allConfirmedDials} />);
    expect(screen.getByRole('button', { name: /continue to frame/i })).toBeInTheDocument();
  });

  it('calls onContinue when Continue button is clicked', () => {
    const onContinue = vi.fn();
    const allConfirmedDials: DialsState = {
      ...mockDials,
      confirmedDials: new Set([
        'partySize',
        'partyTier',
        'sceneCount',
        'sessionLength',
        'tone',
        'pillarBalance',
        'npcDensity',
        'lethality',
        'emotionalRegister',
        'themes',
      ]),
    };
    render(<DialSummaryPanel {...defaultProps} dials={allConfirmedDials} onContinue={onContinue} />);

    fireEvent.click(screen.getByRole('button', { name: /continue to frame/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<DialSummaryPanel {...defaultProps} className="custom-class" />);
    const panel = screen.getByTestId('dial-summary-panel');
    expect(panel).toHaveClass('custom-class');
  });

  it('can collapse and expand Concrete section', () => {
    render(<DialSummaryPanel {...defaultProps} />);

    // Find the Concrete section toggle button
    const concreteToggle = screen.getByRole('button', { name: /concrete/i });

    // Initially all dials should be visible
    expect(screen.getByText('Party Size')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(concreteToggle);

    // The section content should be hidden (we check for aria-expanded)
    expect(concreteToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('can collapse and expand Conceptual section', () => {
    render(<DialSummaryPanel {...defaultProps} />);

    const conceptualToggle = screen.getByRole('button', { name: /conceptual/i });

    // Click to collapse
    fireEvent.click(conceptualToggle);

    expect(conceptualToggle).toHaveAttribute('aria-expanded', 'false');
  });
});
