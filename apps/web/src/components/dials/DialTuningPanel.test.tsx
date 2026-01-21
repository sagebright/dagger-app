/**
 * DialTuningPanel Component Tests
 *
 * Tests for the main dial tuning container component that composes
 * DialGroup and DialCard components for full-page dial selection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialTuningPanel } from './DialTuningPanel';
import type { DialsState } from '../../stores/dialsStore';
import type {
  PartySize,
  PartyTier,
  SceneCount,
  SessionLength,
  ToneOption,
  NPCDensityOption,
  LethalityOption,
  EmotionalRegisterOption,
  PillarBalance,
  ThemeOption,
  DialId,
} from '@dagger-app/shared-types';

// =============================================================================
// Mock Data
// =============================================================================

/**
 * Creates a mock DialsState for testing
 */
function createMockDials(overrides: Partial<DialsState> = {}): DialsState {
  return {
    partySize: 4 as PartySize,
    partyTier: 1 as PartyTier,
    sceneCount: 4 as SceneCount,
    sessionLength: '3-4 hours' as SessionLength,
    tone: null as ToneOption | null,
    pillarBalance: null as PillarBalance | null,
    npcDensity: null as NPCDensityOption | null,
    lethality: null as LethalityOption | null,
    emotionalRegister: null as EmotionalRegisterOption | null,
    themes: [] as ThemeOption[],
    confirmedDials: new Set<DialId>(),
    setDial: vi.fn(() => true),
    confirmDial: vi.fn(),
    unconfirmDial: vi.fn(),
    resetDials: vi.fn(),
    resetDial: vi.fn(),
    addTheme: vi.fn(() => true),
    removeTheme: vi.fn(),
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('DialTuningPanel', () => {
  const mockOnContinue = vi.fn();
  let portalRoot: HTMLDivElement;

  beforeEach(() => {
    // Create portal root for ConfirmDefaultsDialog
    portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up portal root
    if (portalRoot && portalRoot.parentNode) {
      portalRoot.parentNode.removeChild(portalRoot);
    }
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders welcome banner at top', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      expect(screen.getByTestId('welcome-banner')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Dagger-Gen!')).toBeInTheDocument();
      expect(
        screen.getByText(/Configure your adventure parameters/i)
      ).toBeInTheDocument();
    });

    it('renders all 4 dial groups', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      // Check for group headers (using dial-group-header testid)
      const groupHeaders = screen.getAllByTestId('dial-group-header');
      expect(groupHeaders.length).toBe(4);

      // Verify header contents
      expect(screen.getByText('Party')).toBeInTheDocument();
      expect(screen.getByText('Session')).toBeInTheDocument();
      expect(screen.getByText('Atmosphere')).toBeInTheDocument();
      // 'Themes' appears as both group header and dial card label, use getAllByText
      const themesElements = screen.getAllByText('Themes');
      expect(themesElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders Party group with Party Size and Party Tier', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      // Find dials by their labels
      expect(screen.getByText('Party Size')).toBeInTheDocument();
      expect(screen.getByText('Party Tier')).toBeInTheDocument();
    });

    it('renders Session group with Session Length and Scene Count', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      expect(screen.getByText('Session Length')).toBeInTheDocument();
      expect(screen.getByText('Scene Count')).toBeInTheDocument();
    });

    it('renders Atmosphere group with Tone, Pillar Balance, Lethality, NPC Density, Emotional Register', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      expect(screen.getByText('Tone')).toBeInTheDocument();
      expect(screen.getByText('Pillar Balance')).toBeInTheDocument();
      expect(screen.getByText('Lethality')).toBeInTheDocument();
      expect(screen.getByText('NPC Density')).toBeInTheDocument();
      expect(screen.getByText('Emotional Register')).toBeInTheDocument();
    });

    it('renders Themes group with theme multi-select', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      // Should show Themes header and the theme selection area
      expect(screen.getAllByText('Themes').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Required Indicator Tests
  // ---------------------------------------------------------------------------

  describe('required indicators', () => {
    it('marks Party Size as required', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      // Find the Party Size dial card and verify required indicator
      const requiredIndicators = screen.getAllByTestId('required-indicator');
      expect(requiredIndicators.length).toBe(4); // partySize, partyTier, sceneCount, sessionLength
    });

    it('does not mark optional dials as required', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      // Should only have 4 required indicators for concrete dials
      const requiredIndicators = screen.getAllByTestId('required-indicator');
      expect(requiredIndicators.length).toBe(4);
    });
  });

  // ---------------------------------------------------------------------------
  // Continue Button Tests
  // ---------------------------------------------------------------------------

  describe('continue button', () => {
    it('renders Continue button', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      expect(
        screen.getByRole('button', { name: /continue to frames/i })
      ).toBeInTheDocument();
    });

    it('disables Continue button when canContinue is false', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      const continueButton = screen.getByRole('button', { name: /continue to frames/i });
      expect(continueButton).toBeDisabled();
    });

    it('enables Continue button when canContinue is true', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={true} />
      );

      const continueButton = screen.getByRole('button', { name: /continue to frames/i });
      expect(continueButton).not.toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // ConfirmDefaultsDialog Tests
  // ---------------------------------------------------------------------------

  describe('confirm defaults dialog', () => {
    it('shows ConfirmDefaultsDialog when clicking Continue with unset optional dials', async () => {
      const user = userEvent.setup();
      const dials = createMockDials({
        confirmedDials: new Set<DialId>([
          'partySize',
          'partyTier',
          'sceneCount',
          'sessionLength',
        ]),
        // Optional dials are not confirmed
      });

      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={true} />
      );

      const continueButton = screen.getByRole('button', { name: /continue to frames/i });
      await user.click(continueButton);

      // Dialog should appear
      expect(
        screen.getByText('Some settings will use defaults')
      ).toBeInTheDocument();
    });

    it('calls onContinue directly when all dials are confirmed', async () => {
      const user = userEvent.setup();
      const dials = createMockDials({
        confirmedDials: new Set<DialId>([
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
      });

      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={true} />
      );

      const continueButton = screen.getByRole('button', { name: /continue to frames/i });
      await user.click(continueButton);

      // Should call onContinue directly without showing dialog
      expect(mockOnContinue).toHaveBeenCalled();
      expect(
        screen.queryByText('Some settings will use defaults')
      ).not.toBeInTheDocument();
    });

    it('calls onContinue when user confirms defaults in dialog', async () => {
      const user = userEvent.setup();
      const dials = createMockDials({
        confirmedDials: new Set<DialId>([
          'partySize',
          'partyTier',
          'sceneCount',
          'sessionLength',
        ]),
      });

      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={true} />
      );

      // Click Continue to show dialog
      const continueButton = screen.getByRole('button', { name: /continue to frames/i });
      await user.click(continueButton);

      // Click "Continue Anyway" in dialog
      const confirmButton = screen.getByRole('button', { name: /continue anyway/i });
      await user.click(confirmButton);

      expect(mockOnContinue).toHaveBeenCalled();
    });

    it('closes dialog when user clicks Go Back', async () => {
      const user = userEvent.setup();
      const dials = createMockDials({
        confirmedDials: new Set<DialId>([
          'partySize',
          'partyTier',
          'sceneCount',
          'sessionLength',
        ]),
      });

      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={true} />
      );

      // Click Continue to show dialog
      const continueButton = screen.getByRole('button', { name: /continue to frames/i });
      await user.click(continueButton);

      // Dialog should be visible
      expect(
        screen.getByText('Some settings will use defaults')
      ).toBeInTheDocument();

      // Click "Go Back"
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      await user.click(goBackButton);

      // Dialog should close
      expect(
        screen.queryByText('Some settings will use defaults')
      ).not.toBeInTheDocument();
      expect(mockOnContinue).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Responsive Layout Tests
  // ---------------------------------------------------------------------------

  describe('responsive layout', () => {
    it('applies responsive grid classes to dial groups', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      // Find all dial group grids
      const grids = screen.getAllByTestId('dial-group-grid');

      // Each should have responsive classes
      grids.forEach((grid) => {
        expect(grid).toHaveClass('grid-cols-1');
        expect(grid).toHaveClass('md:grid-cols-2');
        expect(grid).toHaveClass('lg:grid-cols-3');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      // Main heading
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Welcome to Dagger-Gen!');

      // Group headings
      const groupHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(groupHeadings.length).toBe(4);
    });

    it('uses semantic section elements for groups', () => {
      const dials = createMockDials();
      render(
        <DialTuningPanel dials={dials} onContinue={mockOnContinue} canContinue={false} />
      );

      // DialGroup components use role="group"
      const groups = screen.getAllByRole('group');
      expect(groups.length).toBeGreaterThanOrEqual(4);
    });
  });
});
