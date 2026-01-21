/**
 * DialTuningPanel Component
 *
 * Main container for the dial tuning phase, displaying all adventure
 * configuration dials in an organized, full-page layout. Replaces the
 * chat+summary layout with a scannable dial selection UI.
 *
 * Features:
 * - Welcome banner with guidance text
 * - 4 dial groups: Party, Session, Atmosphere, Themes
 * - Required indicator on concrete dials
 * - Continue button with confirmation dialog for unset optional dials
 * - Responsive layout (3/2/1 columns)
 */

import { useState, useCallback, useMemo } from 'react';
import type { DialId, ThemeOption, PillarBalance } from '@dagger-app/shared-types';
import { THEME_OPTIONS, DIAL_CONSTRAINTS } from '@dagger-app/shared-types';
import type { DialsState } from '../../stores/dialsStore';
import { DialGroup } from './DialGroup';
import { DialCard } from './DialCard';
import { ConfirmDefaultsDialog, type UnsetDial } from './ConfirmDefaultsDialog';
import { PartySizeSelect } from './PartySizeSelect';
import { TierSelect } from './TierSelect';
import { SessionLengthSelect } from './SessionLengthSelect';
import { SceneCountSelect } from './SceneCountSelect';
import { ToneSelect } from './ToneSelect';
import { PillarBalanceSelect } from './PillarBalanceSelect';
import { LethalitySelect } from './LethalitySelect';
import { NPCDensitySelect } from './NPCDensitySelect';
import { EmotionalRegisterSelect } from './EmotionalRegisterSelect';
import { MultiSelectChips } from './MultiSelectChips';

// =============================================================================
// Types
// =============================================================================

