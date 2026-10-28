import { useReducedMotion } from 'react-native-reanimated';

/**
 * Computes delay offset for staggered element entrances.
 * @param index Element position in list/sequence
 * @param stepMs Duration per step (default 40ms)
 * @returns Milliseconds to delay
 */
export function stagger(index: number, stepMs = 40): number {
  return Math.max(0, index * stepMs);
}

/**
 * Chains multiple duration items into cumulative timestamp sequence.
 * @param steps Array of step durations in ms
 * @returns Array of start times for each step
 */
export function sequence(...steps: number[]): number[] {
  const result: number[] = [0];
  let current = 0;
  for (let i = 0; i < steps.length - 1; i++) {
    current += steps[i];
    result.push(current);
  }
  return result;
}

/**
 * Hook to guard animations for accessibility compliance.
 * Replaces large transforms with gentle opacity changes when reduced motion is preferred.
 */
export function useMotionGuard() {
  const reducedMotion = useReducedMotion();
  return {
    isReduced: Boolean(reducedMotion),
    durationMultiplier: reducedMotion ? 0.3 : 1.0,
  };
}
