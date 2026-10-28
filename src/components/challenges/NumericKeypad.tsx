import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Delete, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { RoundButton } from '../ui/RoundButton';
import { spacing, typography, iconSizes } from '../../theme/tokens';
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
  const { colors } = useTheme();

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
          <RoundButton
            key={num}
            testID={`keypad-${num}`}
            size={64}
            variant="surface"
            accessibilityLabel={`Digit ${num}`}
            onPress={() => handleDigitPress(num)}
          >
            <Text
              style={[
                styles.keyText,
                { color: colors.ink, fontFamily: typography.fonts.bold },
              ]}
            >
              {num}
            </Text>
          </RoundButton>
        ))}
      </View>

      <View style={styles.row}>
        {['4', '5', '6'].map((num) => (
          <RoundButton
            key={num}
            testID={`keypad-${num}`}
            size={64}
            variant="surface"
            accessibilityLabel={`Digit ${num}`}
            onPress={() => handleDigitPress(num)}
          >
            <Text
              style={[
                styles.keyText,
                { color: colors.ink, fontFamily: typography.fonts.bold },
              ]}
            >
              {num}
            </Text>
          </RoundButton>
        ))}
      </View>

      <View style={styles.row}>
        {['7', '8', '9'].map((num) => (
          <RoundButton
            key={num}
            testID={`keypad-${num}`}
            size={64}
            variant="surface"
            accessibilityLabel={`Digit ${num}`}
            onPress={() => handleDigitPress(num)}
          >
            <Text
              style={[
                styles.keyText,
                { color: colors.ink, fontFamily: typography.fonts.bold },
              ]}
            >
              {num}
            </Text>
          </RoundButton>
        ))}
      </View>

      <View style={styles.row}>
        <RoundButton
          testID="keypad-backspace"
          size={64}
          variant="surfaceAlt"
          accessibilityLabel="Backspace"
          onPress={handleBackspacePress}
        >
          <Delete size={iconSizes.md} color={colors.ink} />
        </RoundButton>

        <RoundButton
          testID="keypad-0"
          size={64}
          variant="surface"
          accessibilityLabel="Digit 0"
          onPress={() => handleDigitPress('0')}
        >
          <Text
            style={[
              styles.keyText,
              { color: colors.ink, fontFamily: typography.fonts.bold },
            ]}
          >
            0
          </Text>
        </RoundButton>

        <RoundButton
          testID="keypad-submit"
          size={64}
          variant={submitDisabled ? 'surface' : 'accentYellow'}
          disabled={submitDisabled}
          accessibilityLabel="Submit Answer"
          onPress={handleSubmitPress}
        >
          <Check
            size={iconSizes.lg}
            color={submitDisabled ? colors.muted : '#0D0D0D'}
            strokeWidth={3}
          />
        </RoundButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.base,
    gap: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  keyText: {
    fontSize: typography.sizes.h2,
  },
});
