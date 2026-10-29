/**
 * useHintRateLimit — ensures hints are surfaced at most once per 8 seconds.
 * Returns the currently displayable hint (or undefined if rate-limited).
 */
import { useState, useEffect, useRef } from 'react';
import { Hint } from '../contract';

const RATE_LIMIT_MS = 8000;

export function useHintRateLimit(rawHint: Hint | undefined): Hint | undefined {
  const [displayed, setDisplayed] = useState<Hint | undefined>(undefined);
  const lastFiredAt = useRef<number>(0);
  const lastHint = useRef<Hint | undefined>(undefined);

  useEffect(() => {
    if (!rawHint) {
      lastHint.current = undefined;
      return;
    }

    const now = Date.now();
    const sameHint = lastHint.current === rawHint;
    const elapsed = now - lastFiredAt.current;

    if (!sameHint || elapsed >= RATE_LIMIT_MS) {
      lastFiredAt.current = now;
      lastHint.current = rawHint;
      setDisplayed(rawHint);
    }
  }, [rawHint]);

  return rawHint ? displayed : undefined;
}
