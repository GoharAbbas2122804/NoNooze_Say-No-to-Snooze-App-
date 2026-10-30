# NoNooze (Android Alarm App)

NoNooze is an unskippable Android alarm application whose alarms can only be dismissed by completing cognitive or physical challenges.

Week 1 Foundation delivers exact-minute alarm scheduling during Doze and screen off, full-screen lockscreen wakeup, persistent audio stream, step-runner state machine, math challenge, Zustand persistence, token-driven UI, and comprehensive test coverage.

---

## Quick Start (Development Build)

Ensure your Android phone is connected via USB with USB debugging enabled (`adb devices`).

### 1. Run Development Build on Phone
```bash
# Builds and installs native Android debug APK to connected phone
npx expo run:android
```

### 2. Start Metro Development Server (with Hot Reload)
```bash
npx expo start
```

---

## Verification & Quality Gates

Run all quality gates before committing:

```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Lint
npx expo lint

# 3. Expo Doctor Diagnostics
npx expo-doctor

# 4. Jest Unit & Component Tests (with Coverage)
npm test -- --coverage
```

---

## Architecture & Codebase Structure

- **`src/constants/app.ts`**: Single definition of `APP_NAME = 'NoNooze'`.
- **`src/theme/tokens.ts`**: Centralized design tokens (colors, 4/8pt spacing, border radii, typography scale, shadows) derived from design inspiration mockups.
- **`src/domain/`**: Pure, test-driven business logic:
  - `validation.ts`: Alarm validation rules (>= 1 step, math target 1-10, pushups/situps 5-50).
  - `next-trigger.ts`: Exact next trigger calculation (one-time, repeating, week wrapping, midnight crossover, DST safe).
  - `step-runner.ts`: Pure state machine reducer (`idle -> running(stepIndex, progress) -> completed`).
  - `math-generator.ts`: Pure arithmetic problem generator with 3 difficulties, guaranteed integer answers, and division-by-zero protection.
  - `dismissal-registry.ts`: Method registry for math and active wake challenges, including the Android face check (ML Kit face/eye signals plus the local TFLite eye classifier).
- **`src/store/alarm-store.ts`**: Zustand state management with `@react-native-async-storage/async-storage` persistence.
- **`src/services/alarm-scheduler/`**: `AlarmScheduler` interface backed by native trigger notifications and foreground audio service. Includes `FakeAlarmScheduler` for headless CI/tests.
- **`plugins/withLockScreen.js`**: Expo config plugin injecting `android:showWhenLocked="true"` and `android:turnScreenOn="true"` into `MainActivity` for Continuous Native Generation (CNG).
- **`docs/device-test-checklist.md`**: ADB commands and verification matrix for physical Android testing.
