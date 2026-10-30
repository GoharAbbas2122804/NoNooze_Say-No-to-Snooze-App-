# Wake-Check Experience (Week 2 UI, Animation, Theme) — Design Specification & Implementation Plan

## 1. Intent & Scope
Build every screen, animation, and interaction of the face wake-check experience for NoNooze according to the Nothing OS minimal design system (Prompt 3: slate/black tones, dot-matrix, single electric yellow accent `#F2E63A`, zero shadows/gradients). Runs completely against the contract `src/wake/contract.ts` using `FakeWakeCheckEngine` driving 7 scripted scenarios without native camera/ML dependencies.

---

## 2. Architecture & Components Breakdown

### A. Core Engine & State (`src/wake/fake/FakeWakeCheckEngine.ts`)
- Scripted scenarios:
  1. `happy-path`: searching -> face found -> hold fills 5s -> liveness challenge -> success.
  2. `dark-room`: dark hint -> fill light border activated -> brightness ramp -> success.
  3. `no-face`: searching -> "Look at the camera" hint -> 10s fallback button appears -> fallback.
  4. `never-blinks`: liveness challenge -> no blinks -> shake animation -> retry -> fallback.
  5. `permission-denied`: immediate error phase -> rationale/settings prompt.
  6. `camera-error`: failure phase with clear reason "Camera unavailable" + retry & math button.
  7. `model-error`: failure phase with reason "Model initialization failed" + retry & math button.
- Clean TypeScript types adhering to `WakeCheckState` and `WakeCheckConfig`.

### B. Screens & Flows
1. **Camera Rationale Screen / Modal (`src/wake/screens/CameraRationale.tsx`)**:
   - TwoToneTitle: "Camera / stays on your phone"
   - Three privacy lines: on-device only, never stored, only active while alarm rings.
   - Primary `RoundButton` ("Enable camera") + fallback link ("Use math instead").
2. **Setup Guide ("Prop your phone") (`src/wake/screens/SetupGuide.tsx`)**:
   - Animated line illustration using `react-native-svg` + Reanimated: phone leaning on nightstand, distance ruler, face oval.
   - 3-step carousel / progression; auto-advances when face found (`signals.faceFound`); Skip button.
3. **Calibration ("Learn my eyes") (`src/wake/screens/CalibrationModal.tsx`)**:
   - Step 1: Eyes wide open (3s). Step 2: Eyes closed (2s).
   - Dot-ring progression + `DotMatrixCountdown`.
   - Calls `engine.calibrate()`, toast `notify.success("Calibrated")`.
4. **Live Check Hero Screen (`src/wake/screens/LiveWakeCheck.tsx` / `FaceChallenge.tsx`)**:
   - TwoToneTitle: "Show your / eyes" (dynamically updates with phase: "Searching...", "Hold steady", "Awake.").
   - Rounded viewfinder card (radius 28) with `WakeCameraPreview`, token-colored scrim, dot-grid mask + face-oval cutout. Oval pulses while searching, locks on face detection, surrounded by `DotRing` (grey -> ink -> yellow).
   - `CheckPills`: Eyes open, Upright, Blink x2 / Turn, Light.
   - `DotMatrixCountdown`: remaining hold seconds.
   - `AlertnessTick`: 0-100 tick strip with yellow marker.
   - `HintText`: rate-limited inline hint near oval + `notify.info` (max 1 per 8s).
   - Fallback button: appears after 10s via `useFallbackTimer`.
5. **Liveness Overlay (`src/wake/components/LivenessOverlay.tsx`)**:
   - Slide-up card with TwoToneTitle ("Blink / twice", "Turn your head / left", "Look / up").
   - Directional arrows with Reanimated travel motion, circular timer arc, blink progress dots.
   - Error shake (3 oscillations) on failure; max 2 retries -> fallback offer.
6. **Success Transition (`src/wake/screens/WakeSuccessView.tsx`)**:
   - Flash ring dots yellow -> collapse into Check -> haptic -> "Awake." headline + duration & alertness summary -> `onComplete()`.
7. **Failure / Fallback Screen (`src/wake/screens/WakeFallbackView.tsx`)**:
   - Reason badge ("Too dark", "Camera unavailable", "Couldn't see eyes"), primary "Use math instead", ghost "Try again".
8. **Settings Wake-Check Section (`src/wake/screens/WakeCheckSettings.tsx`)**:
   - Sensitivity (relaxed / standard / strict) segmented control.
   - Hold seconds stepper (3 to 10s).
   - Liveness toggle, Fill-light toggle, Recalibrate trigger, "Alarm screens use dark at night" toggle.
9. **Dev Tools & Model Comparison Overlay (`src/wake/dev/SignalDebuggerOverlay.tsx` & `DataCollectorModal.tsx`)**:
   - Triggered via long press on version in Settings.
   - Live sparklines: `mlkit`, `ear`, `cnn`, `fused` with threshold lines, yaw/pitch/roll, FPS, latency.
   - Data collector UI: label pickers, 10s record button, eye crop consent toggle, export button.

### C. Theming, Brightness & Motion
- `useAlarmTheme()`: dark mode if system dark OR (time in 21:00-07:00 AND `darkAtNight` true).
- `useFillLight()`: `expo-keep-awake` active, `expo-brightness` set to 1.0 with safe restore on unmount/error.
- Soft white viewfinder border when lighting is dark.
- GSAP-style Choreography on UI thread (transform & opacity only, `power3.out`, `power2.in`, springs). Reduced motion fallback.

---

## 3. Integration Points
1. `src/domain/dismissal-registry.ts`: `face` marked available, default target = 5 seconds (min 3, max 10), unit = 'seconds'.
2. `src/components/alarm/StepBuilder.tsx`: Face card enabled with animated blinking dot-grid eye mini-illustration and hold-seconds stepper.
3. `src/app/permissions.tsx`: Camera permission row with privacy rationale modal and settings link.
4. `src/app/gallery.tsx`: Interactive Wake-Check Dev Gallery with scenario switcher and component showcase.
5. `src/app/ringing.tsx`: Audio loops continuously during wake-check and stops only on final dismissal.

---

## 4. Verifiable Success Criteria
- 100% of Jest tests pass with zero fake timer leaks or memory warnings.
- 0 TypeScript errors (`npx tsc --noEmit`).
- 0 ESLint errors (`npx expo lint`).
- All 7 scenarios execute properly with realistic signal dynamics.
- WCAG contrast ratios satisfied across both light and dark themes.
