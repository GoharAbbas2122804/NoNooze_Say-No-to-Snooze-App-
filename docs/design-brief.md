# NoNooze Design Brief

## 1. Vision & Emotional Target
NoNooze is an unskippable, calm, premium smart alarm application. At 5:00 AM in a dark bedroom, waking up should never feel aggressive, jarring, or anxiety-inducing. The design balances a tranquil, deep midnight canvas with vibrant functional feedback: an electric aurora lime for active progress and a sunrise amber for confident forward momentum.

---

## 2. Palette (Exact Hex & Semantic Roles)

| Token Name | Hex / Value | Semantic Role | Contrast vs `#0B101E` |
|---|---|---|---|
| `background` | `#0B101E` | Deepest midnight canvas (OLED safe, zero glare) | Base |
| `backgroundElevated` | `#10172A` | Secondary backdrops, grouped screen sections | 1.1:1 |
| `surface` | `#141A2D` | Primary card and container fill | 1.3:1 |
| `surfaceElevated` | `#1C243E` | Interactive controls, inputs, steppers | 1.6:1 |
| `surfaceActive` | `#222D4D` | Selected or pressed container states | 1.9:1 |
| `border` | `#232E4E` | Default component boundaries | 1.9:1 |
| `borderSubtle` | `rgba(255, 255, 255, 0.08)` | Translucent divider lines and card borders | — |
| `borderFocus` | `#70F464` | Focused and active ring borders | 12.8:1 |
| `primary` | `#70F464` | Aurora Lime: active toggle, progress, selected tab | 12.8:1 |
| `primaryGlow` | `rgba(112, 244, 100, 0.25)` | Aurora halo around active elements | — |
| `accent` | `#FF9500` | Sunrise Amber: FAB, hero accents, primary actions | 8.2:1 |
| `accentGlow` | `rgba(255, 149, 0, 0.25)` | Warm halo around hero buttons | — |
| `textPrimary` | `#FFFFFF` | Primary headers, active digits, essential info | 17.5:1 (AAA) |
| `textSecondary` | `#94A3B8` | Subtitles, labels, secondary metadata | 5.6:1 (AA) |
| `textMuted` | `#64748B` | Inactive icons, subtle hints, placeholders | 3.3:1 (Non-text UI AA) |
| `textInverse` | `#0B101E` | Text inside high-luminance buttons | 12.8:1 |
| `success` | `#22C55E` | Verification badges, completed step markers | 8.4:1 |
| `error` | `#EF4444` | Validation errors, destructive action badges | 4.8:1 |
| `warning` | `#F59E0B` | Exemption warnings, permission notices | 7.9:1 |
| `disabled` | `#1E293B` | Disabled button backdrops | — |
| `switchTrackOn` | `#70F464` | Alarm toggle active track | 12.8:1 |
| `switchTrackOff` | `#1E293B` | Alarm toggle inactive track | — |
| `switchThumb` | `#FFFFFF` | Alarm toggle thumb | — |

---

## 3. Typography Scale & Hierarchy

System sans-serif / Inter with clean optical spacing and tabular numerals for clock readouts.

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `hero` | 56 | 64 | 900 (Black) | Ringing screen digital clock |
| `time` | 44 | 52 | 700 (Bold) | Alarm card time display |
| `h1` | 32 | 38 | 800 (Bold) | Screen titles (`Alarm.`, `Good Morning!`) |
| `h2` | 24 | 30 | 700 (Bold) | Modal titles, section hero headers |
| `h3` | 20 | 26 | 600 (Semibold) | Subsection titles, card group headers |
| `bodyLarge` | 18 | 24 | 600 (Semibold) | Challenge questions, button text |
| `body` | 16 | 22 | 400 (Regular) | Primary readable copy, input values |
| `bodySmall` | 14 | 20 | 500 (Medium) | Card labels, secondary captions |
| `caption` | 12 | 16 | 600 (Semibold) | Badges, step counters, uppercase chips |
| `micro` | 10 | 14 | 700 (Bold) | Status tags, tiny metadata |

---

## 4. Spacing Rhythm (8pt Grid)

