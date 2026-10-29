import {
  WakeCheckEngine,
  WakeCheckConfig,
  WakeCheckState,
  Calibration,
  FrameSignals,
} from './contract';
import { createWakeStateMachine } from './logic/stateMachine';
import { createCalibrationTracker } from './logic/calibration';

export class DefaultWakeCheckEngine implements WakeCheckEngine {
  private config: WakeCheckConfig = {
    holdMs: 2000,
    sensitivity: 'standard',
    liveness: true,
    livenessTimeoutMs: 8000,
    fillLight: false,
  };

  private state: WakeCheckState = {
    phase: 'idle',
    progress: 0,
    checks: {
      eyesOpen: { ok: false, heldMs: 0, targetMs: 2000 },
      upright: { ok: false },
      liveness: { ok: false },
      lighting: { ok: true, level: 'ok' },
    },
    alertness: 0,
  };

  private subscribers: Set<(s: WakeCheckState) => void> = new Set();
  private stateMachine?: ReturnType<typeof createWakeStateMachine>;
  private calibrationTracker?: ReturnType<typeof createCalibrationTracker>;
  private calibrationResolver?: (calib: Calibration) => void;
  private savedCalibration?: Calibration;

  constructor() {}

  public async start(cfg: WakeCheckConfig): Promise<void> {
    this.config = cfg;
    this.stateMachine = createWakeStateMachine(this.config, {
      calibration: this.savedCalibration,
    });
    this.state = this.stateMachine.getState();
    this.notifySubscribers();
  }

  public async stop(): Promise<void> {
    this.state = {
      ...this.state,
      phase: 'idle',
      progress: 0,
    };
    this.stateMachine = undefined;
    this.calibrationTracker = undefined;
    this.calibrationResolver = undefined;
    this.notifySubscribers();
  }

  public subscribe(cb: (s: WakeCheckState) => void): () => void {
    this.subscribers.add(cb);
    cb(this.state);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  public async calibrate(): Promise<Calibration> {
    this.calibrationTracker = createCalibrationTracker();
    this.state = {
      ...this.state,
      phase: 'calibrating',
      progress: 0,
    };
    this.notifySubscribers();

    return new Promise<Calibration>((resolve) => {
      this.calibrationResolver = (calib: Calibration) => {
        this.savedCalibration = calib;
        this.state = {
          ...this.state,
          phase: 'idle',
          progress: 1.0,
        };
        this.notifySubscribers();
        resolve(calib);
      };
    });
  }

  public getState(): WakeCheckState {
    return this.state;
  }

  public feedFrame(signals: FrameSignals): void {
    if (this.state.phase === 'calibrating' && this.calibrationTracker) {
      const res = this.calibrationTracker.update(signals, 500);
      this.state = {
        ...this.state,
        phase: 'calibrating',
        progress: res.progress,
        signals,
      };
      this.notifySubscribers();

      if (res.isComplete && res.calibration && this.calibrationResolver) {
        this.calibrationResolver(res.calibration);
        this.calibrationResolver = undefined;
        this.calibrationTracker = undefined;
      }
      return;
    }

    if (!this.stateMachine) return;

    this.state = this.stateMachine.handleFrame(signals);
    this.notifySubscribers();
  }

  public reportError(reason: WakeCheckState['failureReason']): void {
    if (this.stateMachine) {
      this.state = this.stateMachine.triggerError(reason);
    } else {
      this.state = {
        ...this.state,
        phase: 'fallback',
        failureReason: reason,
      };
    }
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    for (const sub of this.subscribers) {
      try {
        sub(this.state);
      } catch (e) {
        console.error('Subscriber callback threw error', e);
      }
    }
  }
}
