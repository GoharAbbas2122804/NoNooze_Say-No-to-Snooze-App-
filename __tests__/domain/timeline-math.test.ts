import {
  calculateTickPosition,
  generateTimelineTicks,
} from '../../src/components/alarm/AlarmTimeline';

describe('AlarmTimeline layout math', () => {
  it('calculates tick position proportionally across timeline width', () => {
    // 00:00 (0 mins) -> 0px
    expect(calculateTickPosition(0, 1440, 720)).toBe(0);

    // 12:00 (720 mins / half day) -> 360px
    expect(calculateTickPosition(720, 1440, 720)).toBe(360);

    // 24:00 (1440 mins) -> 720px
    expect(calculateTickPosition(1440, 1440, 720)).toBe(720);
  });

  it('clamps values out of bounds', () => {
    expect(calculateTickPosition(-50, 1440, 720)).toBe(0);
    expect(calculateTickPosition(2000, 1440, 720)).toBe(720);
  });

  it('generates the expected number of 30-min ticks for 24 hours', () => {
    const ticks = generateTimelineTicks(30, 24);
    // 24 * 2 + 1 (for 0 to 1440 inclusive) = 49 ticks
    expect(ticks.length).toBe(49);
    expect(ticks[0].minute).toBe(0);
    expect(ticks[ticks.length - 1].minute).toBe(1440);
  });

  it('marks hours and quarters accurately', () => {
    const ticks = generateTimelineTicks(30, 24);
    const zeroHour = ticks.find((t) => t.minute === 0);
    expect(zeroHour?.isHour).toBe(true);
    expect(zeroHour?.isQuarter).toBe(true);

    const halfHour = ticks.find((t) => t.minute === 30);
    expect(halfHour?.isHour).toBe(false);

    const sixHours = ticks.find((t) => t.minute === 360);
    expect(sixHours?.isHour).toBe(true);
    expect(sixHours?.isQuarter).toBe(true);
  });
});
