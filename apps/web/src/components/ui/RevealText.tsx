/**
 * RevealText — CSS-driven word-by-word text reveal animation
 *
 * Words fade in sequentially with a brief gold glow, evoking magical
 * inscription into the Codex. Pure CSS animations — no React state
 * updates per word, no intervals.
 *
 * To replay the animation on content changes, the parent should key
 * this component on the text content (e.g., `key={text}`).
 *
 * Respects prefers-reduced-motion: words appear instantly.
 */

import { useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface RevealTextProps {
  /** The text content to reveal */
  text: string;
  /** Whether to animate the reveal (false = instant display) */
  animate?: boolean;
  /** Base delay per word in ms (adaptive: scales down for longer texts) */
  baseSpeed?: number;
  /** Maximum total animation duration in ms */
  maxDuration?: number;
  /** Additional className for the container */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Split text into segments, preserving whitespace.
 * Returns alternating [word, space, word, space, ...] segments.
 */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/);
}

/**
 * Calculate per-word delay, scaling down for longer texts
 * so total animation stays within maxDuration.
 */
function calculateDelay(
  wordCount: number,
  baseSpeed: number,
  maxDuration: number
): number {
  if (wordCount <= 0) return baseSpeed;
  const totalAtBase = wordCount * baseSpeed;
  if (totalAtBase <= maxDuration) return baseSpeed;
  return Math.max(20, Math.floor(maxDuration / wordCount));
}

// =============================================================================
// Component
// =============================================================================

export function RevealText({
  text,
  animate = true,
  baseSpeed = 50,
  maxDuration = 2500,
  className,
}: RevealTextProps) {
  const segments = useMemo(() => tokenize(text), [text]);

  // Count only non-whitespace segments (actual words)
  const wordCount = useMemo(
    () => segments.filter((s) => s.trim().length > 0).length,
    [segments]
  );

  const delayPerWord = useMemo(
    () => calculateDelay(wordCount, baseSpeed, maxDuration),
    [wordCount, baseSpeed, maxDuration]
  );

  if (!animate) {
    return <span className={className}>{text}</span>;
  }

  let wordIndex = 0;

  return (
    <span className={className}>
      {segments.map((segment, i) => {
        // Whitespace segments: render as-is
        if (segment.trim().length === 0) {
          return <span key={i}>{segment}</span>;
        }

        // Word segments: animate with staggered delay
        const currentIndex = wordIndex;
        wordIndex++;

        return (
          <span
            key={i}
            className="word-reveal"
            style={{ animationDelay: `${currentIndex * delayPerWord}ms` }}
          >
            {segment}
          </span>
        );
      })}
    </span>
  );
}
