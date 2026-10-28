import { pickChallenge } from '../../src/domain/random-challenge';
import { MethodId } from '../../src/domain/types';

describe('pickChallenge pure function', () => {
  it('throws when given an empty pool', () => {
    expect(() => pickChallenge([], () => 0.5)).toThrow('Challenge pool cannot be empty');
  });

  it('returns the only available item when pool has 1 item', () => {
    const pool: MethodId[] = ['math'];
    const result = pickChallenge(pool, () => 0.9, 'math');
    expect(result).toBe('math');
  });

  it('avoids repeating yesterday pick when alternate choices exist', () => {
    const pool: MethodId[] = ['math', 'pushups'];
    // Since 'math' is lastPicked, candidate pool is ['pushups'], so index 0 is 'pushups'
    const result = pickChallenge(pool, () => 0, 'math');
    expect(result).toBe('pushups');
  });

  it('samples correctly based on RNG injection', () => {
    const pool: MethodId[] = ['math', 'pushups', 'face'];
    // candidate pool without 'face' is ['math', 'pushups']
    // rng = 0.8 -> index Math.floor(0.8 * 2) = 1 -> 'pushups'
    const result = pickChallenge(pool, () => 0.8, 'face');
    expect(result).toBe('pushups');
  });

  it('handles lastPicked not being in pool', () => {
    const pool: MethodId[] = ['math', 'pushups'];
    const result = pickChallenge(pool, () => 0.1, 'situps');
    expect(result).toBe('math');
  });
});
