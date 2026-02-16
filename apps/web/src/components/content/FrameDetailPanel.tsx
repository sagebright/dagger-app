import type {
  DaggerheartFrame,
  DaggerheartCustomFrame,
  SelectedFrame,
} from '@dagger-app/shared-types';
import { isCustomFrame } from '@dagger-app/shared-types';
import { DetailSection } from './DetailSection';

export interface FrameDetailPanelProps {
  frame: DaggerheartFrame | DaggerheartCustomFrame | SelectedFrame;
  onBack: () => void;
  onSelectFrame: () => void;
  className?: string;
}

/** Type guard for custom frame from DB (has rich schema) */
function isRichFrame(
  frame: DaggerheartFrame | DaggerheartCustomFrame | SelectedFrame
): frame is DaggerheartCustomFrame {
  return 'concept' in frame && 'pitch' in frame;
}

/** Extract a display value from a frame, handling both schemas */
function getFrameField(
  frame: DaggerheartFrame | DaggerheartCustomFrame | SelectedFrame,
  field: string
): unknown {
  if (field in frame) {
    return (frame as Record<string, unknown>)[field];
  }
  return null;
}

function DetailPill({ label }: { label: string }) {
  return (
    <span
      className="
        text-[11px] font-medium
        text-ink-400 dark:text-parchment-600
        border border-ink-200 dark:border-shadow-600
        rounded-full px-2.5 py-0.5 whitespace-nowrap
        transition-colors duration-150 cursor-default
        hover:text-gold-500 hover:border-gold-400
        dark:hover:text-gold-400 dark:hover:border-gold-500
      "
    >
      {label}
    </span>
  );
}

function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <DetailPill key={i} label={item} />
      ))}
    </div>
  );
}

export function FrameDetailPanel({
  frame,
  onBack,
  onSelectFrame,
  className = '',
}: FrameDetailPanelProps) {
  const rich = isRichFrame(frame);
  const custom = isCustomFrame(frame as SelectedFrame);

  // Resolve display fields across both schemas
  const name = rich ? frame.title : frame.name;
  const pitch = rich ? frame.pitch : (frame.description ?? '');
  const overview = (getFrameField(frame, 'overview') as string | null)
    ?? (rich ? frame.concept : frame.description);
  const incitingIncident = getFrameField(frame, 'inciting_incident') as string | null
    ?? (custom ? (frame as Record<string, unknown>).incitingIncident as string | null : null);
  const toneFeel = (getFrameField(frame, 'tone_feel') as string[] | null) ?? null;
  const touchstones = (getFrameField(frame, 'touchstones') as string[] | null) ?? null;
  const themes = frame.themes ?? null;
  const distinctions = getFrameField(frame, 'distinctions') as string | null;
  const heritageClasses = getFrameField(frame, 'heritage_classes') as string | null;
  const playerPrinciples = (getFrameField(frame, 'player_principles') as string[] | null) ?? null;
  const gmPrinciples = (getFrameField(frame, 'gm_principles') as string[] | null) ?? null;
  const customMechanics = getFrameField(frame, 'custom_mechanics') as string | null;
  const sessionZeroQuestions = (getFrameField(frame, 'session_zero_questions') as string[] | null) ?? null;
  const complexityRating = (getFrameField(frame, 'complexity_rating') as number | null) ?? null;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={onBack}
          className="
            flex items-center gap-1.5 text-[13px]
            text-ink-400 dark:text-parchment-600
            hover:text-gold-500 dark:hover:text-gold-400
            transition-colors duration-150
          "
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Frames
        </button>
        <h3 className="mt-2 font-serif text-base font-semibold text-ink-900 dark:text-parchment-100">
          {name}
        </h3>
        <p className="mt-1 font-serif text-[13px] italic text-ink-500 dark:text-parchment-500 leading-snug">
          {pitch}
        </p>
      </div>

      {/* Scrollable detail sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {/* 1. Overview — expanded */}
        {overview && (
          <DetailSection title="Overview" defaultExpanded>
            <p>{overview}</p>
          </DetailSection>
        )}

        {/* 2. Inciting Incident — expanded */}
        {incitingIncident && (
          <DetailSection title="Inciting Incident" defaultExpanded>
            <p>{incitingIncident}</p>
          </DetailSection>
        )}

        {/* 3. Tone & Feel — collapsed */}
        {toneFeel && toneFeel.length > 0 && (
          <DetailSection title="Tone & Feel">
            <PillList items={toneFeel} />
          </DetailSection>
        )}

        {/* 4. Touchstones — collapsed */}
        {touchstones && touchstones.length > 0 && (
          <DetailSection title="Touchstones">
            <PillList items={touchstones} />
          </DetailSection>
        )}

        {/* 5. Themes — collapsed */}
        {themes && themes.length > 0 && (
          <DetailSection title="Themes">
            <PillList items={themes} />
          </DetailSection>
        )}

        {/* 6. Distinctions — collapsed */}
        {distinctions && (
          <DetailSection title="Distinctions">
            <p>{typeof distinctions === 'string' ? distinctions : JSON.stringify(distinctions)}</p>
          </DetailSection>
        )}

        {/* 7. Heritage & Classes Guidance — collapsed */}
        {heritageClasses && (
          <DetailSection title="Heritage & Classes Guidance">
            <p>{typeof heritageClasses === 'string' ? heritageClasses : JSON.stringify(heritageClasses)}</p>
          </DetailSection>
        )}

        {/* 8. Player & GM Principles — collapsed */}
        {(playerPrinciples || gmPrinciples) && (
          <DetailSection title="Player & GM Principles">
            {playerPrinciples && playerPrinciples.length > 0 && (
              <div className="mb-2">
                <strong className="text-ink-700 dark:text-parchment-300">Players:</strong>{' '}
                {playerPrinciples.join('. ')}
              </div>
            )}
            {gmPrinciples && gmPrinciples.length > 0 && (
              <div>
                <strong className="text-ink-700 dark:text-parchment-300">GM:</strong>{' '}
                {gmPrinciples.join('. ')}
              </div>
            )}
          </DetailSection>
        )}

        {/* 9. Custom Mechanics — collapsed */}
        {customMechanics && (
          <DetailSection title="Custom Mechanics">
            <p>{typeof customMechanics === 'string' ? customMechanics : JSON.stringify(customMechanics)}</p>
          </DetailSection>
        )}

        {/* 10. Session Zero Questions — collapsed */}
        {sessionZeroQuestions && sessionZeroQuestions.length > 0 && (
          <DetailSection title="Session Zero Questions">
            <ul className="list-disc pl-4 space-y-1">
              {sessionZeroQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </DetailSection>
        )}

        {/* 11. Complexity Rating — collapsed */}
        {complexityRating !== null && (
          <DetailSection title="Complexity Rating">
            <p>
              <strong>{complexityRating} / 5</strong>
            </p>
          </DetailSection>
        )}
      </div>

      {/* Fixed footer — Select Frame button */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-ink-200 dark:border-shadow-700">
        <button
          type="button"
          onClick={onSelectFrame}
          className="
            w-full py-[7px] px-4 rounded-fantasy
            bg-gold-500 hover:bg-gold-400
            dark:bg-gold-600 dark:hover:bg-gold-500
            text-ink-900 font-sans font-semibold text-[13px]
            border-2 border-gold-600 dark:border-gold-500
            transition-all duration-200
            hover:shadow-gold-glow
          "
        >
          Select Frame
        </button>
      </div>
    </div>
  );
}
