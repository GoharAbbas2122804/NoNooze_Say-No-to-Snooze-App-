import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { DayOfWeek } from '../../domain/types';
import { typography, spacing } from '../../theme/tokens';
import { GSAPEasings } from '../../motion/ease';

export interface WeekdayStripProps {
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  activeAlarmDays?: DayOfWeek[];
}

interface DayItem {
  day: DayOfWeek;
  label: string;
}

const WEEKDAYS: DayItem[] = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

const CIRCLE_SIZE = 42;
const HORIZONTAL_PADDING = spacing.sm; // 8

export function WeekdayStrip({
  selectedDay,
  onSelectDay,
  activeAlarmDays = [],
}: WeekdayStripProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = React.useState(0);
  const slideX = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const prevIndex = useRef(-1);

  const selectedIndex = React.useMemo(() => {
    const idx = WEEKDAYS.findIndex((w) => w.day === selectedDay);
    return idx >= 0 ? idx : 0;
  }, [selectedDay]);

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setContainerWidth(width);
  };

  React.useEffect(() => {
    if (containerWidth > 0) {
      const innerWidth = containerWidth - HORIZONTAL_PADDING * 2;
      const cellWidth = innerWidth / WEEKDAYS.length;
      // Exact center offset for cell index
      const targetX =
        HORIZONTAL_PADDING + selectedIndex * cellWidth + (cellWidth - CIRCLE_SIZE) / 2;

      if (prevIndex.current !== -1 && prevIndex.current !== selectedIndex) {
        const distance = Math.abs(selectedIndex - prevIndex.current);
        // Organic GSAP-style squash & stretch on jump
        scaleX.value = withSequence(
          withTiming(1 + Math.min(0.22, distance * 0.06), {
            duration: 130,
            easing: GSAPEasings.power2.out,
          }),
          withSpring(1, { damping: 14, stiffness: 220 })
        );
        scaleY.value = withSequence(
          withTiming(0.9, { duration: 130, easing: GSAPEasings.power2.out }),
          withSpring(1, { damping: 14, stiffness: 220 })
        );
      } else {
        slideX.value = targetX;
      }

      slideX.value = withSpring(targetX, {
        damping: 18,
        stiffness: 180,
        mass: 0.8,
      });

      prevIndex.current = selectedIndex;
    }
  }, [selectedIndex, containerWidth, slideX, scaleX, scaleY]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: slideX.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  const handleSelect = (day: DayOfWeek) => {
    Haptics.selectionAsync().catch(() => {});
    onSelectDay(day);
  };

  return (
    <View style={styles.wrapper}>
      <View
        testID="weekday-strip-container"
        style={[styles.container, { backgroundColor: colors.surface }]}
        onLayout={onLayout}
      >
        {/* Animated Sliding Yellow Circle */}
        {containerWidth > 0 ? (
          <Animated.View
            testID="weekday-active-indicator"
            style={[
              styles.activeCircle,
              { backgroundColor: colors.accentYellow },
              animatedIndicatorStyle,
            ]}
          />
        ) : null}

        {/* Weekday Buttons */}
        {WEEKDAYS.map((item) => {
          const isSelected = item.day === selectedDay;
          const hasAlarm = activeAlarmDays.includes(item.day);

          return (
            <Pressable
              key={item.day}
              testID={`weekday-item-${item.day}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}, ${isSelected ? 'selected' : 'not selected'}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handleSelect(item.day)}
              style={styles.dayCell}
            >
              <Text
                style={[
                  styles.dayText,
                  {
                    color: isSelected ? '#0D0D0D' : colors.muted,
                    fontFamily: isSelected
                      ? typography.fonts.bold
                      : typography.fonts.medium,
                  },
                ]}
              >
                {item.label}
              </Text>
              {/* Subtle dot if an alarm is active on this day and day is not selected */}
              {hasAlarm && !isSelected ? (
                <View
                  style={[
                    styles.alarmDot,
                    { backgroundColor: colors.accentYellow },
                  ]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing.sm,
  },
  container: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    position: 'relative',
    overflow: 'hidden',
  },
  activeCircle: {
    position: 'absolute',
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    zIndex: 1,
  },
  dayCell: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dayText: {
    fontSize: typography.sizes.bodySmall,
  },
  alarmDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    position: 'absolute',
    bottom: 8,
  },
});
