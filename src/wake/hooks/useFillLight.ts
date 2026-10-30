/**
 * useFillLight — manages screen brightness during wake check.
 * Sets max brightness when active && shouldFill, restores on cleanup.
 * expo-keep-awake kept on while active.
 */
import { useEffect, useRef } from 'react';
import { useKeepAwake } from 'expo-keep-awake';

let Brightness: {
  getBrightnessAsync(): Promise<number>;
  setBrightnessAsync(value: number): Promise<void>;
} | null = null;

try {
  // Dynamic require so Jest can mock it without native module errors
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Brightness = require('expo-brightness');
} catch {
  // Module not available in test / web env — silently skip
}

export function useFillLight(active: boolean, shouldFill: boolean) {
  useKeepAwake();
  const originalBrightness = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !shouldFill || !Brightness) return;

    let cancelled = false;

    Brightness.getBrightnessAsync()
      .then((val) => {
        if (cancelled) return;
        originalBrightness.current = val;
        return Brightness!.setBrightnessAsync(1.0);
      })
      .catch(() => {/* ignore — device may not support */});

    return () => {
      cancelled = true;
      if (originalBrightness.current !== null && Brightness) {
        Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {});
        originalBrightness.current = null;
      }
    };
  }, [active, shouldFill]);
}
