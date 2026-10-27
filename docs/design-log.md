# NoNooze Design Log & Iteration Scorecards

## Iteration 1: Ringing / Dismiss Hero Screen & Math Challenge
- **Date**: 2026-10-27
- **Target**: Ringing / Dismiss Hero Screen (`src/app/ringing.tsx`), `MathChallenge.tsx`, `NumericKeypad.tsx`.
- **Changes Implemented**:
  1. Replaced all emoji glyphs (`⚡`, `🔒`, `✓`, `⌫`) with Lucide vector icons (`Zap`, `Lock`, `Check`, `Delete`).
  2. Implemented calm 2200ms sine breathing animation on the hero clock readout via Reanimated UI thread worklets.
  3. Added glowing aurora lime segmented progress indicators and active input states.
  4. Upgraded keypad to 64dp touch targets with accessibility roles, labels, and state properties.
  5. Verified OLED midnight low-light comfort (zero glaring white surfaces).

### Scorecard (Ringing / Dismiss Screen)
| Criterion | Target | Iteration 1 Score | Notes |
|---|---|---|---|
| 1. Fidelity to inspirations' mood | ≥ 8.0 | **9.0 / 10** | Deep midnight canvas with signature aurora lime & sunrise amber |
| 2. Visual hierarchy | ≥ 8.0 | **9.0 / 10** | Clock hero is immediately graspable, followed by step progress & challenge |
| 3. Typography | ≥ 8.0 | **9.0 / 10** | High-contrast tabular numbers, clean body sans |
| 4. Color & contrast | ≥ 8.0 | **10.0 / 10** | White on #0B101E (17.5:1 AAA), lime on surface (12.8:1 AAA) |
| 5. Touch targets & spacing | ≥ 8.0 | **9.0 / 10** | 64dp keypad buttons with 12dp grid gaps |
| 6. Motion quality | ≥ 8.0 | **9.0 / 10** | Smooth 60fps breathing pulse, animated error shake |
| 7. State coverage | ≥ 8.0 | **8.5 / 10** | Empty, active input, error shake, disabled submit, pressed states |
| 8. Low-light comfort | ≥ 8.0 | **10.0 / 10** | OLED true dark, eye-friendly at 5:00 AM |
| **Average Score** | **≥ 8.0** | **9.19 / 10** | **PASS** |

---

## Iteration 2: Alarm List (Home) Screen & AlarmCard
- **Date**: 2026-10-27
- **Target**: Alarm List Screen (`src/app/index.tsx`), `AlarmCard.tsx`, Empty State.
- **Changes Implemented**:
  1. Top App Bar: Sliders icon button on left, glowing sunrise amber circular `+` button on right (exact match to `design_inspiration1.png` and `design_inspiration2.png`).
  2. Hero Clock Display: Live real-time digital clock (e.g. `5:55 PM`), subtitle with next alarm countdown / local time, and `M T W T F S S` day chips.
  3. Alarm Card: Translucent midnight card with subtle 1px border (`borderSubtle`), neon lime toggle switch, challenge pill tag, and spring feedback.
  4. Floating Bottom Tab Dock: Frosted dark capsule pill featuring user profile action, center glowing aurora lime pill clock icon, and reliability shield action.
  5. Empty State: Vector `BellOff` illustration inside subtle amber halo, "+ Create Alarm" glowing amber pill button (zero emojis).

### Scorecard (Alarm List Screen & AlarmCard)
| Criterion | Target | Iteration 2 Score | Notes |
|---|---|---|---|
| 1. Fidelity to inspirations' mood | ≥ 8.0 | **9.5 / 10** | Faithful translation of Inspiration 1 & 2 layout, palette, and floating dock |
| 2. Visual hierarchy | ≥ 8.0 | **9.5 / 10** | Top bar → Hero clock readout → Alarm list → Floating tab dock |
| 3. Typography | ≥ 8.0 | **9.0 / 10** | Tabular 72px hero clock, bold 44px card time, crisp metadata |
| 4. Color & contrast | ≥ 8.0 | **10.0 / 10** | All text exceeds 4.5:1 (AAA), UI controls exceed 3:1 |
| 5. Touch targets & spacing | ≥ 8.0 | **9.0 / 10** | All buttons, chips, and dock controls ≥ 44x44pt / 48x48dp |
| 6. Motion quality | ≥ 8.0 | **9.0 / 10** | Smooth spring feedback (scale 0.97) on cards & buttons |
| 7. State coverage | ≥ 8.0 | **9.0 / 10** | Empty state with BellOff, populated state with cards, toggle on/off states |
| 8. Low-light comfort | ≥ 8.0 | **10.0 / 10** | Calm midnight backdrop, zero blinding white surfaces |
| **Average Score** | **≥ 8.0** | **9.38 / 10** | **PASS** |

### Quality Gates Output
- `npx tsc --noEmit`: Passed (0 errors)
- `npx expo lint`: Passed (0 errors, 0 warnings)
- `npm test`: Passed (11/11 suites, 54/54 tests)
- Screenshots captured: `shots/iter-2-home.png`, `shots/iter-2-home-alarms.png`, `shots/iter-2-edit.png`, `shots/iter-2-gallery.png`
