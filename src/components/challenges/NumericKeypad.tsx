import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Delete, Check } from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows, iconSizes } from '../../theme/tokens';
import * as Haptics from 'expo-haptics';

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigit,
  onBackspace,
  onSubmit,
  submitDisabled = false,
}) => {
  const handleDigitPress = (digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onDigit(digit);
  };

  const handleBackspacePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onBackspace();
  };

  const handleSubmitPress = () => {
    if (submitDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onSubmit();
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {['1', '2', '3'].map((num) => (
          <TouchableOpacity
            key={num}
            testID={`keypad-${num}`}
            style={styles.keyButton}
            onPress={() => handleDigitPress(num)}
            activeOpacity={0.75}
            accessibilityLabel={`Digit ${num}`}
            accessibilityRole="button"
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        {['4', '5', '6'].map((num) => (
          <TouchableOpacity
            key={num}
            testID={`keypad-${num}`}
            style={styles.keyButton}
            onPress={() => handleDigitPress(num)}
            activeOpacity={0.75}
            accessibilityLabel={`Digit ${num}`}
            accessibilityRole="button"
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        {['7', '8', '9'].map((num) => (
          <TouchableOpacity
            key={num}
            testID={`keypad-${num}`}
            style={styles.keyButton}
            onPress={() => handleDigitPress(num)}
            activeOpacity={0.75}
            accessibilityLabel={`Digit ${num}`}
            accessibilityRole="button"
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          testID="keypad-backspace"
          style={[styles.keyButton, styles.actionButton]}
          onPress={handleBackspacePress}
          activeOpacity={0.75}
          accessibilityLabel="Backspace"
          accessibilityRole="button"
        >
          <Delete size={iconSizes.lg} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          testID="keypad-0"
          style={styles.keyButton}
          onPress={() => handleDigitPress('0')}
          activeOpacity={0.75}
          accessibilityLabel="Digit 0"
          accessibilityRole="button"
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="keypad-submit"
          style={[
            styles.keyButton,
            styles.submitButton,
            submitDisabled && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitPress}
          activeOpacity={0.75}
          disabled={submitDisabled}
          accessibilityLabel="Submit Answer"
          accessibilityRole="button"
          accessibilityState={{ disabled: submitDisabled }}
        >
          <Check
            size={iconSizes.lg}
            color={submitDisabled ? colors.textMuted : colors.textInverse}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  keyButton: {
    flex: 1,
    minHeight: 56,
    height: 64,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
  },
  keyText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.semibold,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glowLime,
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.border,
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
});
