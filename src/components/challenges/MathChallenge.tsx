import React, { useState, useCallback } from 'react';
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

  // Shake animation
  const shakeX = useSharedValue(0);

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeX]);

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
        <Text style={styles.progressText}>
          Problem {Math.min(solved + 1, step.target)} of {step.target}
        </Text>
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
              hasError && styles.inputBoxError,
              input.length > 0 && styles.inputBoxActive,
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
    gap: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  track: {
    height: 6,
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
  },
  problemCard: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
  },
  problemCardError: {
    borderColor: colors.error,
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  equalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  equalsSign: {
    color: colors.textSecondary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.regular,
  },
  inputBox: {
    minWidth: 80,
    height: 56,
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
  },
  inputBoxError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
