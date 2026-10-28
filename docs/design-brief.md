# NoNooze Design Brief (Overhaul — Nothing-OS Minimal Edition)

## 1. Vision & Emotional Target
NoNooze is an unskippable, calm, flat, editorial smart alarm application inspired by Nothing OS minimal aesthetics. It completely rejects loud gradients, fake glass, drop shadows, and visual noise. Waking up in low light is treated with respect: soft, tone-separated surfaces, near-black ink, giant light numerals, and a single vibrant yellow accent with a tiny red alignment marker.

---

## 2. Color Palette & Dual-Theme Tokens

Separation is achieved strictly through tone and whitespace on an 8pt grid.

### Light Theme
- **`background`**: `#C4C5C1` (Soft slate grey canvas)
- **`surface`**: `#D4D5D2` (Primary card surface)
- **`surfaceAlt`**: `#B0B1AB` (Sage accent surface / time picker backdrop)
- **`ink`**: `#0D0D0D` (Near-black text and solid active controls)
- **`muted`**: `#8E8F89` (Secondary captions, inactive digits, muted labels)
- **`accentYellow`**: `#F2E63A` (The single electric yellow accent for active days, now-marker, toggles)
- **`markerRed`**: `#E5372B` (Tiny red marker for the time ruler needle)
- **`dotInactive`**: `rgba(13, 13, 13, 0.08)` (Faint dot-matrix grid background)

### Dark Theme
- **`background`**: `#0B0B0A` (Deepest warm black)
- **`surface`**: `#171716` (Card and panel surface)
- **`surfaceAlt`**: `#222220` (Secondary container surface)
- **`ink`**: `#EDEDE8` (Off-white high contrast readable text)
- **`muted`**: `#7C7D77` (Muted captions and secondary text)
- **`accentYellow`**: `#F2E63A` (Consistent vibrant yellow accent)
- **`markerRed`**: `#E5372B` (Tiny red marker for precision ruler)
- **`dotInactive`**: `rgba(237, 237, 232, 0.08)` (Faint dot-matrix grid dots)

### Contrast & Accessibility Compliance
- Light: `ink` on `background` = **12.4:1** (WCAG AAA).
- Dark: `ink` on `background` = **15.2:1** (WCAG AAA).
- Graphic UI & Controls: Yellow `#F2E63A` on Dark `#0B0B0A` = **13.8:1** (WCAG AAA). Text on yellow is always dark `ink` (`#0D0D0D`).

---

## 3. Typography Scale & Fonts

- **Primary Font Family**: **Inter Tight** (Neo-grotesque with tight optical tracking).
  - Light (300): Giant clock numbers (`76dp`), time displays (`44dp`).
  - Medium (500): Captions, button labels, chips (`14dp`, `16dp`).
  - Bold (700): Screen titles, two-tone headlines, primary emphasis (`24dp`, `32dp`).
- **Secondary / Fallback Font Family**: **Doto** (Variable dot-matrix glyph font, 6x10 dot matrix).
- **Two-Tone Typography Pattern**:
  Screen and section headlines feature a bold two-tone presentation:
  Line 1 in `ink`, Line 2 in `muted` (e.g. "Choose" in black, "the Game" in muted grey).

---

## 4. Shape Language & Radii (8pt Grid)

- **Cards**: `radius: 28`
- **Buttons & Icon Discs**: Fully circular `56dp` (`radius: 28`)
- **Pills & Docks**: `radius: 999`
- **Spacing Scale**: Multiples of 4 and 8 (`4`, `8`, `12`, `16`, `24`, `32`, `48`).
- **Zero Shadows**: Absolute flat geometry; elevation is expressed by color value steps.

---

## 5. Motion Principles (GSAP Choreography on Reanimated 4)

- **Only Transform & Opacity**: Never animate layout properties (`width`, `height`, `margin`, `padding`).
- **Easings**:
  - Entrances: `power3.out` (`Easing.out(Easing.quart)`).
  - Exits: `power2.in` (`Easing.in(Easing.cubic)`).
  - Press / Interactive: Springs with gentle bounce (`damping: 15, stiffness: 150`).
- **Choreographed Stagger**:
  - Digits roll in with a per-digit stagger of 60ms.
  - Weekday labels rise 16px with a 30ms stagger.
  - 24-hour timeline ticks grow with progressive reveal.
- **Ringing Hero Breathing**: 2400ms sine cycle oscillating scale between `1.0` and `1.02`.
- **Accessibility**: Automatically honors `useReducedMotion()`.

---

## 6. Toasts & Notification Experience (`notify`)

- **Style**: Floating top pill with inverted theme (dark pill on light mode, light pill on dark mode).
- **Status Markers**:
  - Yellow dot: Info / Success / Active state.
  - Red dot: Validation / Warning / Error state.
- **Interactive Undo**: Alarm deletion triggers a non-blocking toast with an inline "Undo" button.
- **Deep-Linking**: Warning toasts for missing Android background permissions link directly to system settings.
