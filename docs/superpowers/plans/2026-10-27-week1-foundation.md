# Week 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Week 1 foundation for "NoNooze", an Android alarm app whose alarms can only be dismissed by completing multi-step challenges (featuring Math challenge, exact alarm engine with lockscreen wake, data persistence, and UI scaffold).

**Architecture:** Pure domain logic (validation, next trigger, step-runner state machine, math generator) built first using TDD with Jest; Zustand + AsyncStorage persistence; AlarmScheduler interface supporting a 1h spike on `react-native-notify-kit` with fallback to a local Kotlin Expo module (`modules/alarm-engine`) implementing `AlarmManager.setAlarmClock`, foreground service audio, and full-screen intent; functional UI styled strictly with design tokens derived from provided design inspiration mockups.

**Tech Stack:** React Native 0.88, Expo SDK 58, Expo Router, TypeScript, Zustand, AsyncStorage, Reanimated, Moti, Expo Haptics, Expo Audio, Kotlin (Android native module for AlarmClock & Foreground Service).

**Spec:** [docs/superpowers/specs/2026-10-27-week1-foundation-design.md](file:///home/goharabbas/Desktop/nonooze/docs/superpowers/specs/2026-10-27-week1-foundation-design.md)

## Global Constraints
- **Platform**: Android only.
- **Expo SDK**: Expo SDK 58 (~58.0.19) using CNG (Continuous Native Generation) via `app.json` / config plugins.
- **App Name**: Stored in a single constant `APP_NAME = "NoNooze"`.
- **Styling**: Strictly token-driven (`src/theme/tokens.ts`). No hardcoded hex colors or inline values.
- **Package Installation**: Use only `npx expo install <package>` for SDK-compatible dependencies.
- **Test Coverage**: >= 80% coverage on `src/domain/*`.

## Review Focus
1. Alarm triggering across midnight for one-time alarms: Must correctly select the next day if the target time is earlier than the current time.
2. Repeating alarms with day wrapping: Must calculate the earliest matching day of the week, handling week rollover (e.g., Saturday to Monday).
3. Math division problems: Must never divide by zero and operands must yield exact integer results.
4. App task kill during ringing with incomplete challenges: Active watchdog alarm must re-ring within ~1 minute.
5. Step runner completion: Must transition from `idle` -> `running` -> `completed` only when every step in the list satisfies its target.

---

### Task 1: Foundation Setup, Theme Tokens, Constants & Jest Config

**Files:**
- Create: `src/constants/app.ts`
- Create: `src/theme/tokens.ts`
- Create: `jest.config.js`
- Modify: `package.json`
- Modify: `app.json`

**Interfaces:**
- Produces:
  - `APP_NAME: string` in `src/constants/app.ts`
  - `colors, spacing, radii, typography` in `src/theme/tokens.ts`

- [ ] **Step 1: Install core Week 1 dependencies**
Run:
```bash
npx expo install expo-dev-client react-native-notify-kit zustand @react-native-async-storage/async-storage moti expo-haptics expo-audio expo-keep-awake expo-linear-gradient react-native-svg
npm install --save-dev jest-expo jest @testing-library/react-native @types/jest
```

- [ ] **Step 2: Create application constants and theme tokens**
Create `src/constants/app.ts` exporting `APP_NAME = "NoNooze"`.
Create `src/theme/tokens.ts` exporting color tokens (`#0A0E1A`, `#141A2D`, `#1C243E`, `#70F464`, `#FF9500`, `#FFFFFF`, `#94A3B8`, `#232E4E`), spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48), and border radii.

- [ ] **Step 3: Configure Jest for React Native & Expo**
Create `jest.config.js` with `preset: "jest-expo"` and transform ignore patterns for Expo and React Native packages.
Add `"test": "jest"` to `package.json`.

