import { createCalibrationTracker } from '../../../src/wake/logic/calibration';
import { FrameSignals } from '../../../src/wake/contract';

function makeFrameSignals(overrides: Partial<FrameSignals> = {}): FrameSignals {
  return {
    t: 1000,
    faceFound: true,
    leftEyeOpen: 0.85,
    rightEyeOpen: 0.85,
    eyesOpen: 0.85,
    yaw: 2.0,
    pitch: -3.0,
    roll: 0.0,
    upright: 1.0,
    brightness: 0.7,
    faceBox: { x: 0.2, y: 0.2, w: 0.6, h: 0.6 },
    latencyMs: 15,
    source: { mlkit: 0.85, ear: 0.85, cnn: 0.85, fused: 0.85 },
    ...overrides,
  };
}

describe('createCalibrationTracker', () => {
  it('guides user through open_3s phase then closed_2s phase and produces calibration', () => {
    const tracker = createCalibrationTracker({ openDurationMs: 3000, closedDurationMs: 2000 });

    // Step 1: Open eyes 3 seconds
    let res = tracker.update(makeFrameSignals({ eyesOpen: 0.88, yaw: 1.0, pitch: -2.0 }), 1000);
    expect(res.phase).toBe('open_3s');
    expect(res.isComplete).toBe(false);

    tracker.update(makeFrameSignals({ eyesOpen: 0.90, yaw: 1.5, pitch: -2.5 }), 1000);
    res = tracker.update(makeFrameSignals({ eyesOpen: 0.92, yaw: 0.5, pitch: -1.5 }), 1000);

    // Transitions to closed_2s
    expect(res.phase).toBe('closed_2s');
    expect(res.isComplete).toBe(false);

    // Step 2: Closed eyes 2 seconds
    tracker.update(makeFrameSignals({ eyesOpen: 0.12 }), 1000);
    res = tracker.update(makeFrameSignals({ eyesOpen: 0.08 }), 1000);

    // Completed
    expect(res.phase).toBe('done');
    expect(res.isComplete).toBe(true);
    expect(res.calibration).toBeDefined();

    const calib = res.calibration!;
    expect(calib.openBaseline).toBeGreaterThan(0.85);
    expect(calib.closedBaseline).toBeLessThan(0.15);
    expect(calib.yawNeutral).toBeCloseTo(1.0, 0);
    expect(calib.pitchNeutral).toBeCloseTo(-2.0, 0);
    expect(calib.createdAt).toBeGreaterThan(0);
  });

  it('pauses accumulation if face is lost during calibration', () => {
    const tracker = createCalibrationTracker({ openDurationMs: 3000, closedDurationMs: 2000 });
    tracker.update(makeFrameSignals({ faceFound: true }), 1000);

    // Face missing
    const res = tracker.update(makeFrameSignals({ faceFound: false }), 1000);
    expect(res.isPaused).toBe(true);
    expect(res.phase).toBe('open_3s');
  });

  it('calculates adaptive thresholds from calibration baselines', () => {
    const tracker = createCalibrationTracker();
    const thresholds = tracker.computeAdaptiveThresholds({
      openBaseline: 0.80,
      closedBaseline: 0.20,
      yawNeutral: 0,
      pitchNeutral: 0,
      createdAt: Date.now(),
    });

    // Midpoint is 0.50. Open should be higher than midpoint, closed lower.
    expect(thresholds.openThreshold).toBeGreaterThan(0.50);
    expect(thresholds.closedThreshold).toBeLessThan(0.50);
    expect(thresholds.openThreshold).toBeGreaterThan(thresholds.closedThreshold);
  });
});
