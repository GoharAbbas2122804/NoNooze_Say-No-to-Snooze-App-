# Wake Check Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete face-based wake-check engine: contract, pure logic state machine, ML training pipeline, own-trained TFLite eye-state CNN, data collector, native camera frame processing, and device test matrix.

**Architecture:** A layered pipeline where `WakeCheckEngine` runs a deterministic state machine driven by injected frame signals. Pure logic filters and evaluates eye-state, head pose, blink dynamics, and liveness challenges without any native dependencies. Native camera frame feeds Google ML Kit for face geometry and our custom 48x48 eye-crop CNN for alertness fusion, with safe fallback to the Math challenge if camera or face checks fail.

**Tech Stack:** React Native (Expo SDK 58, React 19, React Native 0.88), TypeScript, Jest, Python 3.13 / PyTorch / TensorFlow / Keras / TFLite, `react-native-vision-camera` v5, `vision-camera-face-detection` v3, Nitro modules.

**Spec:** USER_REQUEST specification for Week 2 Face-Based Wake Check Engine.

## Global Constraints
- Do not edit or touch the alarm engine or theme provider.
- `src/wake/contract.ts` must exactly match the user's contract specification without alterations.
- All pure logic modules in `src/wake/logic/` must be dependency-free from React Native native modules and use fake/injected clocks in tests.
- Person-level train/test splits in ML pipeline: zero subject leakage across T1/T2/T3.
- End-to-end latency budget: <= 60 ms p50 at 10-15 fps.
- Zero network requests; camera strictly released when stopped, backgrounded, or screen turned off.
- Fallback path must always be reachable; never trap the user.

## Review Focus
1. Lock-screen camera acquisition failure: engine must transition to `phase: 'fallback'` without throwing unhandled exceptions.
2. Rapid blink sequence during verification: hold timer must not prematurely reset for dips <= 400 ms.
3. Subject leakage in ML splits: test fixture fails build if any subject id appears in both train and test partitions.
4. Parity difference between Keras model and TFLite int8/float16 export: must verify maximum absolute difference < 0.05 on test crops.
5. Camera lifecycle release on app state change: backgrounding app must cleanly release camera session and stop frame processing.

---

### Task 1: Contract & Pure Logic Signals (TDD)

**Files:**
- Create: `src/wake/contract.ts`
- Create: `src/wake/logic/smoothing.ts`
- Create: `src/wake/logic/hold.ts`
- Create: `src/wake/logic/blink.ts`
- Create: `src/wake/logic/headTurn.ts`
- Test: `__tests__/wake/logic/smoothing.test.ts`
- Test: `__tests__/wake/logic/hold.test.ts`
- Test: `__tests__/wake/logic/blink.test.ts`
- Test: `__tests__/wake/logic/headTurn.test.ts`

**Interfaces:**
- Consumes: None (pure foundational contracts and signal math).
- Produces:
  - `src/wake/contract.ts`: `WakePhase`, `Hint`, `LivenessChallenge`, `FrameSignals`, `WakeCheckConfig`, `Calibration`, `WakeCheckState`, `WakeCheckEngine`, `useWakeCheck`, `WakeCameraPreview`.
  - `src/wake/logic/smoothing.ts`: `createSignalSmoother(sensitivity: 'relaxed'|'standard'|'strict'): { update(raw: number): { smoothed: number; isOpen: boolean }; reset(): void }`
  - `src/wake/logic/hold.ts`: `createHoldTracker(targetMs: number): { update(isOpen: boolean, isUpright: boolean, faceFound: boolean, dtMs: number): { heldMs: number; isMet: boolean }; reset(): void }`
  - `src/wake/logic/blink.ts`: `createBlinkDetector(): { update(eyesOpen: number, dtMs: number): { blinkDetected: boolean; blinkDurationMs?: number }; reset(): void }`
  - `src/wake/logic/headTurn.ts`: `checkHeadTurn(yaw: number, pitch: number, neutral: { yawNeutral: number; pitchNeutral: number }, thresholdDeg?: number): { turned: boolean; direction?: 'left'|'right'|'up'|'down'; angle: number }`

