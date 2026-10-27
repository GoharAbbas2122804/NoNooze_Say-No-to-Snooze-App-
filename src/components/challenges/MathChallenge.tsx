import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Step } from '../../domain/types';
import { generateProblem, MathProblem, MathDifficulty } from '../../domain/math-generator';
import { NumericKeypad } from './NumericKeypad';
import { colors, spacing, radii, typography, shadows } from '../../theme/tokens';

interface MathChallengeProps {
  step: Step;
  onProgress: () => void;
  onComplete: () => void;
  initialProblem?: MathProblem;
}

export const MathChallenge: React.FC<MathChallengeProps> = ({
  step,
  onProgress,
  onComplete,
  initialProblem,
}) => {
  const difficulty = (step.options?.difficulty as MathDifficulty) || 'easy';
  const [problem, setProblem] = useState<MathProblem>(
    () => initialProblem ?? generateProblem(difficulty)
  );
  const [input, setInput] = useState<string>('');
  const [solved, setSolved] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  // Shake animation on error
  const shakeX = useSharedValue(0);

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleDigit = (digit: string) => {
    if (input.length < 5) {
      setHasError(false);
      setInput((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setHasError(false);
    setInput((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!input) return;

    const parsed = parseInt(input, 10);
    if (parsed === problem.answer) {
      // Correct!
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setInput('');
      setHasError(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onProgress();

      if (nextSolved >= step.target) {
        onComplete();
      } else {
        setProblem(generateProblem(difficulty));
      }
    } else {
      // Wrong answer
      setHasError(true);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setTimeout(() => {
        setInput('');
        setHasError(false);
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      {/* Target Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Problem {Math.min(solved + 1, step.target)} of {step.target}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round((solved / Math.max(step.target, 1)) * 100)}%
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.bar,
              { width: `${(solved / Math.max(step.target, 1)) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Problem Display Card */}
      <Animated.View
        style={[
          styles.problemCard,
          animatedShakeStyle,
          hasError && styles.problemCardError,
        ]}
      >
        <Text style={styles.questionText}>{problem.question}</Text>
        <View style={styles.equalsRow}>
          <Text style={styles.equalsSign}>=</Text>
          <View
            style={[
              styles.inputBox,
              input.length > 0 && styles.inputBoxActive,
              hasError && styles.inputBoxError,
            ]}
          >
            <Text
              testID="answer-display"
              style={[styles.inputText, hasError && styles.inputTextError]}
            >
              {input || '?'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Numeric Keypad */}
      <NumericKeypad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
        submitDisabled={input.length === 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.semibold,
  },
  progressPercentage: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
  track: {
    height: 8,
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  bar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    ...shadows.glowLime,
  },
  problemCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  problemCardError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  equalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  equalsSign: {
    color: colors.textSecondary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.light,
  },
  inputBox: {
    minWidth: 90,
    height: 60,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inputBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceActive,
    ...shadows.glowLime,
  },
  inputBoxError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  inputText: {
    color: colors.primary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
  },
  inputTextError: {
    color: colors.error,
  },
});
