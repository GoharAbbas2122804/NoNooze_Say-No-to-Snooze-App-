import { Calibration, FrameSignals } from '../contract';

export type CalibrationPhase = 'idle' | 'open_3s' | 'closed_2s' | 'done';

export interface CalibrationOptions {
  openDurationMs?: number; // default 3000 ms
  closedDurationMs?: number; // default 2000 ms
}

export interface CalibrationResult {
  phase: CalibrationPhase;
  isComplete: boolean;
  isPaused: boolean;
  progress: number; // 0..1 overall
  calibration?: Calibration;
}

export interface AdaptiveThresholds {
  openThreshold: number;
  closedThreshold: number;
}

export function createCalibrationTracker(options: CalibrationOptions = {}) {
  const openDurationMs = options.openDurationMs ?? 3000;
  const closedDurationMs = options.closedDurationMs ?? 2000;
  const totalDurationMs = openDurationMs + closedDurationMs;

  let phase: CalibrationPhase = 'open_3s';
  let openAccumulatedMs = 0;
  let closedAccumulatedMs = 0;

  // Samples
  const openEyeSamples: number[] = [];
  const closedEyeSamples: number[] = [];
  const yawSamples: number[] = [];
  const pitchSamples: number[] = [];

  function average(arr: number[], fallback: number): number {
    if (arr.length === 0) return fallback;
    const sum = arr.reduce((acc, v) => acc + v, 0);
    return sum / arr.length;
  }

  function update(signals: FrameSignals, dtMs: number): CalibrationResult {
    if (phase === 'done') {
      return {
        phase: 'done',
        isComplete: true,
        isPaused: false,
        progress: 1.0,
      };
    }

    if (!signals.faceFound) {
      const currentDone = openAccumulatedMs + closedAccumulatedMs;
      return {
        phase,
        isComplete: false,
        isPaused: true,
        progress: currentDone / totalDurationMs,
      };
    }

    if (phase === 'open_3s') {
      openAccumulatedMs += dtMs;
      openEyeSamples.push(signals.eyesOpen);
      yawSamples.push(signals.yaw);
      pitchSamples.push(signals.pitch);

      if (openAccumulatedMs >= openDurationMs) {
        phase = 'closed_2s';
      }

      return {
        phase,
        isComplete: false,
        isPaused: false,
        progress: openAccumulatedMs / totalDurationMs,
      };
    }

    if (phase === 'closed_2s') {
      closedAccumulatedMs += dtMs;
      closedEyeSamples.push(signals.eyesOpen);

      if (closedAccumulatedMs >= closedDurationMs) {
        phase = 'done';
        const calib: Calibration = {
          openBaseline: average(openEyeSamples, 0.85),
          closedBaseline: average(closedEyeSamples, 0.15),
          yawNeutral: average(yawSamples, 0.0),
          pitchNeutral: average(pitchSamples, 0.0),
          createdAt: Date.now(),
        };

        return {
          phase: 'done',
          isComplete: true,
          isPaused: false,
          progress: 1.0,
          calibration: calib,
        };
      }

      const totalAccum = openAccumulatedMs + closedAccumulatedMs;
      return {
        phase: 'closed_2s',
        isComplete: false,
        isPaused: false,
        progress: Math.min(1.0, totalAccum / totalDurationMs),
      };
    }

    return {
      phase,
      isComplete: false,
      isPaused: false,
      progress: 0,
    };
  }

  function computeAdaptiveThresholds(calib: Calibration): AdaptiveThresholds {
    const spread = Math.max(0.1, calib.openBaseline - calib.closedBaseline);
    const openThreshold = calib.openBaseline - spread * 0.35;
    const closedThreshold = calib.closedBaseline + spread * 0.35;

    return {
      openThreshold: Math.min(0.9, Math.max(0.4, openThreshold)),
      closedThreshold: Math.min(0.5, Math.max(0.1, closedThreshold)),
    };
  }

  return {
    update,
    computeAdaptiveThresholds,
    reset(): void {
      phase = 'open_3s';
      openAccumulatedMs = 0;
      closedAccumulatedMs = 0;
      openEyeSamples.length = 0;
      closedEyeSamples.length = 0;
      yawSamples.length = 0;
      pitchSamples.length = 0;
    },
  };
}
