import { Easing } from 'react-native-reanimated';

/**
 * Maps GSAP easing names to Reanimated 4 Easing functions.
 * Strict, high-performance UI-thread easings.
 */
export const GSAPEasings = {
  // Power1 (Quadratic)
  power1: {
    in: Easing.in(Easing.quad),
    out: Easing.out(Easing.quad),
    inOut: Easing.inOut(Easing.quad),
  },
  // Power2 (Cubic) - Standard interactive exits & subtle rolls
  power2: {
    in: Easing.in(Easing.cubic),
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  // Power3 (Quartic) - Standard crisp entrances
  power3: {
    in: Easing.in(Easing.poly(4)),
    out: Easing.out(Easing.poly(4)),
    inOut: Easing.inOut(Easing.poly(4)),
  },
  // Power4 (Quintic) - Dramatic settles
  power4: {
    in: Easing.in(Easing.poly(5)),
    out: Easing.out(Easing.poly(5)),
    inOut: Easing.inOut(Easing.poly(5)),
  },
  // Exponential
  expo: {
    in: Easing.in(Easing.exp),
    out: Easing.out(Easing.exp),
    inOut: Easing.inOut(Easing.exp),
  },
  // Back (Overshoot)
  back: {
    in: (s = 1.70158) => Easing.in(Easing.back(s)),
    out: (s = 1.70158) => Easing.out(Easing.back(s)),
    inOut: (s = 1.70158) => Easing.inOut(Easing.back(s)),
  },
  // Elastic (Spring oscillations)
  elastic: {
    in: (b = 1) => Easing.in(Easing.elastic(b)),
    out: (b = 1) => Easing.out(Easing.elastic(b)),
    inOut: (b = 1) => Easing.inOut(Easing.elastic(b)),
  },
  // Linear / Sine
  sine: {
    inOut: Easing.inOut(Easing.sin),
  },
  linear: Easing.linear,
};
