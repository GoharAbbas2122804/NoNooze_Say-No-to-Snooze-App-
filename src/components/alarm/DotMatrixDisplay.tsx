import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';

export interface DotMatrixDisplayProps {
  hours: string;
  minutes: string;
  seconds: string;
  dotSize?: number;
  gap?: number;
}

// 5 columns x 7 rows standard bitmap matrices for digits 0-9
const DIGIT_BITMAPS: Record<string, number[][]> = {
  '0': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  '1': [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  '2': [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  '3': [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  '4': [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
  ],
  '5': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  '6': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  '7': [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
  ],
  '8': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  '9': [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
};

function MatrixDigit({
  char,
  activeColor,
  inactiveColor,
  dotSize = 5,
  gap = 3,
}: {
  char: string;
  activeColor: string;
  inactiveColor: string;
  dotSize?: number;
  gap?: number;
}) {
  const matrix = DIGIT_BITMAPS[char] || DIGIT_BITMAPS['0'];

  return (
    <View style={[styles.digitMatrix, { gap }]}>
      {matrix.map((row, rIdx) => (
        <View key={rIdx} style={[styles.digitRow, { gap }]}>
          {row.map((active, cIdx) => (
            <View
              key={cIdx}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: active ? activeColor : inactiveColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function DotMatrixDisplay({
  hours,
  minutes,
  seconds,
  dotSize = 6,
  gap = 3.5,
}: DotMatrixDisplayProps) {
  const { colors } = useTheme();

  return (
    <View testID="dot-matrix-clock" style={styles.clockContainer}>
      {/* Hours Stack */}
      <View style={styles.stackRow}>
        <MatrixDigit
          char={hours[0] || '0'}
          activeColor={colors.ink}
          inactiveColor={colors.dotInactive}
          dotSize={dotSize}
          gap={gap}
        />
        <MatrixDigit
          char={hours[1] || '0'}
          activeColor={colors.ink}
          inactiveColor={colors.dotInactive}
          dotSize={dotSize}
          gap={gap}
        />
      </View>

      {/* Minutes Stack */}
      <View style={styles.stackRow}>
        <MatrixDigit
          char={minutes[0] || '0'}
          activeColor={colors.ink}
          inactiveColor={colors.dotInactive}
          dotSize={dotSize}
          gap={gap}
        />
        <MatrixDigit
          char={minutes[1] || '0'}
          activeColor={colors.ink}
          inactiveColor={colors.dotInactive}
          dotSize={dotSize}
          gap={gap}
        />
      </View>

      {/* Seconds Stack (Muted light grey) */}
      <View style={styles.stackRow}>
        <MatrixDigit
          char={seconds[0] || '0'}
          activeColor={colors.muted}
          inactiveColor={colors.dotInactive}
          dotSize={dotSize}
          gap={gap}
        />
        <MatrixDigit
          char={seconds[1] || '0'}
          activeColor={colors.muted}
          inactiveColor={colors.dotInactive}
          dotSize={dotSize}
          gap={gap}
        />
      </View>

      {/* Fallback accessible semantic text for screen readers */}
      <Text style={styles.accessibleLabel} accessibilityLiveRegion="polite">
        {`${hours}:${minutes}:${seconds}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  digitMatrix: {
    flexDirection: 'column',
  },
  digitRow: {
    flexDirection: 'row',
  },
  accessibleLabel: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
});
