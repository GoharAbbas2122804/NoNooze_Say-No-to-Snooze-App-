/**
 * FakeWakeCheckEngine — scripted implementation of WakeCheckEngine.
 * Seven scenarios drive WakeCheckState over time with realistic noise.
 * Use in Jest (fake timers) and the dev gallery. No camera, no ML.
 */
import {
  WakeCheckEngine,
  WakeCheckConfig,
  WakeCheckState,
  Calibration,
  FrameSignals,
  WakePhase,
  Hint,
} from '../contract';

export type FakeScenario =
  | 'happy-path'
  | 'dark-room'
  | 'no-face'
  | 'never-blinks'
  | 'permission-denied'
  | 'camera-error'
  | 'model-error';

interface ScenarioStep {
  /** ms from start of scenario at which this step fires */
  at: number;
  state: Partial<WakeCheckState> & { phase: WakePhase };
}

function makeSignals(overrides: Partial<FrameSignals> = {}): FrameSignals {
  return {
    t: Date.now(),
    faceFound: true,
    leftEyeOpen: 0.85 + (Math.random() - 0.5) * 0.08,
    rightEyeOpen: 0.83 + (Math.random() - 0.5) * 0.08,
    eyesOpen: 0.84 + (Math.random() - 0.5) * 0.06,
    yaw: (Math.random() - 0.5) * 4,
    pitch: (Math.random() - 0.5) * 3,
    roll: (Math.random() - 0.5) * 2,
    upright: 0.9,
    brightness: 0.6,
    faceBox: { x: 0.2, y: 0.15, w: 0.6, h: 0.7 },
    latencyMs: 30 + Math.random() * 20,
    source: { mlkit: 0.84, ear: 0.8, cnn: 0.87, fused: 0.84 },
    ...overrides,
  };
}

