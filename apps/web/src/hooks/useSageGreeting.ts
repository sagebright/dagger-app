import { useEffect, useRef } from 'react';

/**
 * Requests a Sage greeting on mount when no messages exist yet.
 * Uses a ref guard to prevent duplicate greetings in StrictMode.
 */
export function useSageGreeting(
  messagesLength: number,
  requestGreeting: () => Promise<void>,
  setIsThinking: (val: boolean) => void,
): void {
  const hasGreeted = useRef(false);
  useEffect(() => {
    if (messagesLength === 0 && !hasGreeted.current) {
      hasGreeted.current = true;
      setIsThinking(true);
      requestGreeting().finally(() => setIsThinking(false));
    }
  }, [messagesLength, requestGreeting, setIsThinking]);
}
