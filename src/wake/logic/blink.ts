export interface BlinkDetectorOptions {
  minDipMs?: number; // default 80 ms
  maxDipMs?: number; // default 500 ms
  closedThreshold?: number; // default 0.35
  openThreshold?: number; // default 0.60
}

export interface BlinkResult {
  blinkDetected: boolean;
  blinkDurationMs?: number;
}

export function createBlinkDetector(options: BlinkDetectorOptions = {}) {
  const minDipMs = options.minDipMs ?? 80;
  const maxDipMs = options.maxDipMs ?? 500;
  const closedThreshold = options.closedThreshold ?? 0.35;
  const openThreshold = options.openThreshold ?? 0.60;

  let inDip = false;
  let dipDurationMs = 0;
  let dipExceededMax = false;

  return {
    update(eyesOpen: number, dtMs: number): BlinkResult {
      if (!inDip) {
        if (eyesOpen <= closedThreshold) {
          inDip = true;
          dipDurationMs = dtMs;
          dipExceededMax = false;
        }
        return { blinkDetected: false };
      }

      // Check if eyes reopened
      if (eyesOpen >= openThreshold) {
        const completedDuration = dipDurationMs;
        const validBlink = !dipExceededMax && completedDuration >= minDipMs && completedDuration <= maxDipMs;

        inDip = false;
        dipDurationMs = 0;
        dipExceededMax = false;

        if (validBlink) {
          return {
            blinkDetected: true,
            blinkDurationMs: completedDuration,
          };
        }
        return { blinkDetected: false };
      }

      // Still in dip: accumulate closed duration
      dipDurationMs += dtMs;
      if (dipDurationMs > maxDipMs) {
        dipExceededMax = true;
      }

      return { blinkDetected: false };
    },

    reset(): void {
      inDip = false;
      dipDurationMs = 0;
      dipExceededMax = false;
    },
  };
}
