/**
 * DotRing — a ring of N dots arranged around an ellipse.
 * Dots fill grey → ink as fillCount increases; last dot is accentYellow.
 * Each new fill triggers a soft ripple. Drains smoothly when fillCount drops.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

const DOT_COUNT = 24;
const DOT_SIZE = 6;
const RING_RX = 90; // horizontal radius in px
const RING_RY = 112; // vertical radius in px

interface DotRingProps {
  /** 0..1 fill fraction */
  holdProgress: number;
  /** Pulse once (driven by second ticks) */
  pulseSignal?: number;
  accessibilityLabel?: string;
}

function getDotPosition(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Math.cos(angle) * RING_RX,
    y: Math.sin(angle) * RING_RY,
  };
}

const AnimatedDot = React.memo(function AnimatedDot({
  filled,
  isLast,
  dotColor,
  accentColor,
  emptyColor,
}: {
  filled: boolean;
  isLast: boolean;
  dotColor: string;
  accentColor: string;
  emptyColor: string;
}) {
  const scale = useSharedValue(1);
  const prevFilled = useRef(false);

  useEffect(() => {
    if (filled && !prevFilled.current) {
      // Ripple on fill
      scale.value = withSequence(
        withSpring(1.6, { damping: 8, stiffness: 200 }),
        withSpring(1.0, { damping: 12, stiffness: 160 })
      );
    } else if (!filled && prevFilled.current) {
      // Quick drain
      scale.value = withTiming(1.0, { duration: 150 });
    }
    prevFilled.current = filled;
  }, [filled, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bg = filled ? (isLast ? accentColor : dotColor) : emptyColor;

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: bg },
        animStyle,
      ]}
    />
  );
});

export function DotRing({ holdProgress, accessibilityLabel }: DotRingProps) {
  const { colors } = useTheme();
  const fillCount = Math.round(holdProgress * DOT_COUNT);

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel}
      accessible
    >
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        const { x, y } = getDotPosition(i, DOT_COUNT);
        const filled = i < fillCount;
        const isLast = i === fillCount - 1 && fillCount === DOT_COUNT;
        return (
          <View
            key={i}
            style={[
              styles.dotWrapper,
              {
                transform: [
                  { translateX: x - DOT_SIZE / 2 },
                  { translateY: y - DOT_SIZE / 2 },
                ],
              },
            ]}
          >
            <AnimatedDot
              filled={filled}
              isLast={isLast}
              dotColor={colors.ink}
              accentColor={colors.accentYellow}
              emptyColor={colors.dotInactive}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RING_RX * 2 + DOT_SIZE,
    height: RING_RY * 2 + DOT_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWrapper: {
    position: 'absolute',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
