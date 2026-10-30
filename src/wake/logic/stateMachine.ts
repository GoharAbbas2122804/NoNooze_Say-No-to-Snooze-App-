import {
  WakePhase,
  Hint,
  LivenessChallenge,
  FrameSignals,
  WakeCheckConfig,
  Calibration,
  WakeCheckState,
} from '../contract';
import { createSignalSmoother } from './smoothing';
import { createHoldTracker } from './hold';
import { createChallengeManager } from './challenge';
import { computeAlertnessHeuristic } from './alertness';

export interface StateMachineOptions {
  clock?: () => number;
  calibration?: Calibration;
}

export function createWakeStateMachine(
  config: WakeCheckConfig,
  options: StateMachineOptions = {}
) {
  const clock = options.clock ?? (() => Date.now());
  const calibration = options.calibration;

  let phase: WakePhase = 'searching';
  let failureReason: WakeCheckState['failureReason'];
  let lastFrameTime: number = 0;
  let firstNoFaceTime: number | null = null;
  let firstTooDarkTime: number | null = null;

  const smoother = createSignalSmoother(config.sensitivity);
  const holdTracker = createHoldTracker(config.holdMs);
  const challengeManager = createChallengeManager({
    timeoutMs: config.livenessTimeoutMs,
  });

  let activeChallenge: LivenessChallenge | undefined;
  if (config.liveness) {
    activeChallenge = challengeManager.pickNext();
  }

  function computeHint(signals: FrameSignals): Hint | undefined {
    if (!signals.faceFound) return 'no-face';
    if (signals.brightness < 0.12) return 'too-dark';
    if (signals.brightness > 0.92) return 'too-bright';
    if (signals.faceBox.w < 0.22 || signals.faceBox.h < 0.22) return 'move-closer';
    if (signals.faceBox.w > 0.85 || signals.faceBox.h > 0.85) return 'move-back';
    if (signals.upright < 0.5) return 'sit-up';
    if (phase === 'verifying' && signals.eyesOpen < 0.6) return 'eyes-closed';
    if (phase === 'verifying' && (Math.abs(signals.yaw) > 18 || Math.abs(signals.pitch) > 18)) {
      return 'look-at-camera';
    }
    return 'hold-still';
  }

  function computeLightingLevel(brightness: number): 'dark' | 'dim' | 'ok' | 'bright' {
    if (brightness < 0.15) return 'dark';
    if (brightness < 0.35) return 'dim';
    if (brightness > 0.85) return 'bright';
    return 'ok';
  }

  let latestSignals: FrameSignals | undefined;
  let latestAlertness: number = 0;
  let latestHoldMs: number = 0;
  let isHoldMet: boolean = false;
  let isChallengeMet: boolean = !config.liveness;

  function getState(): WakeCheckState {
    const isLightingOk = latestSignals ? latestSignals.brightness >= 0.15 : true;
    const isUprightOk = latestSignals ? latestSignals.upright >= 0.5 : false;

    let overallProgress = 0;
    if (phase === 'success') {
      overallProgress = 1.0;
    } else if (phase === 'verifying') {
      const holdRatio = Math.min(1.0, latestHoldMs / config.holdMs);
      overallProgress = config.liveness ? holdRatio * 0.6 : holdRatio;
    } else if (phase === 'challenge') {
      overallProgress = 0.6 + 0.4 * (isChallengeMet ? 1.0 : 0.5);
    }

    return {
      phase,
      progress: overallProgress,
      hint: latestSignals ? computeHint(latestSignals) : undefined,
      checks: {
        eyesOpen: {
          ok: isHoldMet,
          heldMs: latestHoldMs,
          targetMs: config.holdMs,
        },
        upright: {
          ok: isUprightOk,
        },
        liveness: {
          ok: isChallengeMet,
          challenge: activeChallenge,
          remainingMs: config.liveness
            ? Math.max(0, config.livenessTimeoutMs - challengeManager.getElapsedMs())
            : undefined,
        },
        lighting: {
          ok: isLightingOk,
          level: latestSignals ? computeLightingLevel(latestSignals.brightness) : 'ok',
        },
      },
      alertness: latestAlertness,
      signals: latestSignals,
      failureReason,
    };
  }

  function handleFrame(signals: FrameSignals): WakeCheckState {
    if (phase === 'success' || phase === 'failed' || phase === 'fallback') {
      return getState();
    }

    const now = signals.t !== undefined ? signals.t : clock();
    if (lastFrameTime === 0) {
      lastFrameTime = now;
    }
    const dtMs = Math.max(1, now - lastFrameTime);
    lastFrameTime = now;
    latestSignals = signals;

    // 1. Safety Checks: prolonged darkness (> 10s)
    if (signals.brightness < 0.12) {
      if (firstTooDarkTime === null) firstTooDarkTime = now;
      if (now - firstTooDarkTime >= 10000) {
        phase = 'fallback';
        failureReason = 'too-dark';
        return getState();
      }
    } else {
      firstTooDarkTime = null;
    }

    // 2. Safety Checks: prolonged missing face (> 20s)
    if (!signals.faceFound) {
      if (firstNoFaceTime === null) firstNoFaceTime = now;
      if (now - firstNoFaceTime >= 20000) {
        phase = 'fallback';
        failureReason = 'timeout';
        return getState();
      }
    } else {
      firstNoFaceTime = null;
    }

    // 3. Signal Smoothing
    const smoothResult = smoother.update(signals.eyesOpen);
    const isUpright = signals.upright >= 0.5;

    // 4. Alertness Heuristic
    latestAlertness = computeAlertnessHeuristic({
      eyesOpenRatio: smoothResult.smoothed,
      blinkRatePerMin: 18, // baseline estimation
      headMovementScore: Math.min(1.0, (Math.abs(signals.yaw) + Math.abs(signals.pitch)) / 30.0),
      livenessSpeedScore: 0.8,
      uprightScore: signals.upright,
    });

    // 5. Phase Transitions
    if (phase === 'searching') {
      if (signals.faceFound && isUpright) {
        phase = 'verifying';
      }
    }

    if (phase === 'verifying') {
      const holdState = holdTracker.update(smoothResult.isOpen, isUpright, signals.faceFound, dtMs);
      latestHoldMs = holdState.heldMs;
      isHoldMet = holdState.isMet;

      if (isHoldMet) {
        if (config.liveness && activeChallenge) {
          phase = 'challenge';
        } else {
          phase = 'success';
        }
      }
    } else if (phase === 'challenge') {
      if (activeChallenge) {
        const chalState = challengeManager.update(signals, dtMs, calibration);
        if (chalState.isComplete) {
          isChallengeMet = true;
          phase = 'success';
        } else if (challengeManager.isTimedOut()) {
          if (challengeManager.canRetry()) {
            challengeManager.recordRetry();
            activeChallenge = challengeManager.pickNext(activeChallenge);
          } else {
            phase = 'fallback';
            failureReason = 'timeout';
          }
        }
      }
    }

    return getState();
  }

  function triggerError(reason: WakeCheckState['failureReason']): WakeCheckState {
    phase = 'fallback';
    failureReason = reason;
    return getState();
  }

  function triggerTimeout(): WakeCheckState {
    phase = 'fallback';
    failureReason = 'timeout';
    return getState();
  }

  return {
    handleFrame,
    triggerError,
    triggerTimeout,
    getState,
  };
}
