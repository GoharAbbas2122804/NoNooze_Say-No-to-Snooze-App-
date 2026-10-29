import { checkHeadTurn } from '../../../src/wake/logic/headTurn';
import { Calibration } from '../../../src/wake/contract';

describe('checkHeadTurn', () => {
  const mockCalibration: Calibration = {
    openBaseline: 0.85,
    closedBaseline: 0.15,
    yawNeutral: 0.0,
    pitchNeutral: -5.0,
    createdAt: Date.now(),
  };

  it('detects a left turn when yaw exceeds threshold relative to neutral', () => {
    // In Euler coords, left turn increases yaw
    const result = checkHeadTurn(25.0, -5.0, mockCalibration, 20.0);
    expect(result.turned).toBe(true);
    expect(result.direction).toBe('left');
    expect(result.deltaAngle).toBe(25.0);
  });

  it('detects a right turn when yaw decreases below negative threshold relative to neutral', () => {
    const result = checkHeadTurn(-24.0, -5.0, mockCalibration, 20.0);
    expect(result.turned).toBe(true);
    expect(result.direction).toBe('right');
    expect(result.deltaAngle).toBe(24.0);
  });

  it('detects look-up when pitch crosses threshold relative to pitch neutral', () => {
    // Neutral is -5.0. Pitch moves to +18.0 -> delta is +23.0 deg
    const result = checkHeadTurn(2.0, 18.0, mockCalibration, 20.0);
    expect(result.turned).toBe(true);
    expect(result.direction).toBe('up');
    expect(result.deltaAngle).toBe(23.0);
  });

  it('returns false when head orientation remains within neutral envelope', () => {
    const result = checkHeadTurn(5.0, -8.0, mockCalibration, 20.0);
    expect(result.turned).toBe(false);
    expect(result.direction).toBeUndefined();
  });

  it('handles default neutral if calibration is omitted', () => {
    const result = checkHeadTurn(22.0, 0.0, undefined, 20.0);
    expect(result.turned).toBe(true);
    expect(result.direction).toBe('left');
  });
});
