import { FakeWakeCheckEngine } from '../../src/wake/fake/FakeWakeCheckEngine';
import { WakeCheckConfig } from '../../src/wake/contract';

describe('FakeWakeCheckEngine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultConfig: WakeCheckConfig = {
    holdMs: 5000,
    sensitivity: 'standard',
    liveness: true,
    livenessTimeoutMs: 5000,
    fillLight: true,
  };

  it('runs happy-path scenario to success', async () => {
    const engine = new FakeWakeCheckEngine('happy-path');
    const states: string[] = [];
    engine.subscribe((s) => states.push(s.phase));

    await engine.start(defaultConfig);
    expect(engine.getState().phase).toBe('searching');

    // Fast-forward 1.5s -> verifying
    jest.advanceTimersByTime(1600);
    expect(engine.getState().phase).toBe('verifying');

    // Fast-forward to challenge
    jest.advanceTimersByTime(3500);
    expect(engine.getState().phase).toBe('challenge');

    // Fast-forward to success
    jest.advanceTimersByTime(2500);
    expect(engine.getState().phase).toBe('success');
    expect(engine.getState().progress).toBe(1);

    await engine.stop();
    expect(engine.getState().phase).toBe('idle');
  });

  it('runs dark-room scenario with lighting levels and hints', async () => {
    const engine = new FakeWakeCheckEngine('dark-room');
    await engine.start(defaultConfig);

    expect(engine.getState().checks.lighting.level).toBe('dark');
    expect(engine.getState().hint).toBe('too-dark');

    // After 3s, lighting becomes dim
    jest.advanceTimersByTime(3100);
    expect(engine.getState().checks.lighting.level).toBe('dim');

    // After 5.5s, verifying with ok lighting
    jest.advanceTimersByTime(2500);
    expect(engine.getState().phase).toBe('verifying');
    expect(engine.getState().checks.lighting.ok).toBe(true);

    // Reaches success
    jest.advanceTimersByTime(3500);
    expect(engine.getState().phase).toBe('success');
    await engine.stop();
  });

  it('runs no-face scenario with timeout to fallback', async () => {
    const engine = new FakeWakeCheckEngine('no-face');
    await engine.start(defaultConfig);

    expect(engine.getState().phase).toBe('searching');
    expect(engine.getState().hint).toBe('no-face');

    jest.advanceTimersByTime(4500);
    expect(engine.getState().hint).toBe('look-at-camera');

    jest.advanceTimersByTime(6000);
    expect(engine.getState().phase).toBe('fallback');
    expect(engine.getState().failureReason).toBe('timeout');
    await engine.stop();
  });

  it('runs never-blinks scenario with challenge retries then fallback', async () => {
    const engine = new FakeWakeCheckEngine('never-blinks');
    await engine.start(defaultConfig);

    expect(engine.getState().phase).toBe('verifying');

    // Advances to challenge
    jest.advanceTimersByTime(2600);
    expect(engine.getState().phase).toBe('challenge');
    expect(engine.getState().checks.liveness.challenge?.kind).toBe('blink');

    // Retry 1: turn challenge
    jest.advanceTimersByTime(5100);
    expect(engine.getState().phase).toBe('challenge');
    expect(engine.getState().checks.liveness.challenge?.kind).toBe('turn');

    // Retry 2: look-up challenge
    jest.advanceTimersByTime(5600);
    expect(engine.getState().phase).toBe('challenge');
    expect(engine.getState().checks.liveness.challenge?.kind).toBe('look-up');

    // Fallback on exhaustion
    jest.advanceTimersByTime(3600);
    expect(engine.getState().phase).toBe('fallback');
    expect(engine.getState().failureReason).toBe('timeout');
    await engine.stop();
  });

  it('runs permission-denied scenario immediately', async () => {
    const engine = new FakeWakeCheckEngine('permission-denied');
    await engine.start(defaultConfig);

    expect(engine.getState().phase).toBe('permission');
    expect(engine.getState().failureReason).toBe('permission-denied');
    await engine.stop();
  });

  it('runs camera-error scenario to fallback', async () => {
    const engine = new FakeWakeCheckEngine('camera-error');
    await engine.start(defaultConfig);

    expect(engine.getState().phase).toBe('searching');
    jest.advanceTimersByTime(1100);
    expect(engine.getState().phase).toBe('fallback');
    expect(engine.getState().failureReason).toBe('camera-error');
    await engine.stop();
  });

  it('runs model-error scenario to fallback', async () => {
    const engine = new FakeWakeCheckEngine('model-error');
    await engine.start(defaultConfig);

    expect(engine.getState().phase).toBe('searching');
    jest.advanceTimersByTime(2100);
    expect(engine.getState().phase).toBe('fallback');
    expect(engine.getState().failureReason).toBe('model-error');
    await engine.stop();
  });

  it('calibrates and produces valid baseline calibration data', async () => {
    const engine = new FakeWakeCheckEngine('happy-path');
    engine.speedMultiplier = 10; // fast-forward calibration ticks

    const calibPromise = engine.calibrate();
    expect(engine.getState().phase).toBe('calibrating');

    jest.advanceTimersByTime(1100);
    const calib = await calibPromise;

    expect(calib).toBeDefined();
    expect(calib.openBaseline).toBeGreaterThan(0.5);
    expect(calib.closedBaseline).toBeLessThan(0.3);
    expect(engine.getState().phase).toBe('idle');
  });
});
