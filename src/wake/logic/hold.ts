export interface HoldState {
  heldMs: number;
  isMet: boolean;
  isBlinking: boolean;
}

export function createHoldTracker(targetMs: number, blinkGraceMs: number = 400) {
  let heldMs = 0;
  let closedTimeMs = 0;

  return {
    update(
      isOpen: boolean,
      isUpright: boolean,
      faceFound: boolean,
      dtMs: number,
      isLookingAtCamera: boolean = true
    ): HoldState {
      const allValid = isOpen && isUpright && isLookingAtCamera && faceFound;

      if (allValid) {
        closedTimeMs = 0;
        heldMs = Math.min(targetMs, heldMs + dtMs);
        return {
          heldMs,
          isMet: heldMs >= targetMs,
          isBlinking: false,
        };
      }

      // If conditions are not all met, evaluate blink grace period
      closedTimeMs += dtMs;
      if (closedTimeMs <= blinkGraceMs && heldMs > 0) {
        // Within natural blink / momentary dropout window: keep accumulated heldMs
        return {
          heldMs,
          isMet: heldMs >= targetMs,
          isBlinking: true,
        };
      }

      // Grace period exceeded: reset accumulation
      heldMs = 0;
      return {
        heldMs: 0,
        isMet: false,
        isBlinking: false,
      };
    },

    reset(): void {
      heldMs = 0;
      closedTimeMs = 0;
    },

    getHeldMs(): number {
      return heldMs;
    },
  };
}
