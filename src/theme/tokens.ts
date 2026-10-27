/**
 * Design tokens extracted directly from design inspiration mockups and design-brief.md.
 * Strictly follow these tokens across all UI components - no inline hex codes.
 */

export const colors = {
  background: '#0B101E',
  backgroundElevated: '#10172A',
  surface: '#141A2D',
  surfaceElevated: '#1C243E',
  surfaceActive: '#222D4D',
  border: '#232E4E',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#70F464',

  // Brand Accents
  primary: '#70F464', // Neon lime from inspirations
  primaryGlow: 'rgba(112, 244, 100, 0.25)',
  accent: '#FF9500', // Amber/orange FAB & secondary
  accentGlow: 'rgba(255, 149, 0, 0.25)',
  indigoGlow: '#4F46E5',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B101E',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  disabled: '#1E293B',

  // Controls
  switchTrackOn: '#70F464',
  switchTrackOff: '#1E293B',
  switchThumb: '#FFFFFF',

  // Gradients
  cardGradient: ['#1C243E', '#141A2D'] as const,
  screenGradient: ['#0B101E', '#10172A', '#131A30'] as const,
  accentGradient: ['#FF9500', '#F59E0B'] as const,
  primaryGradient: ['#70F464', '#4ADE80'] as const,
};

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
  card: 22,
  pill: 9999,
};

export const typography = {
  sizes: {
    hero: 56,
    time: 44,
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

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  glowLime: {
    shadowColor: '#70F464',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  glowAccent: {
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  glowSubtle: {
    shadowColor: '#232E4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const animation = {
  fast: 150,
  normal: 240,
  slow: 320,
  breathe: 2200,
};

export const hitSlop = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
};
