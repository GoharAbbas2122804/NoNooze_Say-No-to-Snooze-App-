# Week 1 Foundation Design: NoNooze Alarm App

## 1. Intent & The Why
"NoNooze" is an Android-only alarm application designed for people who struggle with standard snooze-friendly alarms. Its core principle is uncompromising wakefulness: alarms cannot be dismissed without completing physical or cognitive challenges.
In Week 1, the goal is building a rock-solid, production-grade foundation:
1. **Unfailing Alarm Reliability**: Exact-minute wake up during Doze, screen off, app swiped away, and after device reboot.
2. **Dismissal Framework & Math Challenge**: Pure step-runner state machine and math generator.
3. **Data & UI**: Zustand + AsyncStorage persistence with Alarm List, Editor with step builder, Permission Onboarding, and Ringing/Success screens.
4. **Theme**: Design tokens extracted directly from design inspirations (deep slate/navy, glowing accents, lime/amber highlights).

---

## 2. Goals, Non-Goals, Anti-Goals

### Goals
- **100% Alarm Reliability**: Using Android `AlarmManager.setAlarmClock` + Foreground Service with full-screen intent over lock screen.
- **Resilient Audio**: Looping alarm sound on `STREAM_ALARM` / `AudioAttributes.USAGE_ALARM` that survives backgrounding and app-swipe until challenge completion.
- **Anti-Cheat / Watchdog**: If the app is killed while ringing with challenges incomplete, alarm re-rings within ~1 minute.
- **Composable Dismissal Registry**: `DismissMethod` registry supporting multiple steps (Math available; Pushups, Situps, Face marked "Coming Soon").
- **TDD Domain Architecture**: >= 80% test coverage on `src/domain/*` (next-trigger calculation, alarm validation, step runner, math problem generator, store actions).
- **Quality Gates**: Clean passes for TypeScript, ESLint, Expo Doctor, and Jest tests.

### Non-Goals (Week 1)
- Camera / ML / MediaPipe / TFLite pose detection (scheduled for Week 2).
- Pushup / situp sensor algorithms.
- iOS support (Android only).
- Production app store release and final asset polish.

### Anti-Goals
- Flaky alarms that rely solely on standard Expo Notifications or background fetch (which get suppressed by Android battery optimization and Doze).
- Silencing the alarm when the app is swiped away from Recents.
- Hardcoded design tokens or inline hex colors.

---

## 3. Constraints
- **Platform**: Android only.
- **Expo SDK**: Expo SDK 58 (`expo: ~58.0.19`, `react-native: 0.88.0`, `react: 19.3.0`).
- **Build Mode**: Expo Prebuild / Development Build (`expo-dev-client`). Continuous Native Generation (CNG) via `app.json` and custom config plugins; no manual edits to `android/`.
- **Application Name**: Single constant `APP_NAME = "NoNooze"`.
- **Package Installation**: Exclusively through `npx expo install <package>`.

---

## 4. Approaches & Architecture Tradeoffs

### A. Alarm Engine Strategy
- **Approach 1: `react-native-notify-kit`**:
  A maintained fork of Notifee with Expo dev build support and full-screen intent capabilities.
  *Tradeoff*: Fast to integrate, but may encounter native compilation or New Architecture bridging issues on Expo SDK 58 / React Native 0.88.
- **Approach 2: Local Kotlin Expo Module (`modules/alarm-engine`)**:
  Custom lightweight Expo module implementing Android's `AlarmManager.setAlarmClock()`, a `ForegroundService` with notification priority `PRIORITY_MAX`, looping audio on `AudioAttributes.USAGE_ALARM`, a `BroadcastReceiver` for reboot and exact alarms, and a full-screen intent launching `MainActivity`.
  *Tradeoff*: Requires Kotlin native code and custom config plugin, but offers 100% control over Doze mode, Android 14+ full-screen permissions, and audio stream guarantees.
- **Decision**: Timebox `react-native-notify-kit` spike to 1 hour. Decouple via `AlarmScheduler` interface:
  ```ts
  export interface AlarmScheduler {
    schedule(alarm: Alarm): Promise<void>;
    cancel(alarmId: string): Promise<void>;
    rescheduleAll(alarms: Alarm[]): Promise<void>;
    getPermissionStatus(): Promise<PermissionStatus>;
    requestPermissions(): Promise<PermissionStatus>;
    stopRinging(): Promise<void>;
  }
  ```
  If `react-native-notify-kit` does not compile cleanly on SDK 58 or fails full-screen lockscreen wakeup, immediately switch to the local Kotlin module.

### B. Audio Playback Strategy
- **Option 1: Pure JavaScript (`expo-audio`)**:
  Audio controlled in React runtime.
  *Risk*: If the user swipes away the app from Recents, the JS thread terminates, instantly silencing the alarm.
- **Option 2: Native Foreground Service Audio**:
  The Foreground Service starts Android `MediaPlayer` on `USAGE_ALARM` with a fallback alarm tone. JS communicates with the service to stop audio once the challenge is solved.
  *Decision*: Option 2. Native foreground audio ensures the alarm continues playing even if the activity or JS engine is destroyed.

### C. Failsafe Watchdog
- When an alarm fires, the native engine records `activeAlarmId` and sets a watchdog alarm 60 seconds into the future.
- If the app is killed while the challenge is incomplete, the watchdog triggers and re-rings the alarm.
- When the step runner reaches `completed`, it calls `AlarmScheduler.stopRinging()`, which clears the active state and cancels the watchdog.

---

