import { computeAlertnessHeuristic, computeBlinkRateScore } from '../../../src/wake/logic/alertness';

describe('computeAlertnessHeuristic', () => {
  it('computes 0..100 alertness score with correct weighting', () => {
    // Perfect wakeful parameters:
    // eyesOpenRatio = 1.0 (40 pts)
    // blinkRatePerMin = 20 (normal 10..30 -> 15 pts)
    // headMovementScore = 1.0 (20 pts)
    // livenessSpeedScore = 1.0 (15 pts)
    // uprightScore = 1.0 (10 pts)
    const score = computeAlertnessHeuristic({
      eyesOpenRatio: 1.0,
      blinkRatePerMin: 20,
      headMovementScore: 1.0,
      livenessSpeedScore: 1.0,
      uprightScore: 1.0,
    });

    expect(score).toBeCloseTo(100, 0);
  });

  it('computes low alertness for closed eyes, lying down, and zero movement', () => {
    const score = computeAlertnessHeuristic({
      eyesOpenRatio: 0.1,
      blinkRatePerMin: 0,
      headMovementScore: 0.0,
      livenessSpeedScore: 0.0,
      uprightScore: 0.0,
    });

    // 40*0.1 = 4 pts
    expect(score).toBeLessThanOrEqual(10);
  });

  it('scores normal blink rate (10 to 30 blinks/min) maximally', () => {
    // Normal rates
    expect(computeBlinkRateScore(15)).toBeCloseTo(1.0, 1);
    expect(computeBlinkRateScore(25)).toBeCloseTo(1.0, 1);

    // Staring without blinking (<5) or excessively rapid flutter (>60)
    expect(computeBlinkRateScore(2)).toBeLessThan(0.4);
    expect(computeBlinkRateScore(75)).toBeLessThan(0.4);
  });

  it('clamps output score strictly between 0 and 100', () => {
    const clampedMax = computeAlertnessHeuristic({
      eyesOpenRatio: 1.5,
      blinkRatePerMin: 20,
      headMovementScore: 2.0,
      livenessSpeedScore: 1.5,
      uprightScore: 1.2,
    });
    expect(clampedMax).toBe(100);

    const clampedMin = computeAlertnessHeuristic({
      eyesOpenRatio: -0.5,
      blinkRatePerMin: 0,
      headMovementScore: -1.0,
      livenessSpeedScore: -0.5,
      uprightScore: -0.2,
    });
    expect(clampedMin).toBe(0);
  });
});
