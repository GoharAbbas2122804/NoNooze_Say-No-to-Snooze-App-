import { createHoldTracker } from '../../../src/wake/logic/hold';

describe('createHoldTracker', () => {
  it('accumulates held time when eyes open, upright, and face found', () => {
    const tracker = createHoldTracker(2000); // 2000 ms target
    let state = tracker.update(true, true, true, 500);
    expect(state.heldMs).toBe(500);
    expect(state.isMet).toBe(false);

    state = tracker.update(true, true, true, 1500);
    expect(state.heldMs).toBe(2000);
    expect(state.isMet).toBe(true);
  });

  it('does not accumulate held time if face not found or not upright', () => {
    const tracker = createHoldTracker(2000);
    let state = tracker.update(true, false, true, 500); // not upright
    expect(state.heldMs).toBe(0);

    state = tracker.update(true, true, false, 500); // face not found
    expect(state.heldMs).toBe(0);
  });

  it('tolerates a natural blink (eyes closed <= 400 ms) without resetting held time', () => {
    const tracker = createHoldTracker(2000, 400);
    // Accumulate 1000 ms
    tracker.update(true, true, true, 1000);

    // Natural blink: closed for 150 ms, then another 150 ms (total 300 ms <= 400 ms)
    let blinkState = tracker.update(false, true, true, 150);
    expect(blinkState.heldMs).toBe(1000);
    expect(blinkState.isBlinking).toBe(true);

    blinkState = tracker.update(false, true, true, 150);
    expect(blinkState.heldMs).toBe(1000);

    // Eyes open again: should resume accumulating from 1000 ms
    const resumed = tracker.update(true, true, true, 500);
    expect(resumed.heldMs).toBe(1500);
    expect(resumed.isBlinking).toBe(false);
  });

  it('resets held time if eyes closed for longer than 400 ms', () => {
    const tracker = createHoldTracker(2000, 400);
    tracker.update(true, true, true, 1200);

    // Closed for 250 ms
    tracker.update(false, true, true, 250);
    // Closed for another 200 ms (total 450 ms > 400 ms grace period)
    const resetState = tracker.update(false, true, true, 200);

    expect(resetState.heldMs).toBe(0);
    expect(resetState.isBlinking).toBe(false);

    // Opening eyes starts accumulation from zero
    const fresh = tracker.update(true, true, true, 300);
    expect(fresh.heldMs).toBe(300);
  });

  it('resets held time if face disappears or user lies down for longer than grace period', () => {
    const tracker = createHoldTracker(2000, 400);
    tracker.update(true, true, true, 1000);

    // Lost face for 500 ms (> 400 ms)
    const state = tracker.update(true, true, false, 500);
    expect(state.heldMs).toBe(0);
  });
});