## 5. Domain Models & State Management

### A. Core Types
```ts
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sun, 1 = Mon, ..., 6 = Sat

export type MethodId = 'math' | 'pushups' | 'situps' | 'face';

export type Step = {
  methodId: MethodId;
  target: number;
  options?: Record<string, unknown>;
};

export type Alarm = {
  id: string;
  time: string; // 'HH:mm' 24-hour format
  days: DayOfWeek[]; // Empty array = one-time alarm
  label: string;
  enabled: boolean;
  sound: string;
  steps: Step[];
};
```

### B. Validation Rules
- `steps.length >= 1`
- If `methodId === 'math'`: `target` between 1 and 10.
- If `methodId === 'pushups' | 'situps'`: `target` between 5 and 50.
- `time`: Valid 24-hour format (`/^([01]\d|2[0-3]):([0-5]\d)$/`).
- `label`: Max 30 chars.

### C. Trigger Calculation (`next-trigger.ts`)
- Pure function `getNextTriggerDate(alarm: Alarm, now: Date): Date`.
- If `days` is empty (one-time):
  - If today's HH:mm > now, trigger is today at HH:mm.
  - If today's HH:mm <= now, trigger is tomorrow at HH:mm.
- If `days` has values:
  - Find the next upcoming day in `days` matching the time.
  - Handles week wrap-around, DST boundaries, and timezone shifts.

### D. Step Runner State Machine (`step-runner.ts`)
```ts
export type StepRunnerState =
  | { status: 'idle' }
  | { status: 'running'; stepIndex: number; progress: number; totalSteps: number; currentStep: Step }
  | { status: 'completed' };

export type StepRunnerAction =
  | { type: 'START'; steps: Step[] }
  | { type: 'PROGRESS'; increment?: number }
  | { type: 'SKIP' } // testing only
  | { type: 'RESET' };

export function stepRunnerReducer(state: StepRunnerState, action: StepRunnerAction): StepRunnerState;
```

### E. Math Problem Generator (`math-generator.ts`)
```ts
export type MathDifficulty = 'easy' | 'medium' | 'hard';

export type MathProblem = {
  question: string;
  answer: number;
};

export type RNG = () => number;

export function generateProblem(difficulty: MathDifficulty, rng?: RNG): MathProblem;
```
- **Easy**: 2 single-digit or double-digit additions/subtractions (`a + b`, `a - b`). Result strictly non-negative (`a >= b`).
- **Medium**: 2-3 operands with multiplication (`a * b + c`, `a + b * c`). Results integers.
- **Hard**: 3 operands including multiplication or clean division (`a * b - c`, `(a * b) / c`). Results strictly integers, never divides by zero.

### F. Dismissal Method Registry (`src/domain/dismissal-registry.ts`)
```ts
export interface DismissMethod {
  id: MethodId;
  title: string;
  description: string;
  defaultTarget: number;
  minTarget: number;
  maxTarget: number;
  available: boolean;
  Component: React.ComponentType<{
    step: Step;
    onProgress: () => void;
    onComplete: () => void;
  }>;
}
```

---

## 6. UI & Navigation Architecture

### Screens (Expo Router)
1. `src/app/index.tsx`: Alarm List Screen (Displays existing alarms, toggle enabled/disabled, next upcoming alarm banner, FAB to add alarm).
2. `src/app/edit.tsx`: Alarm Editor Screen (Time picker, repeat day selector, label input, sound selector, Step Builder to add/remove/reorder steps).
3. `src/app/permissions.tsx`: Permission Onboarding Screen (Permission checks with direct deep links: Notifications, Schedule Exact Alarms, Full-Screen Intent, Ignore Battery Optimization).
4. `src/app/ringing.tsx`: Ringing Screen (Launched over lock screen, displays alarm time/label, active step progress indicator, embedded dismissal challenge UI, disables back button, NO snooze button).
5. `src/app/success.tsx`: Success Screen (Celebratory wake-up confirmation, summary of challenges completed).

### Design Tokens (`src/theme/tokens.ts`)
Extracted from `design_inspiration1.png` and `design_inspiration2.png`:
- **Colors**:
  - `background`: `#0A0E1A` (deep midnight)
  - `surface`: `#141A2D` (slate container)
  - `surfaceElevated`: `#1C243E` (highlighted card)
  - `primary`: `#70F464` (vibrant neon lime)
  - `accent`: `#FF9500` (amber/orange FAB & highlights)
  - `textPrimary`: `#FFFFFF`
  - `textSecondary`: `#94A3B8`
  - `border`: `#232E4E`
  - `error`: `#EF4444`
  - `gradientCard`: `['#182240', '#11172A']`
- **Spacing**: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- **Radii**: `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `round: 9999`.
- **Typography**: Inter / system font weights and scales.

---

## 7. Verification & Testing Plan
- **Unit Tests (`src/domain/*`)**:
  - Next-trigger calculation (repeating, once, midnight crossover, leap year/DST).
  - Alarm validation rules.
  - Step runner state machine transitions.
  - Math problem generator (seeded RNG, ranges, integer validity, no negative on easy, no div-by-zero).
  - Zustand alarm store actions (add, update, delete, toggle, persist).
- **Component Tests**:
  - Alarm Editor (step count modification, form validation).
  - Math Challenge Component (keypad input, correct submission, wrong answer shake/error).
- **Device Test Checklist (`docs/device-test-checklist.md`)**:
  - Screen off, swiped away, reboot, Doze mode, battery saver, DND, volume streams, watchdog recovery.
