import { createBlinkDetector } from '../../../src/wake/logic/blink';

describe('createBlinkDetector', () => {
  it('detects a valid blink event with duration between 80 ms and 500 ms', () => {
    const detector = createBlinkDetector();

    // Eyes open initially (prob >= 0.6)
    expect(detector.update(0.85, 50).blinkDetected).toBe(false);
    expect(detector.update(0.85, 50).blinkDetected).toBe(false);

    // Eyes dip (prob <= 0.35) for 200 ms
    expect(detector.update(0.2, 100).blinkDetected).toBe(false);
    expect(detector.update(0.15, 100).blinkDetected).toBe(false);

    // Eyes reopen (prob >= 0.6)
    const result = detector.update(0.85, 50);
    expect(result.blinkDetected).toBe(true);
    expect(result.blinkDurationMs).toBe(200);
  });

  it('ignores ultra-short jitter (< 80 ms)', () => {
    const detector = createBlinkDetector({ minDipMs: 80, maxDipMs: 500 });
    detector.update(0.9, 100);

    // Single frame dip of 30 ms (shorter than min 80 ms)
    detector.update(0.1, 30);
    const result = detector.update(0.9, 50);

    expect(result.blinkDetected).toBe(false);
  });

  it('ignores prolonged eye closure (> 500 ms, i.e. sleeping or dozing)', () => {
    const detector = createBlinkDetector({ minDipMs: 80, maxDipMs: 500 });
    detector.update(0.9, 100);

    // Eyes closed for 600 ms (> 500 ms)
    detector.update(0.1, 300);
    detector.update(0.1, 300);

    // Reopened
    const result = detector.update(0.85, 50);
    expect(result.blinkDetected).toBe(false);
  });

  it('correctly tracks sequential blinks', () => {
    const detector = createBlinkDetector();
    let blinkCount = 0;

    // Open
    detector.update(0.8, 100);

    // Blink 1 (150 ms)
    detector.update(0.1, 150);
    if (detector.update(0.8, 50).blinkDetected) blinkCount++;

    // Open pause 300 ms
    detector.update(0.8, 300);

    // Blink 2 (200 ms)
    detector.update(0.1, 200);
    if (detector.update(0.8, 50).blinkDetected) blinkCount++;

    expect(blinkCount).toBe(2);
  });
});
