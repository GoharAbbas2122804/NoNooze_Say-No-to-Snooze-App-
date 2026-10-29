/**
 * ALERTNESS HEURISTIC:
 * This is an experimental, non-clinical behavioral proxy combining ocular openness,
 * natural blink dynamics, head mobility, liveness response speed, and posture.
 * It is NOT a medical diagnosis tool, NOT validated for clinical sleep analysis,
 * and should never be represented as medical advice.
 */

export interface AlertnessParams {
  eyesOpenRatio: number; // 0..1 (fraction of time eyes held open)
  blinkRatePerMin: number; // blinks per minute (10..30 is normal baseline)
  headMovementScore: number; // 0..1 (natural micro-movements vs rigid sleep/death posture)
  livenessSpeedScore: number; // 0..1 (promptness in completing challenge)
  uprightScore: number; // 0..1 (heuristic upright orientation)
}

/**
 * Normal resting blink rate in alert humans is typically between 10 and 30 blinks per minute.
 * Hypovigilance/staring (<5) or frantic fluttering/myoclonus (>60) yields a lower alertness score.
 */
export function computeBlinkRateScore(blinksPerMin: number): number {
  if (blinksPerMin <= 0) return 0.0;
  if (blinksPerMin >= 10 && blinksPerMin <= 30) {
    return 1.0;
  }
  if (blinksPerMin < 10) {
    return blinksPerMin / 10.0;
  }
  // blinksPerMin > 30: drops off gradually to 0 at 70 bpm
  const drop = 1.0 - (blinksPerMin - 30) / 40.0;
  return Math.min(1.0, Math.max(0.0, drop));
}

/**
 * Computes heuristic alertness score from 0 to 100:
 * 40 * eyes-open ratio +
 * 15 * blink-rate score +
 * 20 * head-movement score +
 * 15 * liveness-speed score +
 * 10 * upright posture score
 */
export function computeAlertnessHeuristic(params: AlertnessParams): number {
  const eyesOpen = Math.min(1.0, Math.max(0.0, params.eyesOpenRatio));
  const blinkScore = computeBlinkRateScore(params.blinkRatePerMin);
  const headMovement = Math.min(1.0, Math.max(0.0, params.headMovementScore));
  const livenessSpeed = Math.min(1.0, Math.max(0.0, params.livenessSpeedScore));
  const upright = Math.min(1.0, Math.max(0.0, params.uprightScore));

  const rawScore =
    40.0 * eyesOpen +
    15.0 * blinkScore +
    20.0 * headMovement +
    15.0 * livenessSpeed +
    10.0 * upright;

  return Math.min(100.0, Math.max(0.0, rawScore));
}
