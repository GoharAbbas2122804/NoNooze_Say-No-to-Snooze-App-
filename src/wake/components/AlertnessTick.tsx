/**
 * AlertnessTick — horizontal tick strip 0–100 with a yellow marker.
 * Tick language borrowed from AlarmTimeline. Labelled as an estimate.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing } from '../../theme/tokens';

const TICK_COUNT = 20;
const MAJOR_EVERY = 5;

interface AlertnessTickProps {
  alertness: number; // 0..100
}

export function AlertnessTick({ alertness }: AlertnessTickProps) {
  const { colors } = useTheme();
  const markerPos = useSharedValue((alertness / 100));

  React.useEffect(() => {
    markerPos.value = withSpring(alertness / 100, { damping: 16, stiffness: 120 });
  }, [alertness, markerPos]);

  const markerStyle = useAnimatedStyle(() => ({
    left: `${markerPos.value * 100}%`,
  }));

  return (
    <View style={styles.wrapper} accessible accessibilityLabel={`Alertness estimate ${alertness} of 100`}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
          0
        </Text>
        <View style={styles.track}>
          {/* Ticks */}
          <View style={styles.tickRow}>
            {Array.from({ length: TICK_COUNT + 1 }, (_, i) => {
              const isMajor = i % MAJOR_EVERY === 0;
              return (
                <View
                  key={i}
                  style={[
                    styles.tick,
                    {
                      height: isMajor ? 10 : 6,
                      backgroundColor: i <= (alertness / 100) * TICK_COUNT
                        ? colors.ink
                        : colors.dotInactive,
                    },
                  ]}
                />
              );
            })}
          </View>
          {/* Yellow marker */}
          <Animated.View style={[styles.marker, { backgroundColor: colors.accentYellow }, markerStyle]} />
        </View>
        <Text style={[styles.label, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
          100
        </Text>
      </View>
      <Text style={[styles.caption, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
        Alertness (estimate)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.micro,
    width: 20,
    textAlign: 'center',
  },
  track: {
    flex: 1,
    height: 16,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 16,
  },
  tick: {
    width: 2,
    borderRadius: 1,
  },
  marker: {
    position: 'absolute',
    bottom: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  caption: {
    fontSize: typography.sizes.micro,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
