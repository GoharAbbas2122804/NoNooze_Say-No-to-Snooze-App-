/**
 * useFallbackTimer — reveals the "Use math instead" ghost button after 10 s.
 * Resets when active changes to false.
 */
import { useState, useEffect } from 'react';

const FALLBACK_DELAY_MS = 10000;

export function useFallbackTimer(active: boolean): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setVisible(true), FALLBACK_DELAY_MS);
    return () => {
      clearTimeout(t);
      setVisible(false);
    };
  }, [active]);

  return active && visible;
}
