import {
  generateProblem,
  MathProblem,
  MathDifficulty,
} from '../../src/domain/math-generator';

describe('Math Problem Generator', () => {
  // Deterministic linear congruential generator for testing
  function createSeededRNG(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  describe('Easy difficulty', () => {
    it('always generates integer answers and never negative results', () => {
      const rng = createSeededRNG(42);
      for (let i = 0; i < 50; i++) {
        const problem = generateProblem('easy', rng);
        expect(Number.isInteger(problem.answer)).toBe(true);
        expect(problem.answer).toBeGreaterThanOrEqual(0);
        expect(typeof problem.question).toBe('string');
        expect(problem.question.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Medium difficulty', () => {
    it('always generates integer answers', () => {
      const rng = createSeededRNG(12345);
      for (let i = 0; i < 50; i++) {
        const problem = generateProblem('medium', rng);
        expect(Number.isInteger(problem.answer)).toBe(true);
      }
    });
  });

  describe('Hard difficulty', () => {
    it('always generates integer answers and never divides by zero', () => {
      const rng = createSeededRNG(98765);
      for (let i = 0; i < 50; i++) {
        const problem = generateProblem('hard', rng);
        expect(Number.isInteger(problem.answer)).toBe(true);
        expect(Number.isFinite(problem.answer)).toBe(true);
        expect(problem.question).not.toContain('/ 0');
      }
    });
  });

  describe('Determinism', () => {
    it('produces identical sequence when given identical seeded RNG', () => {
      const rng1 = createSeededRNG(777);
      const rng2 = createSeededRNG(777);

      for (let i = 0; i < 20; i++) {
        const p1 = generateProblem('medium', rng1);
        const p2 = generateProblem('medium', rng2);
        expect(p1.question).toBe(p2.question);
        expect(p1.answer).toBe(p2.answer);
      }
    });
  });
});
