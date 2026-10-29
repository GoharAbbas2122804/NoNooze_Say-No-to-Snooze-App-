import { LivenessChallenge, FrameSignals, Calibration } from '../contract';
import { createBlinkDetector } from './blink';
import { checkHeadTurn } from './headTurn';

export interface ChallengeManagerOptions {
  maxRetries?: number; // default 2
  timeoutMs?: number; // default 8000 ms
  randomFn?: () => number;
}

export interface ChallengeProgress {
  isComplete: boolean;
  progress: number;
}

const CHALLENGE_POOL: LivenessChallenge[] = [
  { kind: 'blink', count: 2 },
  { kind: 'turn', direction: 'left' },
  { kind: 'turn', direction: 'right' },
  { kind: 'look-up' },
];

function isChallengeEqual(a?: LivenessChallenge, b?: LivenessChallenge): boolean {
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === 'blink' && b.kind === 'blink') return a.count === b.count;
  if (a.kind === 'turn' && b.kind === 'turn') return a.direction === b.direction;
  return true;
}

export function createChallengeManager(options: ChallengeManagerOptions = {}) {
  const maxRetries = options.maxRetries ?? 2;
  const timeoutMs = options.timeoutMs ?? 8000;
  const rand = options.randomFn ?? Math.random;

  let currentChallenge: LivenessChallenge = CHALLENGE_POOL[0];
  let retriesCount = 0;
  let elapsedMs = 0;

  // Trackers
  let blinkDetector = createBlinkDetector();
  let completedBlinks = 0;

  function pickNext(previous?: LivenessChallenge): LivenessChallenge {
    const candidates = CHALLENGE_POOL.filter((c) => !isChallengeEqual(c, previous));
    const index = Math.floor(rand() * candidates.length);
    const chosen = candidates[index] ?? CHALLENGE_POOL[0];
    setChallenge(chosen);
    return chosen;
  }

  function setChallenge(challenge: LivenessChallenge): void {
    currentChallenge = challenge;
    elapsedMs = 0;
    completedBlinks = 0;
    blinkDetector.reset();
  }

  function update(
    signals: FrameSignals,
    dtMs: number,
    calibration?: Calibration
  ): ChallengeProgress {
    elapsedMs += dtMs;

    if (!signals.faceFound) {
      return { isComplete: false, progress: 0 };
    }

    if (currentChallenge.kind === 'blink') {
      const res = blinkDetector.update(signals.eyesOpen, dtMs);
      if (res.blinkDetected) {
        completedBlinks += 1;
      }
      const progress = Math.min(1.0, completedBlinks / currentChallenge.count);
      return {
        isComplete: completedBlinks >= currentChallenge.count,
        progress,
      };
    }

    if (currentChallenge.kind === 'turn') {
      const head = checkHeadTurn(signals.yaw, signals.pitch, calibration, 20.0);
      const isComplete = head.turned && head.direction === currentChallenge.direction;
      const progress = Math.min(1.0, head.deltaAngle / 20.0);
      return {
        isComplete,
        progress: isComplete ? 1.0 : progress,
      };
    }

    if (currentChallenge.kind === 'look-up') {
      const head = checkHeadTurn(signals.yaw, signals.pitch, calibration, 20.0);
      const isComplete = head.turned && head.direction === 'up';
      const progress = Math.min(1.0, head.deltaAngle / 20.0);
      return {
        isComplete,
        progress: isComplete ? 1.0 : progress,
      };
    }

    return { isComplete: false, progress: 0 };
  }

  return {
    pickNext,
    setChallenge,
    update,
    canRetry(): boolean {
      return retriesCount < maxRetries;
    },
    recordRetry(): void {
      retriesCount += 1;
      elapsedMs = 0;
      completedBlinks = 0;
      blinkDetector.reset();
    },
    getRetriesCount(): number {
      return retriesCount;
    },
    getElapsedMs(): number {
      return elapsedMs;
    },
    isTimedOut(): boolean {
      return elapsedMs >= timeoutMs;
    },
    getCurrentChallenge(): LivenessChallenge {
      return currentChallenge;
    },
    reset(): void {
      retriesCount = 0;
      elapsedMs = 0;
      completedBlinks = 0;
      blinkDetector.reset();
    },
  };
}
