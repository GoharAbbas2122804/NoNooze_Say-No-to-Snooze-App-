import { Calibration } from '../contract';

export interface HeadTurnResult {
  turned: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  deltaAngle: number;
}

export function checkHeadTurn(
  yaw: number,
  pitch: number,
  calibration?: Calibration,
  thresholdDeg: number = 20.0
): HeadTurnResult {
  const yawNeutral = calibration?.yawNeutral ?? 0.0;
  const pitchNeutral = calibration?.pitchNeutral ?? 0.0;

  const deltaYaw = yaw - yawNeutral;
  const deltaPitch = pitch - pitchNeutral;

  // Check yaw (horizontal turn) first
  if (deltaYaw >= thresholdDeg) {
    return {
      turned: true,
      direction: 'left',
      deltaAngle: Math.abs(deltaYaw),
    };
  }

  if (deltaYaw <= -thresholdDeg) {
    return {
      turned: true,
      direction: 'right',
      deltaAngle: Math.abs(deltaYaw),
    };
  }

  // Check pitch (vertical movement, e.g. look up)
  if (deltaPitch >= thresholdDeg) {
    return {
      turned: true,
      direction: 'up',
      deltaAngle: Math.abs(deltaPitch),
    };
  }

  if (deltaPitch <= -thresholdDeg) {
    return {
      turned: true,
      direction: 'down',
      deltaAngle: Math.abs(deltaPitch),
    };
  }

  return {
    turned: false,
    deltaAngle: Math.max(Math.abs(deltaYaw), Math.abs(deltaPitch)),
  };
}
