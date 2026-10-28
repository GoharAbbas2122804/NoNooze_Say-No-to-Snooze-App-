import { MethodId } from './types';

/**
 * Pure function that selects a challenge method from a pool,
 * avoiding consecutive repeats if multiple choices exist.
 *
 * @param pool Available challenge method IDs (must not be empty)
 * @param rng Pure pseudo-random generator returning float [0, 1)
 * @param lastPicked The method ID picked on the previous morning (if any)
 * @returns The selected MethodId
 */
export function pickChallenge(
  pool: MethodId[],
  rng: () => number = Math.random,
  lastPicked?: MethodId | null
): MethodId {
  if (!pool || pool.length === 0) {
    throw new Error('Challenge pool cannot be empty');
  }

  if (pool.length === 1) {
    return pool[0];
  }

  // Filter out the last picked challenge if more than 1 choice exists
  const candidates = lastPicked ? pool.filter((m) => m !== lastPicked) : pool;
  const activePool = candidates.length > 0 ? candidates : pool;

  const index = Math.floor(rng() * activePool.length);
  return activePool[Math.min(index, activePool.length - 1)];
}
