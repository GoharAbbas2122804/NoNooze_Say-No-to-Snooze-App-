import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { MatrixDigit } from './DotMatrixDisplay';

export interface DotMatrixCountdownProps {
  seconds: number;
  dotSize?: number;
  gap?: number;
  label?: string;
}

export function DotMatrixCountdown({
  seconds,
  dotSize = 5,
  gap = 2.5,
  label = 'HOLD',
}: DotMatrixCountdownProps) {
  const { colors } = useTheme();
  const clampedSecs = Math.max(0, Math.round(seconds));
  const str = clampedSecs.toString();

  return (
    <View style={styles.container} accessible accessibilityRole="timer" accessibilityLabel={`${clampedSecs} seconds remaining`}>
      <View style={styles.row}>
        {str.split('').map((char, idx) => (
          <MatrixDigit
            key={idx}
            char={char}
            activeColor={colors.accentYellow}
            inactiveColor={colors.dotInactive}
            dotSize={dotSize}
            gap={gap}
          />
        ))}
      </View>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: colors.muted },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