- [ ] **Step 1: Write failing tests for signal smoothing, hold tracking, blink detection, and head turn**
- [ ] **Step 2: Run `npm test -- __tests__/wake/logic/` to verify tests fail**
- [ ] **Step 3: Implement `contract.ts` and signal modules in `src/wake/logic/`**
- [ ] **Step 4: Run `npm test -- __tests__/wake/logic/` to verify all tests pass**
- [ ] **Step 5: Commit changes**
  ```bash
  git add src/wake/contract.ts src/wake/logic/ __tests__/wake/logic/
  git commit -m "feat(wake): implement contract and pure logic signal filters with TDD"
  ```

---

### Task 2: Challenge Selection, Alertness Heuristic, Signal Fusion, & Calibration (TDD)

**Files:**
- Create: `src/wake/logic/challenge.ts`
- Create: `src/wake/logic/fusion.ts`
- Create: `src/wake/logic/alertness.ts`
- Create: `src/wake/logic/calibration.ts`
- Test: `__tests__/wake/logic/challenge.test.ts`
- Test: `__tests__/wake/logic/fusion.test.ts`
- Test: `__tests__/wake/logic/alertness.test.ts`
- Test: `__tests__/wake/logic/calibration.test.ts`

**Interfaces:**
- Consumes: `src/wake/contract.ts` (`LivenessChallenge`, `Calibration`, `FrameSignals`).
- Produces:
  - `src/wake/logic/challenge.ts`: `createChallengeManager(): { pickNext(previous?: LivenessChallenge): LivenessChallenge; verify(signals: FrameSignals, challenge: LivenessChallenge, calib?: Calibration): boolean; canRetry(): boolean; retriesCount(): number; reset(): void }`
  - `src/wake/logic/fusion.ts`: `fuseEyeSignals(mlkitProb: number, earRatio: number, cnnProb: number, weights?: { mlkit: number; ear: number; cnn: number }): { fused: number; source: Record<string, number> }`
  - `src/wake/logic/alertness.ts`: `computeAlertnessHeuristic(params: { eyesOpenRatio: number; blinkRatePerMin: number; headMovementScore: number; livenessSpeedScore: number; uprightScore: number }): number`
  - `src/wake/logic/calibration.ts`: `createCalibrationTracker(): { update(signals: FrameSignals, dtMs: number): { isComplete: boolean; phase: 'open_3s'|'closed_2s'|'done'; calibration?: Calibration }; reset(): void }`

- [ ] **Step 1: Write failing tests for challenges, fusion, alertness heuristic, and calibration**
- [ ] **Step 2: Run `npm test -- __tests__/wake/logic/` to verify tests fail**
- [ ] **Step 3: Implement challenge manager, signal fusion, alertness heuristic, and calibration tracker**
- [ ] **Step 4: Run `npm test -- __tests__/wake/logic/` to verify tests pass**
- [ ] **Step 5: Commit changes**
  ```bash
  git add src/wake/logic/ __tests__/wake/logic/
  git commit -m "feat(wake): add challenge manager, fusion, alertness heuristic, and calibration"
  ```

---

### Task 3: Deterministic State Machine & WakeCheckEngine Implementation (TDD)

**Files:**
- Create: `src/wake/logic/stateMachine.ts`
- Create: `src/wake/modelRegistry.ts`
- Create: `src/wake/engine.ts`
- Create: `src/wake/WakeCameraPreview.tsx`
- Test: `__tests__/wake/stateMachine.test.ts`
- Test: `__tests__/wake/engine.test.ts`

**Interfaces:**
- Consumes: `src/wake/contract.ts`, `src/wake/logic/*.ts`, `src/wake/modelRegistry.ts`.
- Produces:
  - `src/wake/logic/stateMachine.ts`: `createWakeStateMachine(config: WakeCheckConfig, options?: { clock?: () => number; calibration?: Calibration }): { handleFrame(signals: FrameSignals): WakeCheckState; triggerTimeout(): WakeCheckState; triggerError(reason: WakeCheckState['failureReason']): WakeCheckState; getState(): WakeCheckState }`
  - `src/wake/modelRegistry.ts`: `MODEL_REGISTRY: Record<string, { id: string; version: string; sha256: string; path: string; inputShape: number[] }>`
  - `src/wake/engine.ts`: `class DefaultWakeCheckEngine implements WakeCheckEngine`
  - `src/wake/WakeCameraPreview.tsx`: `export const WakeCameraPreview: React.FC<{ engine: WakeCheckEngine; style?: StyleProp<ViewStyle> }>`

