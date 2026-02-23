/**
 * RevealHTML -- CSS-driven word-by-word reveal for HTML content
 *
 * Parses an HTML string into a safe React tree, then wraps each text
 * word in a `<span class="word-reveal">` with staggered animation-delay.
 * Preserves block structure (paragraphs, lists, bold, line breaks).
 *
 * Unlike RevealText (plain-text only), RevealHTML handles rich content
 * from AI-generated frame detail sections without dangerouslySetInnerHTML.
 *
 * To replay the animation on content changes, the parent should key
 * this component on the text content (e.g., `key={text}`).
 *
 * Respects prefers-reduced-motion via the global CSS rule.
 */

import { useMemo, type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface RevealHTMLProps {
  /** The HTML string to parse and reveal */
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
// Constants
// =============================================================================

/** HTML tags we allow through the sanitizer */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div',
]);

const MINIMUM_DELAY_MS = 20;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Calculate per-word delay, scaling down for longer texts
 * so total animation stays within maxDuration.
 */
function calculateDelay(
  wordCount: number,
  baseSpeed: number,
  maxDuration: number,
): number {
  if (wordCount <= 0) return baseSpeed;
  const totalAtBase = wordCount * baseSpeed;
  if (totalAtBase <= maxDuration) return baseSpeed;
  return Math.max(MINIMUM_DELAY_MS, Math.floor(maxDuration / wordCount));
}

/**
 * Count the total number of visible words across all text nodes
 * in a DOM node tree (used to pre-calculate animation timing).
 */
function countWords(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    return text.split(/\s+/).filter(Boolean).length;
  }

  let count = 0;
  for (const child of Array.from(node.childNodes)) {
    count += countWords(child);
  }
  return count;
}

/**
 * Recursively convert a DOM node into React elements.
 *
 * - Text nodes: split into words, wrap each in an animated span
 * - Element nodes: recreate as React elements if tag is allowed
 * - Disallowed tags: render children only (strip the tag)
 *
 * Uses a mutable counter object so the word index increments
 * across sibling branches of the tree.
 */
function domToReact(
  node: Node,
  counter: { value: number },
  delayPerWord: number,
  nodeKey: string,
): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return wrapTextWords(node.textContent ?? '', counter, delayPerWord);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  const children = Array.from(node.childNodes).map((child, i) =>
    domToReact(child, counter, delayPerWord, `${nodeKey}-${i}`),
  );

  if (!ALLOWED_TAGS.has(tagName)) {
    return <>{children}</>;
  }

  // Map tag to React element
  switch (tagName) {
    case 'br':
      return <br key={nodeKey} />;
    case 'p':
      return <p key={nodeKey}>{children}</p>;
    case 'strong':
    case 'b':
      return <strong key={nodeKey}>{children}</strong>;
    case 'em':
    case 'i':
      return <em key={nodeKey}>{children}</em>;
    case 'ul':
      return <ul key={nodeKey}>{children}</ul>;
    case 'ol':
      return <ol key={nodeKey}>{children}</ol>;
    case 'li':
      return <li key={nodeKey}>{children}</li>;
    case 'h1':
      return <h1 key={nodeKey}>{children}</h1>;
    case 'h2':
      return <h2 key={nodeKey}>{children}</h2>;
    case 'h3':
      return <h3 key={nodeKey}>{children}</h3>;
    case 'h4':
      return <h4 key={nodeKey}>{children}</h4>;
    case 'h5':
      return <h5 key={nodeKey}>{children}</h5>;
    case 'h6':
      return <h6 key={nodeKey}>{children}</h6>;
    case 'span':
      return <span key={nodeKey}>{children}</span>;
    case 'div':
      return <div key={nodeKey}>{children}</div>;
    default:
      return <>{children}</>;
  }
}

/**
 * Split a text string into words and whitespace, wrapping each word
 * in an animated span with a staggered delay.
 */
function wrapTextWords(
  text: string,
  counter: { value: number },
  delayPerWord: number,
): ReactNode[] {
  const segments = text.split(/(\s+)/);

  return segments.map((segment, i) => {
    if (segment.trim().length === 0) {
      return <span key={`ws-${counter.value}-${i}`}>{segment}</span>;
    }

    const currentIndex = counter.value;
    counter.value++;

    return (
      <span
        key={`w-${currentIndex}`}
        className="word-reveal"
        style={{ animationDelay: `${currentIndex * delayPerWord}ms` }}
      >
        {segment}
      </span>
    );
  });
}

/**
 * Parse an HTML string into a DOM tree using DOMParser.
 * Returns the body element containing the parsed nodes.
 */
function parseHTML(html: string): HTMLElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body;
}

// =============================================================================
// Component
// =============================================================================

export function RevealHTML({
  text,
  animate = true,
  baseSpeed = 50,
  maxDuration = 2500,
  className,
}: RevealHTMLProps) {
  const reactTree = useMemo(() => {
    if (!text) return null;

    const body = parseHTML(text);

    if (!animate) {
      // Safe render: still parse through DOM to strip disallowed tags,
      // but skip animation wrapping
      const counter = { value: 0 };
      return Array.from(body.childNodes).map((child, i) =>
        domToReact(child, counter, 0, `s-${i}`),
      );
    }

    const totalWords = countWords(body);
    const delayPerWord = calculateDelay(totalWords, baseSpeed, maxDuration);
    const counter = { value: 0 };

    return Array.from(body.childNodes).map((child, i) =>
      domToReact(child, counter, delayPerWord, `r-${i}`),
    );
  }, [text, animate, baseSpeed, maxDuration]);

  if (!text) return null;

  return <div className={className}>{reactTree}</div>;
}
