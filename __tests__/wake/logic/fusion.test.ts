import { fuseEyeSignals, EAR_MIN_NORM, EAR_MAX_NORM } from '../../../src/wake/logic/fusion';

describe('fuseEyeSignals', () => {
  it('fuses mlkit, ear, and cnn probabilities into a single eyesOpen score', () => {
    // Normal open eyes: mlkit=0.9, ear=0.28 (normalized ~0.8), cnn=0.85
    const result = fuseEyeSignals({
      mlkitProb: 0.9,
      earValue: 0.28,
      cnnProb: 0.85,
    });

    expect(result.eyesOpen).toBeGreaterThan(0.7);
    expect(result.eyesOpen).toBeLessThanOrEqual(1.0);

    // Source breakout must be populated
    expect(result.source).toHaveProperty('mlkit', 0.9);
    expect(result.source).toHaveProperty('cnn', 0.85);
    expect(result.source).toHaveProperty('ear');
    expect(result.source).toHaveProperty('fused', result.eyesOpen);
  });

  it('normalizes EAR correctly into 0..1 range', () => {
    // EAR below EAR_MIN_NORM (e.g. 0.12) should normalize to 0.0
    const closed = fuseEyeSignals({ mlkitProb: 0.0, earValue: EAR_MIN_NORM - 0.05, cnnProb: 0.0 });
    expect(closed.source.ear).toBe(0.0);

    // EAR at or above EAR_MAX_NORM (e.g. 0.35) should normalize to 1.0
    const wideOpen = fuseEyeSignals({ mlkitProb: 1.0, earValue: EAR_MAX_NORM + 0.05, cnnProb: 1.0 });
    expect(wideOpen.source.ear).toBe(1.0);
  });

  it('handles missing/partial model sources gracefully by renormalizing weights', () => {
    // For example, if CNN is not yet loaded or NaN, fusion reweights mlkit and ear
    const result = fuseEyeSignals({
      mlkitProb: 0.8,
      earValue: 0.28,
      cnnProb: undefined,
    });

    expect(result.eyesOpen).toBeGreaterThan(0.6);
    expect(result.source).toHaveProperty('cnn', 0);
  });

  it('allows custom weights', () => {
    const custom = fuseEyeSignals(
      { mlkitProb: 1.0, earValue: 0.1, cnnProb: 0.0 }, // ear=0, cnn=0
      { mlkit: 1.0, ear: 0.0, cnn: 0.0 }
    );
    expect(custom.eyesOpen).toBe(1.0);
  });
});
