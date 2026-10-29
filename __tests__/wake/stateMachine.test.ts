import { createWakeStateMachine } from '../../src/wake/logic/stateMachine';
import { FrameSignals, WakeCheckConfig } from '../../src/wake/contract';

function makeFrameSignals(overrides: Partial<FrameSignals> = {}): FrameSignals {
  return {
    t: 1000,
    faceFound: true,
    leftEyeOpen: 0.85,
    rightEyeOpen: 0.85,
    eyesOpen: 0.85,
    yaw: 0,
    pitch: 0,
    roll: 0,
    upright: 1.0,
    brightness: 0.6,
    faceBox: { x: 0.25, y: 0.2, w: 0.5, h: 0.5 },
    latencyMs: 12,
    source: { mlkit: 0.85, ear: 0.85, cnn: 0.85, fused: 0.85 },
    ...overrides,
  };
}

describe('createWakeStateMachine', () => {
  let fakeTime = 10000;
  const clock = () => fakeTime;
  const config: WakeCheckConfig = {
    holdMs: 2000,
    sensitivity: 'standard',
    liveness: true,
    livenessTimeoutMs: 8000,
    fillLight: false,
  };

  beforeEach(() => {
    fakeTime = 10000;
  });

  it('initializes in searching or setup phase and transitions to verifying when face is present', () => {
    const sm = createWakeStateMachine(config, { clock });
    let state = sm.getState();
    expect(state.phase).toBe('searching');
    expect(state.checks.eyesOpen.targetMs).toBe(2000);

    // Provide face frame
    state = sm.handleFrame(makeFrameSignals({ t: fakeTime }));
    expect(['searching', 'verifying']).toContain(state.phase);
  });

  it('progresses verifying -> challenge -> success when eyes held open and challenge passed', () => {
    const sm = createWakeStateMachine(config, { clock });

    // Step 1: Accumulate hold time in verifying phase
    for (let i = 0; i < 10; i++) {
      fakeTime += 250;
      sm.handleFrame(makeFrameSignals({ t: fakeTime, eyesOpen: 0.9, upright: 1.0 }));
    }

    let state = sm.getState();
    expect(state.checks.eyesOpen.ok).toBe(true);
    expect(state.phase).toBe('challenge');
    expect(state.checks.liveness.challenge).toBeDefined();

    // Step 2: Solve challenge (e.g. simulate challenge completion)
    const challenge = state.checks.liveness.challenge!;
    if (challenge.kind === 'turn') {
      fakeTime += 100;
      state = sm.handleFrame(makeFrameSignals({
        t: fakeTime,
        yaw: challenge.direction === 'left' ? 25 : -25,
      }));
    } else if (challenge.kind === 'look-up') {
      fakeTime += 100;
      state = sm.handleFrame(makeFrameSignals({ t: fakeTime, pitch: 25 }));
    } else if (challenge.kind === 'blink') {
      for (let b = 0; b < challenge.count; b++) {
        fakeTime += 100;
        sm.handleFrame(makeFrameSignals({ t: fakeTime, eyesOpen: 0.1 }));
        fakeTime += 100;
        state = sm.handleFrame(makeFrameSignals({ t: fakeTime, eyesOpen: 0.9 }));
      }
    }

    expect(state.phase).toBe('success');
    expect(state.progress).toBe(1.0);
  });

  it('transitions to fallback when no face is found for more than 20 seconds', () => {
    const sm = createWakeStateMachine(config, { clock });

    // Initial searching frame
    sm.handleFrame(makeFrameSignals({ faceFound: false, t: fakeTime }));

    // Advance 21 seconds with no face
    fakeTime += 21000;
    const state = sm.handleFrame(makeFrameSignals({ faceFound: false, t: fakeTime }));

    expect(state.phase).toBe('fallback');
    expect(state.failureReason).toBe('timeout');
    expect(state.hint).toBe('no-face');
  });

  it('transitions to fallback when environment is too dark for more than 10 seconds', () => {
    const sm = createWakeStateMachine(config, { clock });

    sm.handleFrame(makeFrameSignals({ brightness: 0.05, t: fakeTime }));

    // Advance 11 seconds in near total darkness
    fakeTime += 11000;
    const state = sm.handleFrame(makeFrameSignals({ brightness: 0.05, t: fakeTime }));

    expect(state.phase).toBe('fallback');
    expect(state.failureReason).toBe('too-dark');
  });

  it('transitions to fallback on explicit camera/permission/model error', () => {
    const sm = createWakeStateMachine(config, { clock });
    const permError = sm.triggerError('permission-denied');
    expect(permError.phase).toBe('fallback');
    expect(permError.failureReason).toBe('permission-denied');

    const sm2 = createWakeStateMachine(config, { clock });
    const camError = sm2.triggerError('camera-error');
    expect(camError.phase).toBe('fallback');
    expect(camError.failureReason).toBe('camera-error');
  });

  it('provides correct user guidance hints based on frame conditions', () => {
    const sm = createWakeStateMachine(config, { clock });

    // Face too small (move closer)
    let state = sm.handleFrame(makeFrameSignals({ faceBox: { x: 0.4, y: 0.4, w: 0.1, h: 0.1 } }));
    expect(state.hint).toBe('move-closer');

    // Face too large (move back)
    state = sm.handleFrame(makeFrameSignals({ faceBox: { x: 0.05, y: 0.05, w: 0.92, h: 0.92 } }));
    expect(state.hint).toBe('move-back');

    // Not upright
    state = sm.handleFrame(makeFrameSignals({ upright: 0.2 }));
    expect(state.hint).toBe('sit-up');
  });
});
