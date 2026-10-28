/**
 * Design tokens extracted directly from design inspiration mockups and design-brief.md.
 * Flat, calm, editorial, Nothing-OS minimal styling. Strictly no shadows or gradients.
 */

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  surfaceActive: string;
  ink: string;
  muted: string;
  accentYellow: string;
  markerRed: string;
  dotInactive: string;
  border: string;
  borderSubtle: string;
  borderFocus: string;
  disabled: string;
  success: string;
  error: string;
  warning: string;
  // Controls & Switches
  switchTrackOn: string;
  switchTrackOff: string;
  switchThumb: string;
  // Backwards compatibility aliases
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryGlow: string;
  accent: string;
  accentGlow: string;
  indigoGlow: string;
}

export const lightColors: ColorPalette = {
  background: '#C4C5C1',
  surface: '#D4D5D2',
  surfaceAlt: '#B0B1AB',
  surfaceElevated: '#DCDDD9',
  surfaceActive: '#BEBFB9',
  ink: '#0D0D0D',
  muted: '#8E8F89',
  accentYellow: '#F2E63A',
  markerRed: '#E5372B',
  dotInactive: 'rgba(13, 13, 13, 0.08)',
  border: 'rgba(13, 13, 13, 0.12)',
  borderSubtle: 'rgba(13, 13, 13, 0.08)',
  borderFocus: '#F2E63A',
  disabled: '#A5A6A0',
  success: '#10B981',
  error: '#E5372B',
  warning: '#F59E0B',
  switchTrackOn: '#F2E63A',
  switchTrackOff: '#B0B1AB',
  switchThumb: '#0D0D0D',
  // Aliases
  textPrimary: '#0D0D0D',
  textSecondary: '#646560',
  textMuted: '#8E8F89',
  textInverse: '#EDEDE8',
  primary: '#F2E63A',
  primaryGlow: 'transparent',
  accent: '#F2E63A',
  accentGlow: 'transparent',
  indigoGlow: '#4F46E5',
};

export const darkColors: ColorPalette = {
  background: '#0B0B0A',
  surface: '#171716',
  surfaceAlt: '#222220',
  surfaceElevated: '#1E1E1C',
  surfaceActive: '#2C2C29',
  ink: '#EDEDE8',
  muted: '#7C7D77',
  accentYellow: '#F2E63A',
  markerRed: '#E5372B',
  dotInactive: 'rgba(237, 237, 232, 0.08)',
  border: 'rgba(237, 237, 232, 0.14)',
  borderSubtle: 'rgba(237, 237, 232, 0.08)',
  borderFocus: '#F2E63A',
  disabled: '#333330',
  success: '#34D399',
  error: '#EF4444',
  warning: '#FBBF24',
  switchTrackOn: '#F2E63A',
  switchTrackOff: '#2A2A28',
  switchThumb: '#0B0B0A',
  // Aliases
  textPrimary: '#EDEDE8',
  textSecondary: '#A5A6A0',
  textMuted: '#7C7D77',
  textInverse: '#0B0B0A',
  primary: '#F2E63A',
  primaryGlow: 'transparent',
  accent: '#F2E63A',
  accentGlow: 'transparent',
  indigoGlow: '#4F46E5',
};

/** Default colors export pointing to dark (backwards compatibility) */
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  card: 28,
  round: 56,
  pill: 999,
};

export const typography = {
  fonts: {
    light: 'InterTight_300Light',
    regular: 'InterTight_400Regular',
    medium: 'InterTight_500Medium',
    bold: 'InterTight_700Bold',
    dot: 'Doto_700Bold',
  },
  sizes: {
    giantClock: 76,
    display: 56,
    hero: 44,
    time: 36,
    h1: 32,
    h2: 24,
    h3: 20,
    bodyLarge: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    micro: 10,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  } as const,
};

// Anti-slop: zero shadows across flat Nothing-OS aesthetic
export const shadows = {
  card: {},
  glowLime: {},
  glowAccent: {},
  glowSubtle: {},
};

export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
};

export const animation = {
  fast: 150,
  normal: 240,
  slow: 320,
  breathe: 2400,
};

export const hitSlop = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
};
