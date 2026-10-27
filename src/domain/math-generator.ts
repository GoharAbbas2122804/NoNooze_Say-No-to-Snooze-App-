export type MathDifficulty = 'easy' | 'medium' | 'hard';

export type MathProblem = {
  question: string;
  answer: number;
};

export type RNG = () => number;

function getRandomInt(min: number, max: number, rng: RNG): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function generateProblem(
  difficulty: MathDifficulty,
  rng: RNG = Math.random
): MathProblem {
  if (difficulty === 'easy') {
    const isAddition = rng() > 0.5;
    let a = getRandomInt(2, 20, rng);
    let b = getRandomInt(1, 15, rng);

    if (isAddition) {
      return {
        question: `${a} + ${b}`,
        answer: a + b,
      };
    } else {
      if (a < b) {
        [a, b] = [b, a];
      }
      return {
        question: `${a} - ${b}`,
        answer: a - b,
      };
    }
  }

  if (difficulty === 'medium') {
    const pattern = getRandomInt(0, 3, rng);

    if (pattern === 0) {
      const a = getRandomInt(3, 12, rng);
      const b = getRandomInt(3, 12, rng);
      return {
        question: `${a} × ${b}`,
        answer: a * b,
      };
    } else if (pattern === 1) {
      const a = getRandomInt(2, 9, rng);
      const b = getRandomInt(2, 9, rng);
      const c = getRandomInt(5, 30, rng);
      return {
        question: `${a} × ${b} + ${c}`,
        answer: a * b + c,
      };
    } else if (pattern === 2) {
      const a = getRandomInt(2, 9, rng);
      const b = getRandomInt(2, 9, rng);
      const c = getRandomInt(1, a * b, rng);
      return {
        question: `${a} × ${b} - ${c}`,
        answer: a * b - c,
      };
    } else {
      const a = getRandomInt(10, 40, rng);
      const b = getRandomInt(2, 9, rng);
      const c = getRandomInt(2, 9, rng);
      return {
        question: `${a} + ${b} × ${c}`,
        answer: a + b * c,
      };
    }
  }

  // Hard difficulty
  const pattern = getRandomInt(0, 2, rng);

  if (pattern === 0) {
    // Clean division + addition: (q * d) / d + c
    const quotient = getRandomInt(3, 12, rng);
    const divisor = getRandomInt(2, 9, rng); // strictly >= 2, never 0
    const dividend = quotient * divisor;
    const c = getRandomInt(5, 25, rng);
    return {
      question: `${dividend} ÷ ${divisor} + ${c}`,
      answer: quotient + c,
    };
  } else if (pattern === 1) {
    // Double multiplication
    const a = getRandomInt(2, 6, rng);
    const b = getRandomInt(3, 8, rng);
    const c = getRandomInt(2, 5, rng);
    const d = getRandomInt(2, 6, rng);
    return {
      question: `${a} × ${b} + ${c} × ${d}`,
      answer: a * b + c * d,
    };
  } else {
    // Large multiplication with subtraction
    const a = getRandomInt(11, 20, rng);
    const b = getRandomInt(3, 8, rng);
    const c = getRandomInt(10, 30, rng);
    return {
      question: `${a} × ${b} - ${c}`,
      answer: a * b - c,
    };
  }
}
