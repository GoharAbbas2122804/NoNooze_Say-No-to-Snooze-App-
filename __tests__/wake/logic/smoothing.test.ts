import { createSignalSmoother, SENSITIVITY_THRESHOLDS } from '../../../src/wake/logic/smoothing';

describe('createSignalSmoother', () => {
  it('has correct default thresholds for sensitivities', () => {
    expect(SENSITIVITY_THRESHOLDS.relaxed).toEqual({ open: 0.50, closed: 0.30 });
    expect(SENSITIVITY_THRESHOLDS.standard).toEqual({ open: 0.60, closed: 0.40 });
    expect(SENSITIVITY_THRESHOLDS.strict).toEqual({ open: 0.70, closed: 0.50 });
  });

  it('smooths raw signal and eliminates single-frame impulse noise via median filter', () => {
    const smoother = createSignalSmoother('standard', { alpha: 0.5, medianWindowSize: 3 });

    // Stream of steady open signals
    smoother.update(0.8);
    smoother.update(0.8);
    const stable = smoother.update(0.8);
    expect(stable.isOpen).toBe(true);

    // Single outlier spike downward (e.g. 0.0) should be rejected by median window [0.8, 0.8, 0.0] -> 0.8
    const outlier = smoother.update(0.0);
    expect(outlier.smoothed).toBeGreaterThan(0.5);
    expect(outlier.isOpen).toBe(true);
  });

  it('applies hysteresis thresholds so state does not flutter around boundary', () => {
    const smoother = createSignalSmoother('standard'); // open >= 0.60, closed <= 0.40

    // Initially closed
    let res = smoother.update(0.3);
    expect(res.isOpen).toBe(false);

    // Moves to 0.55 (above closed threshold 0.40, but below open threshold 0.60) -> remains closed
    for (let i = 0; i < 5; i++) {
      res = smoother.update(0.55);
    }
    expect(res.isOpen).toBe(false);

    // Crosses open threshold >= 0.60 -> becomes open
    for (let i = 0; i < 5; i++) {
      res = smoother.update(0.75);
    }
    expect(res.isOpen).toBe(true);

    // Drops to 0.50 (below open threshold 0.60, but above closed threshold 0.40) -> remains open
    for (let i = 0; i < 5; i++) {
      res = smoother.update(0.50);
    }
    expect(res.isOpen).toBe(true);

    // Drops below 0.40 -> switches to closed
    for (let i = 0; i < 5; i++) {
      res = smoother.update(0.20);
    }
    expect(res.isOpen).toBe(false);
  });

  it('resets filter history cleanly', () => {
    const smoother = createSignalSmoother('strict');
    smoother.update(0.9);
    smoother.update(0.9);
    smoother.reset();
    const fresh = smoother.update(0.1);
    expect(fresh.isOpen).toBe(false);
  });
});
