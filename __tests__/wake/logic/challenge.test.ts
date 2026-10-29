import { createChallengeManager } from '../../../src/wake/logic/challenge';
import { LivenessChallenge, FrameSignals } from '../../../src/wake/contract';

function makeFrameSignals(overrides: Partial<FrameSignals> = {}): FrameSignals {
  return {
    t: 1000,
    faceFound: true,
    leftEyeOpen: 0.8,
    rightEyeOpen: 0.8,
    eyesOpen: 0.8,
    yaw: 0,
    pitch: 0,
    roll: 0,
    upright: 1.0,
    brightness: 0.7,
    faceBox: { x: 0.2, y: 0.2, w: 0.6, h: 0.6 },
    latencyMs: 15,
    source: { mlkit: 0.8, ear: 0.8, cnn: 0.8, fused: 0.8 },
    ...overrides,
  };
}

describe('createChallengeManager', () => {
  it('picks a random challenge and prevents immediate repetition', () => {
    const manager = createChallengeManager();
    const first = manager.pickNext();
    expect(['blink', 'turn', 'look-up']).toContain(first.kind);

    // Pick 20 consecutive challenges, verify no adjacent identical challenges
    let prev = first;
    for (let i = 0; i < 20; i++) {
      const next = manager.pickNext(prev);
      expect(JSON.stringify(next)).not.toEqual(JSON.stringify(prev));
      prev = next;
    }
  });

  it('verifies a blink challenge (e.g. 2 blinks)', () => {
    const manager = createChallengeManager();
    const challenge: LivenessChallenge = { kind: 'blink', count: 2 };
    manager.setChallenge(challenge);

    // Start with eyes open
    expect(manager.update(makeFrameSignals({ eyesOpen: 0.8 }), 50).isComplete).toBe(false);

    // Blink 1
    manager.update(makeFrameSignals({ eyesOpen: 0.1 }), 150);
    manager.update(makeFrameSignals({ eyesOpen: 0.8 }), 50);

    // Pause
    manager.update(makeFrameSignals({ eyesOpen: 0.8 }), 200);

    // Blink 2
    manager.update(makeFrameSignals({ eyesOpen: 0.1 }), 150);
    const completed = manager.update(makeFrameSignals({ eyesOpen: 0.8 }), 50);

    expect(completed.isComplete).toBe(true);
  });

  it('verifies a turn challenge (e.g. turn left)', () => {
    const manager = createChallengeManager();
    const challenge: LivenessChallenge = { kind: 'turn', direction: 'left' };
    manager.setChallenge(challenge);

    // Initial neutral
    expect(manager.update(makeFrameSignals({ yaw: 0 }), 100).isComplete).toBe(false);

    // Turned left (yaw >= 20 deg)
    const result = manager.update(makeFrameSignals({ yaw: 24 }), 100);
    expect(result.isComplete).toBe(true);
  });

  it('verifies a look-up challenge', () => {
    const manager = createChallengeManager();
    const challenge: LivenessChallenge = { kind: 'look-up' };
    manager.setChallenge(challenge);

    // Neutral pitch
    expect(manager.update(makeFrameSignals({ pitch: 0 }), 100).isComplete).toBe(false);

    // Looked up (pitch >= 20 deg)
    const result = manager.update(makeFrameSignals({ pitch: 22 }), 100);
    expect(result.isComplete).toBe(true);
  });

  it('enforces maximum 2 retries and timeout tracking', () => {
    const manager = createChallengeManager({ maxRetries: 2, timeoutMs: 5000 });
    manager.setChallenge({ kind: 'look-up' });

    expect(manager.canRetry()).toBe(true);
    expect(manager.getRetriesCount()).toBe(0);

    // Fail 1
    manager.recordRetry();
    expect(manager.getRetriesCount()).toBe(1);
    expect(manager.canRetry()).toBe(true);

    // Fail 2
    manager.recordRetry();
    expect(manager.getRetriesCount()).toBe(2);
    expect(manager.canRetry()).toBe(false);
  });
});
