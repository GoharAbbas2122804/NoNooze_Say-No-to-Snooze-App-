import React, { useState, useEffect } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

export type WakePhase = 'idle'|'permission'|'setup'|'calibrating'|'searching'|'verifying'|'challenge'|'success'|'failed'|'fallback';
export type Hint = 'no-face'|'too-dark'|'too-bright'|'move-closer'|'move-back'|'look-at-camera'|'sit-up'|'hold-still';
export type LivenessChallenge = { kind:'blink'; count:number } | { kind:'turn'; direction:'left'|'right' } | { kind:'look-up' };
export interface FrameSignals {
  t:number; faceFound:boolean;
  leftEyeOpen:number; rightEyeOpen:number; eyesOpen:number;      // 0..1, eyesOpen = fused
  yaw:number; pitch:number; roll:number;                          // degrees
  upright:number;                                                 // 0..1 heuristic (v1)
  brightness:number;                                              // 0..1
  faceBox:{x:number;y:number;w:number;h:number};                  // normalized 0..1
  latencyMs:number;
  source:Record<string,number>;                                   // per-model eyesOpen: mlkit, ear, cnn, fused
}
export interface WakeCheckConfig { holdMs:number; sensitivity:'relaxed'|'standard'|'strict'; liveness:boolean; livenessTimeoutMs:number; fillLight:boolean }
export interface Calibration { openBaseline:number; closedBaseline:number; yawNeutral:number; pitchNeutral:number; createdAt:number }
export interface WakeCheckState {
  phase:WakePhase; progress:number;                               // overall 0..1
  hint?:Hint;
  checks:{
    eyesOpen:{ok:boolean; heldMs:number; targetMs:number};
    upright:{ok:boolean};
    liveness:{ok:boolean; challenge?:LivenessChallenge; remainingMs?:number};
    lighting:{ok:boolean; level:'dark'|'dim'|'ok'|'bright'};
  };
  alertness:number;                                               // 0..100, heuristic (not clinical)
  signals?:FrameSignals;
  failureReason?:'timeout'|'camera-error'|'permission-denied'|'model-error'|'too-dark';
}
export interface WakeCheckEngine {
  start(cfg:WakeCheckConfig):Promise<void>; stop():Promise<void>;
  subscribe(cb:(s:WakeCheckState)=>void):()=>void;
  calibrate():Promise<Calibration>; getState():WakeCheckState;
}

export function useWakeCheck(engine: WakeCheckEngine) {
  const [state, setState] = useState<WakeCheckState>(() => engine.getState());

  useEffect(() => {
    setState(engine.getState());
    const unsubscribe = engine.subscribe((next) => {
      setState(next);
    });
    return () => {
      unsubscribe();
    };
  }, [engine]);

  return state;
}

export interface WakeCameraPreviewProps {
  engine: WakeCheckEngine;
  style?: StyleProp<ViewStyle>;
}

export const WakeCameraPreview: React.FC<WakeCameraPreviewProps> = ({ style }) => {
  return React.createElement(View, { style, testID: 'wake-camera-preview-container' });
};
