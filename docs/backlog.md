# NoNooze Technical & Quality Backlog

This backlog tracks non-critical enhancements, polish, and refactor items deferred from Week 1 per the strict Fix Policy (Fix ONLY: alarm does not ring, rings late, can be dismissed without finishing, crashes, or loses data).

---

## Priority Scale
- **P1 (High):** Technical hygiene, code consistency, and test harness polish before scaling Week 2.
- **P2 (Medium):** User experience and edge-case enhancements not blocking core alarm flow.
- **P3 (Low):** Nice-to-have cosmetic polish and long-term maintainability items.

---

## Backlog Items

### 1. Hex Color Token Consolidation (P1)
- **Location:** `src/app/permissions.tsx`, `src/app/edit.tsx`, `src/components/challenges/NumericKeypad.tsx`, `src/components/challenges/FaceChallenge.tsx`
- **Description:** Replace remaining hardcoded hex colors (`#0D0D0D` for dark ink text on yellow badges, `#141413`, `#E2E3DF`) with semantic token references (`colors.ink`, `colors.surfaceAlt`) from `src/theme/tokens.ts`.
- **Reason Deferred:** Pure visual refactoring; does not impact alarm scheduling or dismissal reliability.

### 2. Jest Worker Teardown Cleanup (P1)
- **Location:** `jest.config.js`, `jest-setup.js`
- **Description:** Resolve Jest notice `A worker process has failed to exit gracefully and has been force exited` emitted during parallel test runs under high CPU contention.
- **Reason Deferred:** Tests pass 100% (126/126 green) and zero open handles are detected under `--runInBand`.

### 3. Custom Audio Metadata & Waveform Preview (P2)
- **Location:** `src/services/sound-service.ts`, `src/app/permissions.tsx`
- **Description:** When user imports custom MP3 audio files via `expo-document-picker`, extract true track duration and display audio waveform preview in sound picker modal.
- **Reason Deferred:** Custom sound selection and playback function correctly; metadata extraction is non-critical.

### 4. Continuous Sound Preview Toggle in Settings (P2)
- **Location:** `src/app/permissions.tsx:124`
- **Description:** Provide a stop button or auto-timeout for audio preview in settings so users can halt preview audio without leaving the screen.
- **Reason Deferred:** Previews play once and stop; alarm volume adjustment works reliably.

### 5. Animated Tab Transitions in Challenges Playground (P2)
- **Location:** `src/app/challenges.tsx`
- **Description:** Implement shared element or spring horizontal sliding animation when switching between challenge tabs in the preview screen.
- **Reason Deferred:** Tab selection functions cleanly via state; motion polish deferred to UI refinement pass.

### 6. Accessibility Screen Reader Hints on Keypad (P3)
- **Location:** `src/components/challenges/NumericKeypad.tsx`
- **Description:** Add explicit `accessibilityLabel` (e.g. "Number 5", "Backspace", "Submit Answer") to keypad touch targets for WCAG 2.1 AA compliance.
- **Reason Deferred:** Keypad works with numeric voiceover defaults; full accessibility pass scheduled before store submission.

### 7. Localized Countdown Strings (P3)
- **Location:** `src/app/index.tsx:79-91`
- **Description:** Abstract "The next alarm clock in X hours Y min" into i18n localization helper for future multi-language support.
- **Reason Deferred:** English default meets current specifications.
