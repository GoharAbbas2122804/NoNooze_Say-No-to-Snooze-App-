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
import { StepDots } from '../alarm/StepDots';
import { useTheme } from '../../theme/ThemeProvider';
import { notify } from '../../ui/notify';
import { spacing, radii, typography } from '../../theme/tokens';

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
  const { colors } = useTheme();
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
      notify.error('Incorrect, try again');
      setTimeout(() => {
        setInput('');
        setHasError(false);
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      {/* Target Progress Dots */}
      <StepDots
        total={step.target}
        current={solved}
        isCompleted={solved >= step.target}
      />

      {/* Problem Display Card */}
      <Animated.View
        style={[
          styles.problemCard,
          {
            backgroundColor: colors.surface,
            borderColor: hasError ? colors.error : colors.borderSubtle,
          },
          animatedShakeStyle,
        ]}
      >
        <Text
          style={[
            styles.questionText,
            { color: colors.ink, fontFamily: typography.fonts.bold },
          ]}
        >
          {problem.question}
        </Text>
        <View style={styles.equalsRow}>
          <Text
            style={[
              styles.equalsSign,
              { color: colors.muted, fontFamily: typography.fonts.light },
            ]}
          >
            =
          </Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: hasError
                  ? colors.error
                  : input.length > 0
                  ? colors.accentYellow
                  : colors.borderSubtle,
              },
            ]}
          >
            <Text
              testID="answer-display"
              style={[
                styles.inputText,
                {
                  color: hasError ? colors.error : colors.ink,
                  fontFamily: typography.fonts.bold,
                },
              ]}
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
    gap: spacing.base,
  },
  problemCard: {
    width: '100%',
    borderRadius: radii.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  questionText: {
    fontSize: typography.sizes.hero,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  equalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  equalsSign: {
    fontSize: typography.sizes.h1,
  },
  inputBox: {
    minWidth: 90,
    height: 56,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inputText: {
    fontSize: typography.sizes.h1,
  },
});