export interface DialTuningPanelProps {
  /** Current dial state from store */
  dials: DialsState;
  /** Callback when user wants to continue to next phase */
  onContinue: () => void;
  /** Whether the Continue button should be enabled */
  canContinue: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const OPTIONAL_DIAL_IDS: DialId[] = [
  'tone',
  'pillarBalance',
  'npcDensity',
  'lethality',
  'emotionalRegister',
  'themes',
];

const DIAL_LABELS: Record<DialId, string> = {
  partySize: 'Party Size',
  partyTier: 'Party Tier',
  sceneCount: 'Scene Count',
  sessionLength: 'Session Length',
  tone: 'Tone',
  pillarBalance: 'Pillar Balance',
  npcDensity: 'NPC Density',
  lethality: 'Lethality',
  emotionalRegister: 'Emotional Register',
  themes: 'Themes',
};

const DEFAULT_VALUES: Record<DialId, string> = {
  partySize: '4 players',
  partyTier: 'Tier 1',
  sceneCount: '4 scenes',
  sessionLength: '3-4 hours',
  tone: 'Balanced',
  pillarBalance: 'Combat > Exploration > Social',
  npcDensity: 'Moderate',
  lethality: 'Standard',
  emotionalRegister: 'Epic',
  themes: 'None selected',
};

/** Theme options formatted for MultiSelectChips */
const THEME_CHIP_OPTIONS = THEME_OPTIONS.map((t) => ({
  id: t.id,
  label: t.label,
}));

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format pillar balance for display
 */
function formatPillarBalance(balance: PillarBalance | null): string {
  if (!balance) return 'Not set';
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${capitalize(balance.primary)} > ${capitalize(balance.secondary)} > ${capitalize(balance.tertiary)}`;
}

/**
 * Format themes for display
 */
function formatThemes(themes: ThemeOption[]): string {
  if (themes.length === 0) return 'None selected';
  const labels = themes.map(
    (t) => THEME_OPTIONS.find((opt) => opt.id === t)?.label || t
  );
  return labels.join(', ');
}

// =============================================================================
// Component
// =============================================================================

export function DialTuningPanel({
  dials,
  onContinue,
  canContinue,
}: DialTuningPanelProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Compute unset optional dials
  const unsetOptionalDials = useMemo<UnsetDial[]>(() => {
    return OPTIONAL_DIAL_IDS.filter(
      (id) => !dials.confirmedDials.has(id)
    ).map((id) => ({
      label: DIAL_LABELS[id],
      defaultValue: DEFAULT_VALUES[id],
    }));
  }, [dials.confirmedDials]);

  // Handle Continue button click
  const handleContinueClick = useCallback(() => {
    if (unsetOptionalDials.length > 0) {
      setShowConfirmDialog(true);
    } else {
      onContinue();
    }
  }, [unsetOptionalDials, onContinue]);

  // Handle dialog confirmation
  const handleDialogConfirm = useCallback(() => {
    setShowConfirmDialog(false);
    onContinue();
  }, [onContinue]);

  // Handle dialog cancel
  const handleDialogCancel = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return (
    <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div
        data-testid="welcome-banner"
        className="bg-gradient-to-r from-gold-100 via-parchment-50 to-gold-100 dark:from-gold-900/30 dark:via-shadow-800 dark:to-gold-900/30 border border-gold-300 dark:border-gold-700 rounded-fantasy p-6 shadow-fantasy"
      >
        <h2 className="font-serif text-2xl font-bold text-ink-800 dark:text-parchment-100 mb-2">
          Welcome to Dagger-Gen!
        </h2>
        <p className="text-ink-600 dark:text-parchment-300">
          Configure your adventure parameters to craft the perfect Daggerheart
          experience. Start with your party details, then fine-tune the
          atmosphere to match your table's style.
        </p>
      </div>

      {/* Party Group */}
      <DialGroup title="Party">
        <DialCard
          label="Party Size"
          description="Number of players at the table"
          value={`${dials.partySize} players`}
          isRequired
          isSet={dials.confirmedDials.has('partySize')}
        >
          <PartySizeSelect
            value={dials.partySize}
            onChange={(size) => {
              dials.setDial('partySize', size);
              dials.confirmDial('partySize');
            }}
          />
        </DialCard>

        <DialCard
          label="Party Tier"
          description="Character power level (1-4)"
          value={`Tier ${dials.partyTier}`}
          isRequired
          isSet={dials.confirmedDials.has('partyTier')}
        >
          <TierSelect
            value={dials.partyTier}
            onChange={(tier) => {
              dials.setDial('partyTier', tier);
              dials.confirmDial('partyTier');
            }}
          />
        </DialCard>
      </DialGroup>

      {/* Session Group */}
      <DialGroup title="Session">
        <DialCard
          label="Session Length"
          description="Target session duration"
          value={dials.sessionLength}
          isRequired
          isSet={dials.confirmedDials.has('sessionLength')}
        >
          <SessionLengthSelect
            value={dials.sessionLength}
            onChange={(length) => {
              dials.setDial('sessionLength', length);
              dials.confirmDial('sessionLength');
            }}
          />
        </DialCard>

        <DialCard
          label="Scene Count"
          description="Number of scenes (3-6)"
          value={`${dials.sceneCount} scenes`}
          isRequired
          isSet={dials.confirmedDials.has('sceneCount')}
        >
          <SceneCountSelect
            value={dials.sceneCount}
            onChange={(count) => {
              dials.setDial('sceneCount', count);
              dials.confirmDial('sceneCount');
            }}
          />
        </DialCard>
      </DialGroup>

      {/* Atmosphere Group */}
      <DialGroup title="Atmosphere">
        <DialCard
          label="Tone"
          description="Adventure tone from grim to whimsical"
          value={dials.tone ? dials.tone.charAt(0).toUpperCase() + dials.tone.slice(1) : 'Not set'}
          isSet={dials.confirmedDials.has('tone')}
        >
          <ToneSelect
            value={dials.tone || 'balanced'}
            onChange={(tone) => {
              dials.setDial('tone', tone);
              dials.confirmDial('tone');
            }}
          />
        </DialCard>

        <DialCard
          label="Pillar Balance"
          description="Priority of Combat, Exploration, Social"
          value={formatPillarBalance(dials.pillarBalance)}
          isSet={dials.confirmedDials.has('pillarBalance')}
        >
          <PillarBalanceSelect
            value={
              dials.pillarBalance || {
                primary: 'combat',
                secondary: 'exploration',
                tertiary: 'social',
              }
            }
            onChange={(balance) => {
              dials.setDial('pillarBalance', balance);
              dials.confirmDial('pillarBalance');
            }}
          />
        </DialCard>

        <DialCard
          label="Lethality"
          description="How dangerous is the adventure?"
          value={dials.lethality ? dials.lethality.charAt(0).toUpperCase() + dials.lethality.slice(1) : 'Not set'}
          isSet={dials.confirmedDials.has('lethality')}
        >
          <LethalitySelect
            value={dials.lethality || 'standard'}
            onChange={(lethality) => {
              dials.setDial('lethality', lethality);
              dials.confirmDial('lethality');
            }}
          />
        </DialCard>

        <DialCard
          label="NPC Density"
          description="Number of named NPCs"
          value={dials.npcDensity ? dials.npcDensity.charAt(0).toUpperCase() + dials.npcDensity.slice(1) : 'Not set'}
          isSet={dials.confirmedDials.has('npcDensity')}
        >
          <NPCDensitySelect
            value={dials.npcDensity || 'moderate'}
            onChange={(density) => {
              dials.setDial('npcDensity', density);
              dials.confirmDial('npcDensity');
            }}
          />
        </DialCard>

        <DialCard
          label="Emotional Register"
          description="Primary emotional journey"
          value={dials.emotionalRegister ? dials.emotionalRegister.charAt(0).toUpperCase() + dials.emotionalRegister.slice(1) : 'Not set'}
          isSet={dials.confirmedDials.has('emotionalRegister')}
        >
          <EmotionalRegisterSelect
            value={dials.emotionalRegister || 'epic'}
            onChange={(register) => {
              dials.setDial('emotionalRegister', register);
              dials.confirmDial('emotionalRegister');
            }}
          />
        </DialCard>
      </DialGroup>

      {/* Themes Group */}
      <DialGroup title="Themes">
        <DialCard
          label="Themes"
          description="Story themes (select up to 3)"
          value={formatThemes(dials.themes)}
          isSet={dials.confirmedDials.has('themes')}
          className="lg:col-span-2"
        >
          <MultiSelectChips
            options={THEME_CHIP_OPTIONS}
            selected={dials.themes}
            maxSelections={DIAL_CONSTRAINTS.themes.maxSelections}
            onChange={(selected) => {
              dials.setDial('themes', selected as ThemeOption[]);
              if (selected.length > 0) {
                dials.confirmDial('themes');
              } else {
                dials.unconfirmDial('themes');
              }
            }}
          />
        </DialCard>
      </DialGroup>

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={handleContinueClick}
          disabled={!canContinue}
          className={`
            py-4 px-12 rounded-fantasy border-2
            font-serif font-semibold text-lg
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2
            dark:focus:ring-offset-shadow-800
            ${
              canContinue
                ? 'bg-gold-500 border-gold-600 text-ink-900 hover:bg-gold-400 hover:border-gold-500 dark:bg-gold-600 dark:border-gold-500 dark:hover:bg-gold-500 dark:hover:border-gold-400 shadow-gold-glow cursor-pointer'
                : 'bg-ink-200 border-ink-300 text-ink-500 cursor-not-allowed dark:bg-shadow-700 dark:border-shadow-600 dark:text-shadow-400'
            }
          `}
        >
          Continue to Frames
        </button>
      </div>

      {/* Confirm Defaults Dialog */}
      {showConfirmDialog && (
        <ConfirmDefaultsDialog
          unsetDials={unsetOptionalDials}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
        />
      )}
    </div>
  );
}