All padding, margins, and gaps strictly align to multiples of 4 and 8:

| Token | Pixels | Semantic Application |
|---|---|---|
| `xs` | 4px | Micro spacing, icon-to-badge gaps |
| `sm` | 8px | Tight chip gaps, compact component internal padding |
| `md` | 12px | Keypad grid gaps, card internal sub-group spacing |
| `base` | 16px | Standard card padding, input horizontal inset |
| `lg` | 20px | Major card padding, screen horizontal gutter |
| `xl` | 24px | Section separation, header-to-content gap |
| `xxl` | 32px | Screen top padding, hero section spacing |
| `xxxl` | 40px | Empty state vertical rhythm |
| `huge` | 48px | Ringing hero margin clearance |

---

## 5. Shape Language & Radii

Soft continuous curves reflecting modern mobile hardware contours:

| Token | Radius | Application |
|---|---|---|
| `sm` | 8px | Status tags, small badges |
| `md` | 12px | Compact buttons, icon containers |
| `lg` | 16px | Keypad number keys, input fields |
| `xl` | 20px | Secondary cards, permission cards |
| `xxl` | 24px | Main modal dialogs, top-level containers |
| `card` | 22px | Alarm cards, problem cards |
| `pill` | 9999px | Action buttons, FAB, day selectors, tab docks |

---

## 6. Elevation & Glow Tokens

Subtle dark-mode ambient shadows paired with soft luminescence:

- **`card`**: Offset `(0, 6)`, opacity `0.35`, radius `12`, elevation `6`, color `#000000`.
- **`glowLime`**: Offset `(0, 0)`, opacity `0.35`, radius `14`, elevation `8`, color `#70F464`.
- **`glowAccent`**: Offset `(0, 4)`, opacity `0.40`, radius `12`, elevation `8`, color `#FF9500`.
- **`glowSubtle`**: Offset `(0, 2)`, opacity `0.20`, radius `8`, elevation `4`, color `#232E4E`.

---

## 7. Icon System

- **Unified Library**: Lucide Icons (`lucide-react-native`).
- **Stroke Width**: `1.75` for medium/large icons, `2.0` for 16-20dp micro icons.
- **Sizes**:
  - `sm`: 16dp (badges, metadata)
  - `md`: 20dp (action buttons, list items)
  - `lg`: 24dp (primary navigation, header icons)
  - `xl`: 32dp (hero status indicators)
- **Zero Emojis**: Emojis are strictly banned as UI icons or structural glyphs.

---

## 8. Motion & Physics Principles

All animations run exclusively on the UI thread via `react-native-reanimated` and `moti`:

1. **Only Transform & Opacity**: Never animate layout properties (`width`, `height`, `margin`, `padding`).
2. **Screen Transitions**: Staggered entrance (`opacity: 0 -> 1`, `translateY: 12 -> 0`) in 240ms with `Easing.out(Easing.cubic)`.
3. **Press Feedback**: Smooth spring compression to `scale: 0.97` accompanied by selection haptic (`Haptics.selectionAsync()`).
4. **Ringing Pulse**: Gentle, non-anxiety breathing on the hero digital clock (duration 2200ms, scale `1.0` to `1.03`, opacity `0.9` to `1.0`), never a rapid strobe.
5. **Reduced Motion**: Automatically respect `useReducedMotion()` from Reanimated to disable spring transforms for users who prefer static presentation.

---

## 9. Do / Don't Checklist

### Do:
- Keep the canvas dark (`#0B101E`) to protect 5 AM eyes.
- Ensure all interactive touch targets are at least 48x48dp.
- Always provide clear visual states: Default, Pressed, Disabled, Error, Loading.
- Use Lucide vector icons exclusively with semantic token colors.
- Maintain at least 4.5:1 text contrast for body copy and 3:1 for graphical UI controls.

### Don't:
- Never flash full-screen white or jarring high-frequency strobe colors.
- Never use emojis as functional icons (e.g. no ⏰, 🛡️, 🔔, ☀️).
- Never write ad-hoc hex values inside screens or components.
- Never execute layout-triggering JS thread animations.
- Never place interactive elements within iOS/Android unsafe boundary zones.