const SCENARIOS: Record<FakeScenario, ScenarioStep[]> = {
  'happy-path': [
    {
      at: 0,
      state: {
        phase: 'searching',
        progress: 0,
        hint: undefined,
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
        signals: makeSignals({ faceFound: false }),
      },
    },
    {
      at: 1500,
      state: {
        phase: 'verifying',
        progress: 0.1,
        checks: {
          eyesOpen: { ok: false, heldMs: 500, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 20,
        signals: makeSignals(),
      },
    },
    {
      at: 2500,
      state: {
        phase: 'verifying',
        progress: 0.3,
        checks: {
          eyesOpen: { ok: false, heldMs: 1500, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 40,
        signals: makeSignals(),
      },
    },
    {
      at: 3500,
      state: {
        phase: 'verifying',
        progress: 0.55,
        checks: {
          eyesOpen: { ok: false, heldMs: 2750, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 58,
        signals: makeSignals(),
      },
    },
    {
      at: 5000,
      state: {
        phase: 'challenge',
        progress: 0.7,
        checks: {
          eyesOpen: { ok: true, heldMs: 5000, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false, challenge: { kind: 'blink', count: 2 }, remainingMs: 5000 },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 65,
        signals: makeSignals(),
      },
    },
    {
      at: 7000,
      state: {
        phase: 'success',
        progress: 1,
        checks: {
          eyesOpen: { ok: true, heldMs: 5000, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: true },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 78,
        signals: makeSignals(),
      },
    },
  ],

  'dark-room': [
    {
      at: 0,
      state: {
        phase: 'searching',
        progress: 0,
        hint: 'too-dark' as Hint,
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: false, level: 'dark' },
        },
        alertness: 0,
        signals: makeSignals({ brightness: 0.05, faceFound: false }),
      },
    },
    {
      at: 3000,
      state: {
        phase: 'searching',
        progress: 0.05,
        hint: 'too-dark' as Hint,
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: false, level: 'dim' },
        },
        alertness: 0,
        signals: makeSignals({ brightness: 0.12 }),
      },
    },
    {
      at: 5500,
      state: {
        phase: 'verifying',
        progress: 0.2,
        hint: undefined,
        checks: {
          eyesOpen: { ok: false, heldMs: 800, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 22,
        signals: makeSignals({ brightness: 0.65 }),
      },
    },
    {
      at: 9000,
      state: {
        phase: 'success',
        progress: 1,
        checks: {
          eyesOpen: { ok: true, heldMs: 5000, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: true },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 71,
        signals: makeSignals({ brightness: 0.65 }),
      },
    },
  ],

  'no-face': [
    {
      at: 0,
      state: {
        phase: 'searching',
        progress: 0,
        hint: 'no-face' as Hint,
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
        signals: makeSignals({ faceFound: false }),
      },
    },
    {
      at: 4000,
      state: {
        phase: 'searching',
        progress: 0,
        hint: 'look-at-camera' as Hint,
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
        signals: makeSignals({ faceFound: false }),
      },
    },
    {
      at: 10000,
      state: {
        phase: 'fallback',
        progress: 0,
        failureReason: 'timeout',
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
        signals: makeSignals({ faceFound: false }),
      },
    },
  ],

  'never-blinks': [
    {
      at: 0,
      state: {
        phase: 'verifying',
        progress: 0.5,
        checks: {
          eyesOpen: { ok: false, heldMs: 2500, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 35,
        signals: makeSignals(),
      },
    },
    {
      at: 2500,
      state: {
        phase: 'challenge',
        progress: 0.65,
        checks: {
          eyesOpen: { ok: true, heldMs: 5000, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false, challenge: { kind: 'blink', count: 2 }, remainingMs: 5000 },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 50,
        signals: makeSignals(),
      },
    },
    // Retry 1
    {
      at: 7500,
      state: {
        phase: 'challenge',
        progress: 0.65,
        checks: {
          eyesOpen: { ok: true, heldMs: 5000, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false, challenge: { kind: 'turn', direction: 'left' }, remainingMs: 5000 },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 50,
        signals: makeSignals(),
      },
    },
    // Retry 2
    {
      at: 13000,
      state: {
        phase: 'challenge',
        progress: 0.65,
        checks: {
          eyesOpen: { ok: true, heldMs: 5000, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false, challenge: { kind: 'look-up' }, remainingMs: 3000 },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 50,
        signals: makeSignals(),
      },
    },
    {
      at: 16500,
      state: {
        phase: 'fallback',
        progress: 0.65,
        failureReason: 'timeout',
        checks: {
          eyesOpen: { ok: true, heldMs: 5000, targetMs: 5000 },
          upright: { ok: true },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 50,
        signals: makeSignals(),
      },
    },
  ],

  'permission-denied': [
    {
      at: 0,
      state: {
        phase: 'permission',
        progress: 0,
        failureReason: 'permission-denied',
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
      },
    },
  ],

  'camera-error': [
    {
      at: 0,
      state: {
        phase: 'searching',
        progress: 0,
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
      },
    },
    {
      at: 1000,
      state: {
        phase: 'fallback',
        progress: 0,
        failureReason: 'camera-error',
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
      },
    },
  ],

  'model-error': [
    {
      at: 0,
      state: {
        phase: 'searching',
        progress: 0,
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
      },
    },
    {
      at: 2000,
      state: {
        phase: 'fallback',
        progress: 0,
        failureReason: 'model-error',
        checks: {
          eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
          upright: { ok: false },
          liveness: { ok: false },
          lighting: { ok: true, level: 'ok' },
        },
        alertness: 0,
      },
    },
  ],
};

const IDLE_STATE: WakeCheckState = {
  phase: 'idle',
  progress: 0,
  checks: {
    eyesOpen: { ok: false, heldMs: 0, targetMs: 5000 },
    upright: { ok: false },
    liveness: { ok: false },
    lighting: { ok: true, level: 'ok' },
  },
  alertness: 0,
};

export class FakeWakeCheckEngine implements WakeCheckEngine {
  private state: WakeCheckState = { ...IDLE_STATE };
  private subscribers: Set<(s: WakeCheckState) => void> = new Set();
  private timer: ReturnType<typeof setInterval> | null = null;
  private startMs = 0;
  private stepIndex = 0;
  private steps: ScenarioStep[] = [];
  /** Speed multiplier: set >1 in tests to fast-forward */
  public speedMultiplier = 1;

  constructor(public scenario: FakeScenario = 'happy-path') {}

  async start(cfg: WakeCheckConfig): Promise<void> {
    this.steps = SCENARIOS[this.scenario];
    this.stepIndex = 0;
    this.startMs = Date.now();

    const holdMs = cfg.holdMs;
    // Patch targetMs into all steps so it reflects the config
    this.steps = this.steps.map((s) => {
      if (!s.state.checks) return s;
      return {
        ...s,
        state: {
          ...s.state,
          checks: {
            ...s.state.checks,
            eyesOpen: {
              ...s.state.checks.eyesOpen,
              targetMs: holdMs,
            },
          },
        } as Partial<WakeCheckState> & { phase: WakePhase },
      };
    });

    // Fire step 0 immediately if at=0
    if (this.steps[0]?.at === 0) {
      this.state = { ...IDLE_STATE, ...this.steps[0].state };
      this.stepIndex = 1;
      this.notify();
    }

    this.timer = setInterval(() => this.tick(), 100 / this.speedMultiplier);
  }

  async stop(): Promise<void> {
    this.clear();
    this.state = { ...IDLE_STATE };
    this.notify();
  }

  subscribe(cb: (s: WakeCheckState) => void): () => void {
    this.subscribers.add(cb);
    cb(this.state);
    return () => this.subscribers.delete(cb);
  }

  async calibrate(): Promise<Calibration> {
    this.state = { ...this.state, phase: 'calibrating', progress: 0 };
    this.notify();
    return new Promise((resolve) => {
      let prog = 0;
      const t = setInterval(() => {
        prog += 0.2;
        this.state = { ...this.state, progress: Math.min(prog, 1) };
        this.notify();
        if (prog >= 1) {
          clearInterval(t);
          const calib: Calibration = {
            openBaseline: 0.82,
            closedBaseline: 0.15,
            yawNeutral: 0,
            pitchNeutral: 0,
            createdAt: Date.now(),
          };
          this.state = { ...this.state, phase: 'idle', progress: 1 };
          this.notify();
          resolve(calib);
        }
      }, 1000 / this.speedMultiplier);
    });
  }

  getState(): WakeCheckState {
    return this.state;
  }

  private tick() {
    if (this.stepIndex >= this.steps.length) return;
    const elapsed = (Date.now() - this.startMs) * this.speedMultiplier;
    const next = this.steps[this.stepIndex];
    if (elapsed >= next.at) {
      this.state = { ...IDLE_STATE, ...next.state };
      this.stepIndex++;
      this.notify();
    }
  }

  private notify() {
    const s = this.state;
    this.subscribers.forEach((cb) => {
      try { cb(s); } catch {}
    });
  }

  private clear() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
