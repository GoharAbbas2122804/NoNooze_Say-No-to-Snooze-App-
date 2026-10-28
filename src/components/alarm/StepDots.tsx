import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing } from '../../theme/tokens';
import { Check } from 'lucide-react-native';

export interface StepDotsProps {
  total: number;
  current: number;
  isCompleted?: boolean;
}

export function StepDots({ total, current, isCompleted = false }: StepDotsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container} testID="step-dots-container">
      <View style={styles.dotsRow}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < current || isCompleted;

          return (
            <View
              key={i}
              testID={`step-dot-${i}`}
              style={[
                styles.dot,
                {
                  backgroundColor: filled ? colors.accentYellow : colors.dotInactive,
                  borderColor: filled ? colors.accentYellow : colors.borderSubtle,
                },
              ]}
            >
              {isCompleted ? (
                <Check size={10} color="#0D0D0D" strokeWidth={3} />
              ) : null}
            </View>
          );
        })}
      </View>
      <Text
        style={[
          styles.progressText,
          { color: colors.muted, fontFamily: typography.fonts.medium },
        ]}
      >
        {isCompleted ? 'All steps complete!' : `${current} of ${total} completed`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
  },
});