- [ ] **Step 1: Write failing tests for state machine transitions, timeout handling, and engine lifecycle**
- [ ] **Step 2: Run `npm test -- __tests__/wake/stateMachine.test.ts __tests__/wake/engine.test.ts` to verify tests fail**
- [ ] **Step 3: Implement state machine, model registry, engine implementation, and camera preview component**
- [ ] **Step 4: Run `npm test -- __tests__/wake/` to verify all wake tests pass**
- [ ] **Step 5: Commit changes**
  ```bash
  git add src/wake/ __tests__/wake/
  git commit -m "feat(wake): implement deterministic state machine and WakeCheckEngine"
  ```

---

### Task 4: Dev Data Collector & Ingestion Tooling

**Files:**
- Create: `src/wake/dev/collector.ts`
- Create: `ml/tools/ingest_sessions.py`
- Create: `ml/tools/generate_mock_dataset.py`
- Test: `__tests__/wake/collector.test.ts`
- Test: `ml/tests/test_ingest.py`

**Interfaces:**
- Consumes: `src/wake/contract.ts` (`FrameSignals`).
- Produces:
  - `src/wake/dev/collector.ts`: `createDataCollector(): { startSession(metadata: SessionMeta): void; recordFrame(signals: FrameSignals, cropBase64?: string): void; endSession(): Promise<string>; exportSessions(): Promise<void>; setConsent(allowCrops: boolean): void }`
  - `ml/tools/ingest_sessions.py`: CLI script taking raw JSONL export and formatting into training splits `(X_train, y_train, subject_ids)`.
  - `ml/tools/generate_mock_dataset.py`: deterministic synthetic dataset generator producing MRL/CEW/own format for CI tests.

- [ ] **Step 1: Write failing tests for data collector and Python ingestion script**
- [ ] **Step 2: Run tests to verify failures (`npm test -- collector` and `pytest ml/tests/test_ingest.py`)**
- [ ] **Step 3: Implement data collector with consent guard, file rotation, and Python ingestion tooling**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit changes**
  ```bash
  git add src/wake/dev/ ml/tools/ ml/tests/ __tests__/wake/collector.test.ts
  git commit -m "feat(wake): add data collector with explicit consent toggle and dataset ingestion tools"
  ```

---

### Task 5: ML Pipeline, Eye CNN Training, Parity Verification, & TFLite Export

**Files:**
- Create: `ml/README.md`
- Create: `ml/requirements.txt`
- Create: `ml/src/dataset.py`
- Create: `ml/src/models.py`
- Create: `ml/src/augmentations.py`
- Create: `ml/src/metrics.py`
- Create: `ml/src/export.py`
- Create: `ml/01_eda.ipynb`
- Create: `ml/02_train_eye_cnn.ipynb`
- Create: `ml/03_eval_on_device.ipynb`
- Create: `ml/04_upright_mlp_scaffold.ipynb`
- Create: `ml/results.md`
- Create: `assets/models/eye_cnn_v1.tflite`
- Test: `ml/tests/test_dataset.py`
- Test: `ml/tests/test_models.py`
- Test: `ml/tests/test_export.py`

**Interfaces:**
- Consumes: Ingested datasets or synthetic mock datasets.
- Produces:
  - `ml/src/dataset.py`: `create_subject_splits(data, test_subjects: list[str]) -> (train_ds, val_ds, test_ds)` (enforces disjoint subject IDs).
  - `ml/src/models.py`: `build_m1_eye_cnn(input_shape=(48, 48, 1)) -> tf.keras.Model`, `build_m2_mobilenet(input_shape=(48, 48, 1)) -> tf.keras.Model`, `evaluate_m0_baselines(ear_threshold=0.2)`.
  - `ml/src/export.py`: `export_to_tflite(model, output_path, quantize='float16'|'int8', rep_data_gen=None) -> dict` (verifies parity with Keras model, returns max diff and size).
  - `assets/models/eye_cnn_v1.tflite`: quantized model ready for on-device inference.
  - `ml/results.md`: documented metrics, FAR at fixed thresholds, and ablation studies.

