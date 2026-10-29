import { DefaultWakeCheckEngine } from '../../src/wake/engine';
import { WakeCheckConfig, FrameSignals, WakeCheckState } from '../../src/wake/contract';

function makeFrameSignals(overrides: Partial<FrameSignals> = {}): FrameSignals {
  return {
    t: 1000,
    faceFound: true,
    leftEyeOpen: 0.9,
    rightEyeOpen: 0.9,
    eyesOpen: 0.9,
    yaw: 0,
    pitch: 0,
    roll: 0,
    upright: 1.0,
    brightness: 0.7,
    faceBox: { x: 0.25, y: 0.2, w: 0.5, h: 0.5 },
    latencyMs: 14,
    source: { mlkit: 0.9, ear: 0.9, cnn: 0.9, fused: 0.9 },
    ...overrides,
  };
}

describe('DefaultWakeCheckEngine', () => {
  const config: WakeCheckConfig = {
    holdMs: 1000,
    sensitivity: 'standard',
    liveness: false, // test simple verify path first
    livenessTimeoutMs: 5000,
    fillLight: false,
  };

  it('starts in idle and transitions through state notifications to subscribers', async () => {
    const engine = new DefaultWakeCheckEngine();
    expect(engine.getState().phase).toBe('idle');

    const states: WakeCheckState[] = [];
    const unsubscribe = engine.subscribe((s) => states.push(s));

    await engine.start(config);
    expect(engine.getState().phase).toBe('searching');

    // Emit frame signals
    engine.feedFrame(makeFrameSignals({ t: 100 }));
    engine.feedFrame(makeFrameSignals({ t: 600, eyesOpen: 0.9 }));
    engine.feedFrame(makeFrameSignals({ t: 1200, eyesOpen: 0.9 }));

    expect(states.length).toBeGreaterThan(1);
    expect(engine.getState().phase).toBe('success');

    await engine.stop();
    expect(engine.getState().phase).toBe('idle');
    unsubscribe();
  });

  it('unsubscribes listeners cleanly without memory leaks', async () => {
    const engine = new DefaultWakeCheckEngine();
    let count = 0;
    const unsub = engine.subscribe(() => {
      count++;
    });

    await engine.start(config);
    expect(count).toBeGreaterThan(0);

    const prevCount = count;
    unsub();

    engine.feedFrame(makeFrameSignals());
    expect(count).toBe(prevCount);

    await engine.stop();
  });

  it('handles calibration flow successfully', async () => {
    const engine = new DefaultWakeCheckEngine();
    const calibPromise = engine.calibrate();

    expect(engine.getState().phase).toBe('calibrating');

    // Simulate calibration frames: 3s open, 2s closed
    for (let i = 0; i < 6; i++) {
      engine.feedFrame(makeFrameSignals({ eyesOpen: 0.9 }));
    }
    for (let i = 0; i < 4; i++) {
      engine.feedFrame(makeFrameSignals({ eyesOpen: 0.1 }));
    }

    const calib = await calibPromise;
    expect(calib).toBeDefined();
    expect(calib.openBaseline).toBeGreaterThan(0.8);
    expect(calib.closedBaseline).toBeLessThan(0.2);
    expect(engine.getState().phase).toBe('idle');
  });

  it('switches to fallback if camera error is reported', async () => {
    const engine = new DefaultWakeCheckEngine();
    await engine.start(config);

    engine.reportError('camera-error');
    expect(engine.getState().phase).toBe('fallback');
    expect(engine.getState().failureReason).toBe('camera-error');
  });
});
