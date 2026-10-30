import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';

export function BlinkingEyesMiniIllustration() {
  const { colors } = useTheme();

  // Eye open/blink scaleY
  const eyeScaleY = useSharedValue(1);

  useEffect(() => {
    eyeScaleY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0.1, { duration: 120 }), // blink shut
        withTiming(1, { duration: 140 }),   // open
        withDelay(
          200,
          withSequence(
            withTiming(0.1, { duration: 100 }), // double blink shut
            withTiming(1, { duration: 120 })    // open
          )
        )
      ),
      -1,
      false
    );
  }, [eyeScaleY]);

  const eyeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyeScaleY.value }],
  }));

  // A 5x4 dot grid with two animated bright eye centers
  return (
    <View style={styles.gridContainer} testID="blinking-eyes-mini">
      {/* 4 rows of 6 dots */}
      {Array.from({ length: 4 }).map((_, row) => (
        <View key={row} style={styles.gridRow}>
          {Array.from({ length: 7 }).map((_, col) => {
            const isLeftEye = row === 1 && (col === 1 || col === 2);
            const isRightEye = row === 1 && (col === 4 || col === 5);

            if (isLeftEye || isRightEye) {
              return (
                <Animated.View
                  key={col}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.accentYellow },
                    eyeAnimStyle,
                  ]}
                />
              );
            }

            return (
              <View
                key={col}
                style={[
                  styles.dot,
                  { backgroundColor: colors.dotInactive },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
