import { calculateWheelArcOffset } from '../../src/components/alarm/WheelPicker';

describe('calculateWheelArcOffset math', () => {
  it('returns identity scale and full opacity for selected center item (delta 0)', () => {
    const center = calculateWheelArcOffset(0, true);
    expect(center.xOffset).toBe(0);
    expect(center.scale).toBe(1);
    expect(center.opacity).toBe(1);
  });

  it('curves outward to negative X for left column neighbors', () => {
    const leftAbove = calculateWheelArcOffset(-1, true);
    const leftBelow = calculateWheelArcOffset(1, true);

    expect(leftAbove.xOffset).toBeLessThan(0);
    expect(leftBelow.xOffset).toBeLessThan(0);
    expect(leftAbove.scale).toBeLessThan(1);
    expect(leftAbove.opacity).toBeLessThan(1);
  });

  it('curves outward to positive X for right column neighbors', () => {
    const rightAbove = calculateWheelArcOffset(-1, false);
    const rightBelow = calculateWheelArcOffset(1, false);

    expect(rightAbove.xOffset).toBeGreaterThan(0);
    expect(rightBelow.xOffset).toBeGreaterThan(0);
    expect(rightAbove.scale).toBeLessThan(1);
    expect(rightAbove.opacity).toBeLessThan(1);
  });

  it('clamps minimum scale and opacity for distant items', () => {
    const distant = calculateWheelArcOffset(10, true);
    expect(distant.scale).toBeGreaterThanOrEqual(0.65);
    expect(distant.opacity).toBeGreaterThanOrEqual(0.18);
  });
});
