import React from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Alarm } from '../../domain/types';
import { formatDisplayTime } from '../../domain/time-format';
import { useAlarmStore } from '../../store/alarm-store';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing, radii, hitSlop } from '../../theme/tokens';
import * as Haptics from 'expo-haptics';

export interface AlarmCardProps {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
  isPeeking?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onPress,
  onToggle,
}) => {
  const { colors } = useTheme();
  const timeFormat = useAlarmStore((state) => state.timeFormat);
  const display = formatDisplayTime(alarm.time, timeFormat);
  const scale = useSharedValue(1);

  const [hours, minutes] = display.time.split(':');

  const getDaysSummary = (): string => {
    if (!alarm.days || alarm.days.length === 0) return 'Once';
    if (alarm.days.length === 7) return 'Every day';
    if (
      alarm.days.length === 5 &&
      [1, 2, 3, 4, 5].every((d) => alarm.days.includes(d as any))
    ) {
      return 'Weekdays';
    }
    if (
      alarm.days.length === 2 &&
      [0, 6].every((d) => alarm.days.includes(d as any))
    ) {
      return 'Weekends';
    }
    return alarm.days.map((d) => DAY_NAMES[d]).join(', ');
  };

  const firstStep = alarm.steps?.[0];
  const gamesLabel = React.useMemo(() => {
    if (!firstStep) return '1 Game';
    switch (firstStep.methodId) {
      case 'face':
        return '⚡ Face AI';
      case 'environment':
        return '⚡ Light Scan';
      case 'math':
        return `⚡ Math (${firstStep.target}x)`;
      case 'pushups':
        return `⚡ Pushups (${firstStep.target}x)`;
      default:
        return `${alarm.steps?.length || 1} Game`;
    }
  }, [firstStep, alarm.steps]);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 220 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 220 });
  };

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  const handleToggle = () => {
    Haptics.selectionAsync().catch(() => {});
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <Pressable
        testID={`alarm-card-${alarm.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Alarm for ${display.formatted}, ${alarm.label || 'Alarm'}`}
        hitSlop={hitSlop}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: alarm.enabled ? colors.borderFocus : colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.topRow}>
          {/* Huge Numerals: Hours black, Minutes grey */}
          <View style={styles.timeGroup}>
            <Text
              style={[
                styles.hoursText,
                {
                  color: alarm.enabled ? colors.ink : colors.muted,
                  fontFamily: typography.fonts.light,
                },
              ]}
            >
              {hours}:
              <Text style={{ color: colors.muted, fontFamily: typography.fonts.light }}>
                {minutes}
              </Text>
            </Text>
            {display.ampm ? (
              <Text
                style={[
                  styles.ampmText,
                  {
                    color: colors.muted,
                    fontFamily: typography.fonts.medium,
                  },
                ]}
              >
                {display.ampm}
              </Text>
            ) : null}
          </View>

          {/* Toggle Switch */}
          <Switch
            testID={`alarm-toggle-${alarm.id}`}
            value={alarm.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={colors.switchThumb}
            accessibilityLabel={`Toggle alarm for ${display.formatted}`}
          />
        </View>

        {/* Caption & Games Badge Line */}
        <View style={styles.bottomRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.labelLine,
              { color: colors.ink, fontFamily: typography.fonts.medium },
            ]}
          >
            {alarm.label || 'Alarm'}
            <Text style={{ color: colors.muted }}> · {getDaysSummary()}</Text>
          </Text>

          <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
            <Text
              style={[
                styles.badgeText,
                { color: colors.ink, fontFamily: typography.fonts.bold },
              ]}
            >
              {gamesLabel}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: spacing.sm,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hoursText: {
    fontSize: typography.sizes.hero,
    letterSpacing: -1,
  },
  ampmText: {
    fontSize: typography.sizes.bodyLarge,
    marginLeft: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  labelLine: {
    fontSize: typography.sizes.bodySmall,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.5,
  },
});
