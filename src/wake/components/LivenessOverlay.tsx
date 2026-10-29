/**
 * LivenessOverlay — slide-up card with active liveness challenge:
 * - TwoToneTitle: "Blink / twice", "Turn your head / left", "Look / up"
 * - Directional arrow animation / blinking eye animation
 * - Progress indicator and per-blink fill dots
 * - 3-oscillation failure shake
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, ArrowUp, Eye } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { radii, spacing, typography } from '../../theme/tokens';
import { LivenessChallenge } from '../contract';

interface LivenessOverlayProps {
  challenge?: LivenessChallenge;
  remainingMs?: number;
  totalMs?: number;
  visible: boolean;
  failedShake?: boolean;
}

export function LivenessOverlay({
  challenge,
  remainingMs = 5000,
  totalMs = 5000,
  visible,
  failedShake = false,
}: LivenessOverlayProps) {
  const { colors } = useTheme();

  // Slide up entrance
  const translateY = useSharedValue(260);
  const opacity = useSharedValue(0);

  // Failure shake
  const shakeX = useSharedValue(0);

  // Arrow directional travel
  const arrowTravel = useSharedValue(0);

  useEffect(() => {
    if (visible && challenge) {
      translateY.value = withSpring(0, { damping: 16, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(260, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, challenge, translateY, opacity]);

  useEffect(() => {
    if (failedShake) {
      shakeX.value = withSequence(
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [failedShake, shakeX]);

  useEffect(() => {
    arrowTravel.value = withRepeat(
      withTiming(12, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [arrowTravel]);

  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: shakeX.value },
    ],
  }));

  const arrowAnimStyle = useAnimatedStyle(() => {
    if (!challenge) return {};
    if (challenge.kind === 'turn' && challenge.direction === 'left') {
      return { transform: [{ translateX: -arrowTravel.value }] };
    }
    if (challenge.kind === 'turn' && challenge.direction === 'right') {
      return { transform: [{ translateX: arrowTravel.value }] };
    }
    if (challenge.kind === 'look-up') {
      return { transform: [{ translateY: -arrowTravel.value }] };
    }
    return {};
  });

  if (!visible || !challenge) return null;

  const getTitle = () => {
    if (challenge.kind === 'blink') {
      return { primary: 'Blink', secondary: challenge.count === 1 ? 'once' : 'twice' };
    }
    if (challenge.kind === 'turn') {
      return { primary: 'Turn your head', secondary: challenge.direction };
    }
    return { primary: 'Look', secondary: 'up' };
  };

  const title = getTitle();
  const progressRatio = Math.max(0, Math.min(1, remainingMs / totalMs));

  return (
    <Animated.View
      testID="liveness-overlay"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
        containerAnimStyle,
      ]}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Liveness challenge: ${title.primary} ${title.secondary}`}
    >
      <TwoToneTitle primary={title.primary} secondary={title.secondary} />

      {/* Directional Icon or Blink Dots */}
      <View style={styles.actionRow}>
        <Animated.View style={[styles.arrowWrapper, arrowAnimStyle]}>
          {challenge.kind === 'turn' && challenge.direction === 'left' && (
            <ArrowLeft size={36} color={colors.accentYellow} strokeWidth={2.5} />
          )}
          {challenge.kind === 'turn' && challenge.direction === 'right' && (
            <ArrowRight size={36} color={colors.accentYellow} strokeWidth={2.5} />
          )}
          {challenge.kind === 'look-up' && (
            <ArrowUp size={36} color={colors.accentYellow} strokeWidth={2.5} />
          )}
          {challenge.kind === 'blink' && (
            <Eye size={36} color={colors.accentYellow} strokeWidth={2.5} />
          )}
        </Animated.View>

        {challenge.kind === 'blink' && (
          <View style={styles.blinkDotsRow}>
            {Array.from({ length: challenge.count }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.blinkDot,
                  {
                    backgroundColor: colors.accentYellow,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Timer Bar */}
      <View style={[styles.timerTrack, { backgroundColor: colors.surfaceAlt }]}>
        <View
          style={[
            styles.timerFill,
            {
              width: `${progressRatio * 100}%`,
              backgroundColor: colors.accentYellow,
            },
          ]}
        />
      </View>

      <Text style={[styles.hintNote, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
        Hold still in frame while moving
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: spacing.base,
    left: spacing.base,
    right: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.base,
    zIndex: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    gap: spacing.base,
  },
  arrowWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blinkDotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  blinkDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timerTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
    marginVertical: spacing.xs,
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
  },
  hintNote: {
    fontSize: typography.sizes.micro,
    textAlign: 'center',
    marginTop: 4,
  },
});
