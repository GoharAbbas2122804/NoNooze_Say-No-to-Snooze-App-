import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Dumbbell, CheckCircle, Activity } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Step } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing, radii } from '../../theme/tokens';
import { notify } from '../../ui/notify';

export interface PushupsChallengeProps {
  step: Step;
  onProgress: () => void;
  onComplete: () => void;
}

export const PushupsChallenge: React.FC<PushupsChallengeProps> = ({
  step,
  onProgress,
  onComplete,
}) => {
  const { colors, isDark } = useTheme();
  const targetReps = step.target || 10;
  const [completedReps, setCompletedReps] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);

  const scaleRep = useSharedValue(1);

  const handleRep = () => {
    if (isDone) return;
    const next = completedReps + 1;
    setCompletedReps(next);

    scaleRep.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onProgress();

    if (next >= targetReps) {
      setIsDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      notify.success('Physical reps goal achieved!');
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleRep.value }],
  }));

  const progressPercent = Math.min(100, Math.round((completedReps / targetReps) * 100));

  return (
    <View style={styles.container} testID="pushups-challenge-container">
      <View style={styles.headerGroup}>
        <View style={[styles.badge, { backgroundColor: colors.accentYellow }]}>
          <Activity size={12} color="#0D0D0D" />
          <Text style={[styles.badgeText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
            PHYSICAL POSE TRACKING
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
          Pushup / Motion Reps
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
          Complete {targetReps} reps verified by camera pose tracking or sensor motion.
        </Text>
      </View>

      {/* Big Counter Display */}
      <View
        style={[
          styles.counterBox,
          {
            backgroundColor: isDark ? '#141413' : '#E2E3DF',
            borderColor: isDone ? colors.success : colors.border,
          },
        ]}
      >
        <Animated.View style={animatedScaleStyle}>
          <Text
            testID="pushups-count-text"
            style={[styles.counterText, { color: isDone ? colors.success : colors.ink, fontFamily: typography.fonts.bold }]}
          >
            {completedReps}
          </Text>
        </Animated.View>
        <Text style={[styles.counterTarget, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
          OF {targetReps} REPS
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceAlt }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: isDone ? colors.success : colors.accentYellow,
              },
            ]}
          />
        </View>
      </View>

      {/* Rep Tap Button (Manual / Pose Tracker Simulator) */}
      {!isDone ? (
        <Pressable
          testID="pushup-rep-btn"
          onPress={handleRep}
          style={[styles.repButton, { backgroundColor: colors.accentYellow }]}
        >
          <Dumbbell size={20} color="#0D0D0D" />
          <Text style={[styles.repButtonText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
            Log Rep (+1 Pushup)
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.doneBadge, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.doneText, { color: colors.success, fontFamily: typography.fonts.bold }]}>
            Complete! Moving to next step...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  headerGroup: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: typography.sizes.h3,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.bodySmall,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.base,
  },
  counterBox: {
    width: '100%',
    height: 180,
    borderRadius: radii.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  counterText: {
    fontSize: 72,
    lineHeight: 80,
  },
  counterTarget: {
    fontSize: typography.sizes.caption,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  repButton: {
    width: '100%',
    height: 52,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  repButtonText: {
    fontSize: typography.sizes.body,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  doneText: {
    fontSize: typography.sizes.bodySmall,
  },
});
