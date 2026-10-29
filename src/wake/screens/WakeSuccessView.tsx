import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { typography, spacing } from '../../theme/tokens';

export interface WakeSuccessViewProps {
  durationSeconds?: number;
  alertness?: number;
  onComplete: () => void;
}

export function WakeSuccessView({
  durationSeconds = 6,
  alertness = 82,
  onComplete,
}: WakeSuccessViewProps) {
  const { colors } = useTheme();

  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    scale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 180 }),
      withSpring(1.0, { damping: 14, stiffness: 150 })
    );
    opacity.value = withTiming(1, { duration: 300 });

    const timer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => clearTimeout(timer);
  }, [scale, opacity, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="wake-success-view">
      <TwoToneTitle primary="Awake." secondary="Face check passed" />

      <View style={styles.centerSection}>
        <Animated.View
          style={[
            styles.checkCircle,
            { backgroundColor: colors.accentYellow },
            animatedStyle,
          ]}
        >
          <Check size={48} color="#0D0D0D" strokeWidth={3} />
        </Animated.View>

        <Text style={[styles.summaryText, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
          Verified in {durationSeconds}s · Alertness {alertness}%
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
          Alarm dismissed. Ready for your day.
        </Text>
      </View>

      <View style={styles.footerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  summaryText: {
    fontSize: typography.sizes.h3,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.bodySmall,
    textAlign: 'center',
  },
  footerSpacer: {
    height: 60,
  },
});