- [ ] **Step 4: Update `app.json` with Android configuration**
Configure `app.json` with permissions (`SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `POST_NOTIFICATIONS`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `USE_FULL_SCREEN_INTENT`), package name `com.nonooze.app`, and scheme `nonooze`.

- [ ] **Step 5: Run tests to verify Jest setup**
Run: `npm test`
Expected: Passes (or 0 tests with no errors).

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json app.json jest.config.js src/constants/ src/theme/
git commit -m "chore: configure dependencies, theme tokens, and jest setup"
```

---

### Task 2: Domain Layer - Alarm Types, Validation & Next Trigger Calculation (TDD)

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/validation.ts`
- Create: `src/domain/next-trigger.ts`
- Test: `__tests__/domain/validation.test.ts`
- Test: `__tests__/domain/next-trigger.test.ts`

**Interfaces:**
- Produces:
  - `type Alarm`, `type Step`, `type DayOfWeek` in `src/domain/types.ts`
  - `validateAlarm(alarm: Partial<Alarm>): { valid: boolean; errors: string[] }`
  - `getNextTriggerDate(alarm: Alarm, now?: Date): Date`

- [ ] **Step 1: Write failing tests for Alarm validation and Next Trigger calculation**
Create `__tests__/domain/validation.test.ts` testing:
- Valid alarm with 1 math step (target 5).
- Rejects alarm with 0 steps.
- Rejects math step with target < 1 or > 10.
- Rejects pushup step with target < 5 or > 50.
- Rejects invalid time format.

Create `__tests__/domain/next-trigger.test.ts` testing:
- One-time alarm later today triggers today.
- One-time alarm earlier today triggers tomorrow.
- Repeating alarm with today selected triggers today if time is future, else next week.
- Repeating alarm on MWF calculated correctly from Tuesday.
- Handles midnight rollover (e.g. 23:59 to 00:01).

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test __tests__/domain/`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement domain types, validation, and next trigger calculation**
Implement `src/domain/types.ts`, `src/domain/validation.ts`, and `src/domain/next-trigger.ts`.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test __tests__/domain/`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/domain/types.ts src/domain/validation.ts src/domain/next-trigger.ts __tests__/domain/
git commit -m "feat(domain): implement alarm types, validation, and next trigger calculation"
```

---

### Task 3: Domain Layer - Step Runner State Machine & Math Generator (TDD)

**Files:**
- Create: `src/domain/step-runner.ts`
- Create: `src/domain/math-generator.ts`
- Test: `__tests__/domain/step-runner.test.ts`
- Test: `__tests__/domain/math-generator.test.ts`

**Interfaces:**
- Produces:
  - `stepRunnerReducer(state: StepRunnerState, action: StepRunnerAction): StepRunnerState`
  - `createInitialStepRunnerState(steps: Step[]): StepRunnerState`
  - `generateProblem(difficulty: MathDifficulty, rng?: RNG): MathProblem`

- [ ] **Step 1: Write failing tests for Step Runner State Machine and Math Generator**
Create `__tests__/domain/step-runner.test.ts` testing:
- Initial state is `running` at `stepIndex: 0, progress: 0` when initialized with steps.
- `PROGRESS` action increments progress.
- Progress reaching `step.target` advances to `stepIndex: 1, progress: 0`.
- Last step progress reaching target transitions to status `completed`.
- Reset action returns to `idle`.

Create `__tests__/domain/math-generator.test.ts` testing:
- Easy difficulty: answers are integers, strictly non-negative.
- Medium difficulty: produces addition/subtraction/multiplication, valid integers.
- Hard difficulty: produces division or multi-op, integer results, NEVER divides by zero.
- Seeded RNG produces 100% deterministic problems.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test __tests__/domain/step-runner.test.ts __tests__/domain/math-generator.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `step-runner.ts` and `math-generator.ts`**
Implement reducer and pure math generator in `src/domain/`.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test __tests__/domain/`
Expected: PASS with 100% domain passing.

- [ ] **Step 5: Commit**
```bash
git add src/domain/step-runner.ts src/domain/math-generator.ts __tests__/domain/step-runner.test.ts __tests__/domain/math-generator.test.ts
git commit -m "feat(domain): implement step runner state machine and math problem generator"
```

---

### Task 4: State Management - Zustand Alarm Store & Persistence (TDD)

**Files:**
- Create: `src/store/alarm-store.ts`
- Test: `__tests__/store/alarm-store.test.ts`

**Interfaces:**
- Consumes: `Alarm`, `Step` from `src/domain/types.ts`
- Produces:
  - `useAlarmStore` hook with actions: `addAlarm`, `updateAlarm`, `deleteAlarm`, `toggleAlarm`, `loadAlarms`

- [ ] **Step 1: Write failing tests for Zustand Alarm Store**
Create `__tests__/store/alarm-store.test.ts` testing:
- Adding a valid alarm appends it to state and schedules trigger.
- Updating alarm updates fields and recalculates trigger.
- Deleting alarm removes it from store.
- Toggling alarm enables/disables it.
- Store hydrates properly from AsyncStorage mock.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test __tests__/store/alarm-store.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `useAlarmStore` with Zustand + AsyncStorage persistence**
Implement `src/store/alarm-store.ts` using `create` and `persist` middleware.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test __tests__/store/alarm-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/store/alarm-store.ts __tests__/store/alarm-store.test.ts
git commit -m "feat(store): implement zustand alarm store with async-storage persistence"
```

---

### Task 5: Alarm Engine - Scheduler Interface, Spike & Native Module / Plugin

**Files:**
- Create: `src/services/alarm-scheduler/types.ts`
- Create: `src/services/alarm-scheduler/fake-scheduler.ts`
- Create: `src/services/alarm-scheduler/index.ts`
- Create: `modules/alarm-engine/` (or config plugin for exact alarm + lockscreen activity)
- Test: `__tests__/services/fake-scheduler.test.ts`

**Interfaces:**
- Produces:
  - `interface AlarmScheduler`
  - `getAlarmScheduler(): AlarmScheduler`
  - `rescheduleAllAlarms(): Promise<void>`

- [ ] **Step 1: Write scheduler interface and fake test implementation**
Define `AlarmScheduler` interface in `src/services/alarm-scheduler/types.ts`.
Create `FakeAlarmScheduler` in `src/services/alarm-scheduler/fake-scheduler.ts` for unit test suites and simulator environments.
Create `__tests__/services/fake-scheduler.test.ts` to verify scheduling contract.

- [ ] **Step 2: Run test to verify fake scheduler**
Run: `npm test __tests__/services/fake-scheduler.test.ts`
Expected: PASS.

- [ ] **Step 3: Spike `react-native-notify-kit` vs Kotlin Native Module (Timebox 1h)**
Test `react-native-notify-kit` in dev build. If full-screen intent or SDK 58 support is deficient, implement `modules/alarm-engine`:
- Kotlin `AlarmReceiver.kt` handling `AlarmManager.setAlarmClock`.
- `AlarmService.kt` foreground service with looping `MediaPlayer` on `AudioAttributes.USAGE_ALARM`.
- `RebootReceiver.kt` listening to `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`.
- Full-screen intent launching `MainActivity` with `setShowWhenLocked(true)` and `setTurnScreenOn(true)`.
- Watchdog timer: automatically sets a 60-second recovery alarm upon ringing.

- [ ] **Step 4: Integrate scheduler with `useAlarmStore`**
Wire store actions (`addAlarm`, `updateAlarm`, `toggleAlarm`, `deleteAlarm`) to call `getAlarmScheduler().schedule()` or `cancel()`.

- [ ] **Step 5: Run tests**
Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/services/alarm-scheduler/ modules/ __tests__/services/
git commit -m "feat(engine): implement alarm scheduler interface and native alarm engine"
```

---

### Task 6: UI - Dismissal Registry & Math Challenge Component

**Files:**
- Create: `src/domain/dismissal-registry.ts`
- Create: `src/components/challenges/MathChallenge.tsx`
- Create: `src/components/challenges/NumericKeypad.tsx`
- Test: `__tests__/components/MathChallenge.test.tsx`

**Interfaces:**
- Produces:
  - `DISMISSAL_METHODS: Record<MethodId, DismissMethod>`
  - `<MathChallenge step={step} onProgress={onProgress} onComplete={onComplete} />`

- [ ] **Step 1: Define `DISMISSAL_METHODS` registry**
Create `src/domain/dismissal-registry.ts` with:
- `math`: title "Math Problems", available `true`, default target 3, range 1-10.
- `pushups`: title "Pushups", available `false` (Coming Soon), default target 10, range 5-50.
- `situps`: title "Situps", available `false` (Coming Soon), default target 15, range 5-50.
- `face`: title "Wake State Check", available `false` (Coming Soon), default target 1, range 1-1.

- [ ] **Step 2: Write failing component tests for MathChallenge**
Create `__tests__/components/MathChallenge.test.tsx`:
- Renders arithmetic question and numeric keypad.
- Entering correct answer triggers `onProgress`.
- Completing all target problems triggers `onComplete`.
- Entering incorrect answer triggers shake and resets current input.

- [ ] **Step 3: Implement `NumericKeypad` and `MathChallenge`**
Create `src/components/challenges/NumericKeypad.tsx` with buttons 0-9, Backspace, Submit styled with theme tokens.
Create `src/components/challenges/MathChallenge.tsx` using `generateProblem` with Reanimated shake animation and `expo-haptics` impact feedback.

- [ ] **Step 4: Run component tests**
Run: `npm test __tests__/components/MathChallenge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/domain/dismissal-registry.ts src/components/challenges/ __tests__/components/
git commit -m "feat(ui): implement dismissal registry and math challenge keypad component"
```

---

### Task 7: UI - Alarm List & Alarm Editor with Step Builder

**Files:**
- Create: `src/components/alarm/AlarmCard.tsx`
- Create: `src/components/alarm/StepBuilder.tsx`
- Create: `src/components/alarm/DaySelector.tsx`
- Create: `src/app/index.tsx`
- Create: `src/app/edit.tsx`
- Test: `__tests__/components/StepBuilder.test.tsx`

**Interfaces:**
- Produces:
  - `<StepBuilder steps={steps} onChange={setSteps} />`
  - Routes: `/` (Alarm List), `/edit` (Alarm Editor)

- [ ] **Step 1: Write failing tests for StepBuilder**
Create `__tests__/components/StepBuilder.test.tsx`:
- Renders list of current steps.
- Add step opens method selector with disabled indicators for coming-soon methods.
- Allows increasing and decreasing problem/rep target within allowed bounds.
- Remove step deletes from list unless it's the only remaining step.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test __tests__/components/StepBuilder.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement StepBuilder, DaySelector, AlarmCard, and Screens**
Implement `StepBuilder.tsx`, `DaySelector.tsx`, and `AlarmCard.tsx` using design tokens.
Implement `src/app/index.tsx` (Alarm list, empty state, toggle switch, add button).
Implement `src/app/edit.tsx` (Time picker, repeat days, label input, sound picker, step builder with validation before save).

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test __tests__/components/StepBuilder.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/components/alarm/ src/app/index.tsx src/app/edit.tsx __tests__/components/StepBuilder.test.tsx
git commit -m "feat(ui): implement alarm list, editor, and step builder components"
```

---

### Task 8: UI - Permissions Onboarding, Ringing Screen & Success Screen

**Files:**
- Create: `src/app/permissions.tsx`
- Create: `src/app/ringing.tsx`
- Create: `src/app/success.tsx`
- Test: `__tests__/screens/RingingScreen.test.tsx`

**Interfaces:**
- Produces:
  - Routes: `/permissions`, `/ringing`, `/success`

- [ ] **Step 1: Implement Permissions Onboarding Screen (`src/app/permissions.tsx`)**
Build screen displaying four permission cards with status indicators and deep links:
1. Notifications (`POST_NOTIFICATIONS`)
2. Schedule Exact Alarms (`SCHEDULE_EXACT_ALARM`)
3. Full-Screen Intent (`USE_FULL_SCREEN_INTENT`)
4. Battery Optimization Exemption (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`)

- [ ] **Step 2: Write tests for Ringing Screen state and dismiss flow**
Create `__tests__/screens/RingingScreen.test.tsx`:
- Disables Android hardware back button handler.
- Advances through multiple steps in sequence.
- Calls `AlarmScheduler.stopRinging()` and navigates to `/success` upon completion.

- [ ] **Step 3: Implement Ringing Screen (`src/app/ringing.tsx`)**
- Full screen over lock screen (`expo-keep-awake`).
- Displays alarm time, label, step progress pill ("Step 1 of 2: Math (2/5)").
- Embeds the active challenge component.
- Hardware back press blocked (`BackHandler.addEventListener('hardwareBackPress', () => true)`).
- NO snooze button.

- [ ] **Step 4: Implement Success Screen (`src/app/success.tsx`)**
- Celebratory confirmation screen with completed challenge summary and return home button.

- [ ] **Step 5: Run tests**
Run: `npm test __tests__/screens/RingingScreen.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/app/permissions.tsx src/app/ringing.tsx src/app/success.tsx __tests__/screens/
git commit -m "feat(ui): implement permissions onboarding, ringing screen, and success screen"
```

---

### Task 9: Verification, Device Test Checklist & Native Prebuild

**Files:**
- Create: `docs/device-test-checklist.md`
- Create: `README.md` (exact run commands, dev build instructions)

- [ ] **Step 1: Create `docs/device-test-checklist.md`**
Document verification scenarios with exact ADB verification commands, expected results, and Pass/Fail columns:
- Screen off wakeup (`adb shell dumpsys alarm | grep com.nonooze`)
- App swiped away / killed
- Device reboot (`adb shell am broadcast -a android.intent.action.BOOT_COMPLETED`)
- Overnight Doze (`adb shell dumpsys deviceidle force-idle`)
- Battery saver mode
- Do Not Disturb (DND) bypass with alarm stream
- Volume streams (media volume 0 vs alarm volume 100%)
- Permission revoked mid-day
- Clock/Timezone change
- Alarm set 2 minutes from now
- OEM battery manager autostart guidelines (Xiaomi/Vivo/OnePlus)
- Watchdog re-ring on force kill (`adb shell am force-stop com.nonooze.app`)

- [ ] **Step 2: Run all static analysis gates**
Run and capture output:
```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
npm test
```

- [ ] **Step 3: Run Expo prebuild for Android**
Run: `npx expo prebuild --platform android --clean`
Verify Android manifest, plugins, and Gradle configuration.

- [ ] **Step 4: Commit**
```bash
git add docs/ README.md
git commit -m "docs: add device test checklist and development build run instructions"
```