- [ ] **Step 1: Write failing pytests for subject split isolation, model architecture parameters (<100k params), and TFLite export parity**
- [ ] **Step 2: Run `pytest ml/tests/` to verify failures**
- [ ] **Step 3: Implement dataset loader, augmentations, M0/M1/M2 models, metrics, and TFLite export**
- [ ] **Step 4: Run `pytest ml/tests/` to verify all tests pass**
- [ ] **Step 5: Generate Colab-ready notebooks (`01_eda.ipynb` to `04_upright_mlp_scaffold.ipynb`) and export `eye_cnn_v1.tflite` to `assets/models/`**
- [ ] **Step 6: Fill `ml/results.md` with baseline comparisons and ablation benchmarks**
- [ ] **Step 7: Commit changes**
  ```bash
  git add ml/ assets/models/
  git commit -m "feat(ml): train eye-state CNN, verify parity, export TFLite, and provide notebooks"
  ```

---

### Task 6: Native Camera & Vision Processor Spike Integration

**Files:**
- Create: `modules/wake-vision/android/build.gradle`
- Create: `modules/wake-vision/android/src/main/java/com/nonooze/wakevision/WakeVisionModule.kt`
- Create: `modules/wake-vision/android/src/main/java/com/nonooze/wakevision/EyeCropProcessor.kt`
- Create: `modules/wake-vision/index.ts`
- Modify: `app.json` (add camera permissions and module config)
- Modify: `package.json` (vision-camera and nitro modules)
- Modify: `src/wake/WakeCameraPreview.tsx` (wire preview and frame processor)

**Interfaces:**
- Consumes: VisionCamera frame, ML Kit eye bounding boxes.
- Produces:
  - Native Kotlin frame processor `cropAndRunEyeCNN(frame: Frame, eyeBox: BoundingBox): number` running 48x48 crop, grayscale conversion, and TFLite inference in <= 5 ms.
  - Integration with `WakeCheckEngine` at 10-15 fps.
  - Safe keyguard error handling and camera release on pause/background.

- [ ] **Step 1: Install compatible dependencies and verify alignment with `npx expo-doctor` and `npx tsc --noEmit`**
- [ ] **Step 2: Create local Kotlin Nitro frame processing module `modules/wake-vision/` with TFLite interpreter**
- [ ] **Step 3: Connect VisionCamera and ML Kit face detector frame processor**
- [ ] **Step 4: Implement frame throttle (10-15 fps) and camera release on stop/background**
- [ ] **Step 5: Test lock-screen camera error handling and verify graceful transition to `fallback`**
- [ ] **Step 6: Commit changes**
  ```bash
  git add modules/wake-vision/ app.json package.json src/wake/
  git commit -m "feat(wake): add native Kotlin eye crop TFLite processor and camera integration"
  ```

---

### Task 7: Integration, Device Checklist, & Final Verification

**Files:**
- Modify: `src/domain/dismissal-registry.ts` (enable `face` challenge)
- Modify: `src/components/challenges/FaceChallenge.tsx` (connect engine via `useWakeCheck` while preserving UI decoupling)
- Modify: `docs/device-test-checklist.md` (add Week 2 matrix & results)
- Create: `docs/week2-weaknesses.md` (5-line note of what is still weak)

**Interfaces:**
- Consumes: `WakeCheckEngine`, `useWakeCheck`, `DISMISSAL_METHODS`.
- Produces: Fully functional face dismissal step in alarm flow with Math fallback.

- [ ] **Step 1: Wire `useWakeCheck` into `FaceChallenge` and update `dismissal-registry.ts`**
- [ ] **Step 2: Verify fallback to Math challenge when camera permissions are denied or face verification times out**
- [ ] **Step 3: Populate `docs/device-test-checklist.md` with environmental, lighting, glasses, and spoof testing results**
- [ ] **Step 4: Create `docs/week2-weaknesses.md` with 5-line summary of known edge cases**
- [ ] **Step 5: Run full verification suite: `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`, `npm test`, `pytest`**
- [ ] **Step 6: Refresh graphify knowledge graph (`graphify . --code-only`)**
- [ ] **Step 7: Final commit**
  ```bash
  git add src/domain/dismissal-registry.ts src/components/challenges/FaceChallenge.tsx docs/
  git commit -m "feat(wake): complete Week 2 wake check engine integration and test documentation"
  ```
