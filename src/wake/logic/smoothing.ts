export type Sensitivity = 'relaxed' | 'standard' | 'strict';

export interface HysteresisThresholds {
  open: number;
  closed: number;
}

export const SENSITIVITY_THRESHOLDS: Record<Sensitivity, HysteresisThresholds> = {
  relaxed: { open: 0.50, closed: 0.30 },
  standard: { open: 0.60, closed: 0.40 },
  strict: { open: 0.70, closed: 0.50 },
};

export interface SmootherOptions {
  alpha?: number; // EMA weight: 0..1 (default 0.4)
  medianWindowSize?: number; // default 3
}

export function createSignalSmoother(
  sensitivity: Sensitivity = 'standard',
  options: SmootherOptions = {}
) {
  const thresholds = SENSITIVITY_THRESHOLDS[sensitivity] || SENSITIVITY_THRESHOLDS.standard;
  const alpha = options.alpha ?? 0.4;
  const windowSize = options.medianWindowSize ?? 3;

  let window: number[] = [];
  let ema: number | null = null;
  let isOpenState: boolean = false;

  function computeMedian(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    }
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return {
    update(raw: number): { smoothed: number; isOpen: boolean } {
      window.push(raw);
      if (window.length > windowSize) {
        window.shift();
      }

      const medianVal = computeMedian(window);
      if (ema === null) {
        ema = medianVal;
      } else {
        ema = alpha * medianVal + (1 - alpha) * ema;
      }

      // Hysteresis
      if (isOpenState) {
        if (ema <= thresholds.closed) {
          isOpenState = false;
        }
      } else {
        if (ema >= thresholds.open) {
          isOpenState = true;
        }
      }

      return {
        smoothed: ema,
        isOpen: isOpenState,
      };
    },

    reset(): void {
      window = [];
      ema = null;
      isOpenState = false;
    },

    getIsOpen(): boolean {
      return isOpenState;
    },
  };
}
