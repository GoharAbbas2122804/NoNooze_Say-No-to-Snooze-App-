import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useAlarmStore } from '../store/alarm-store';
import { useTheme } from '../theme/ThemeProvider';
import { TwoToneTitle } from '../components/ui/TwoToneTitle';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AlarmTimeline } from '../components/alarm/AlarmTimeline';
import { WeekdayStrip } from '../components/alarm/WeekdayStrip';
import { AlarmCard } from '../components/alarm/AlarmCard';
import { PillBar } from '../components/alarm/PillBar';
import { DayOfWeek } from '../domain/types';
import { getNextTriggerDate } from '../domain/next-trigger';
import { GSAPEasings } from '../motion/ease';
import { typography, spacing } from '../theme/tokens';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { colors } = useTheme();
  const alarms = useAlarmStore((state) => state.alarms);
  const toggleAlarm = useAlarmStore((state) => state.toggleAlarm);
  const timeFormat = useAlarmStore((state) => state.timeFormat);

  // Live system time for giant clock
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hoursString = React.useMemo(() => {
    const h = now.getHours();
    if (timeFormat === '24h') {
      return h.toString().padStart(2, '0');
    }
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return displayH.toString().padStart(2, '0');
  }, [now, timeFormat]);

  const minutesString = React.useMemo(() => {
    return now.getMinutes().toString().padStart(2, '0');
  }, [now]);

  // Current selected day in WeekdayStrip (defaults to current system day)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => {
    return now.getDay() as DayOfWeek;
  });

  // Next upcoming alarm
  const nextAlarm = React.useMemo(() => {
    const enabled = alarms.filter((a) => a.enabled);
    if (enabled.length === 0) return null;

    const withNextDates = enabled.map((alarm) => ({
      alarm,
      nextDate: getNextTriggerDate(alarm),
    }));

    withNextDates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
    return withNextDates[0];
  }, [alarms]);

  // Countdown caption text
  const countdownCaption = React.useMemo(() => {
    if (!nextAlarm) return 'No alarms scheduled';
    const diffMs = nextAlarm.nextDate.getTime() - now.getTime();
    if (diffMs <= 0) return 'Ringing shortly';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0) {
      return `The next alarm clock in ${hours}h ${mins}m`;
    }
    return `The next alarm clock in ${mins} min`;
  }, [nextAlarm, now]);

  // Active days with enabled alarms
  const activeAlarmDays = React.useMemo(() => {
    const daysSet = new Set<DayOfWeek>();
    alarms
      .filter((a) => a.enabled)
      .forEach((a) => {
        a.days.forEach((d) => daysSet.add(d));
      });
    return Array.from(daysSet);
  }, [alarms]);

  // Motion choreography (GSAP power3.out stagger under 900ms)
  const headerOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(20);
  const timelineOpacity = useSharedValue(0);
  const cardsOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: 350,
      easing: GSAPEasings.power3.out,
    });
    heroTranslateY.value = withDelay(
      80,
      withTiming(0, { duration: 450, easing: GSAPEasings.power3.out })
    );
    timelineOpacity.value = withDelay(
      180,
      withTiming(1, { duration: 400, easing: GSAPEasings.power3.out })
    );
    cardsOpacity.value = withDelay(
      280,
      withTiming(1, { duration: 450, easing: GSAPEasings.power3.out })
    );
  }, [headerOpacity, heroTranslateY, timelineOpacity, cardsOpacity]);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const animatedTimelineStyle = useAnimatedStyle(() => ({
    opacity: timelineOpacity.value,
  }));

  const animatedCardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
  }));

  const handleAddAlarm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/edit');
  };

  const handleEditAlarm = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: '/edit', params: { id } });
  };

  const handleOpenPermissions = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/permissions');
  };

  const handleToggle = (id: string) => {
    toggleAlarm(id);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header: TwoTone "Alarm" Title + ThemeToggle */}
        <TwoToneTitle
          primary="Alarm"
          accessoryRight={<ThemeToggle />}
        />

        {/* Scrollable Main Content */}
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
          ListHeaderComponent={
            <>
              {/* Huge Numerals 09:50 (Hours ink, Minutes muted) */}
              <Animated.View style={[styles.giantClockContainer, animatedHeroStyle]}>
                <Text
                  testID="giant-clock-display"
                  style={[
                    styles.giantClockHours,
                    {
                      color: colors.ink,
                      fontFamily: typography.fonts.light,
                    },
                  ]}
                >
                  {hoursString}
                  <Text style={{ color: colors.muted }}>:{minutesString}</Text>
                </Text>
                {/* Live Countdown Caption */}
                <Text
                  testID="countdown-caption"
                  style={[
                    styles.captionText,
                    { color: colors.muted, fontFamily: typography.fonts.medium },
                  ]}
                >
                  {countdownCaption}
                </Text>
              </Animated.View>

              {/* 24-Hour Timeline Strip */}
              <Animated.View style={animatedTimelineStyle}>
                <AlarmTimeline alarms={alarms} />
              </Animated.View>

              {/* Weekday Strip with Sliding Yellow Disc */}
              <WeekdayStrip
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                activeAlarmDays={activeAlarmDays}
              />

              {/* Section Header */}
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionHeader,
                    { color: colors.muted, fontFamily: typography.fonts.bold },
                  ]}
                >
                  SCHEDULED ALARMS
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <Animated.View style={animatedCardsStyle}>
              <AlarmCard
                alarm={item}
                onPress={() => handleEditAlarm(item.id)}
                onToggle={() => handleToggle(item.id)}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.muted, fontFamily: typography.fonts.medium },
                ]}
              >
                No alarms set. Tap + to create your first alarm.
              </Text>
            </View>
          }
        />

        {/* Floating Bottom Bar */}
        <PillBar
          onAddPress={handleAddAlarm}
          onSettingsPress={handleOpenPermissions}
          timeRangeText={`${hoursString}:${minutesString}`}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.base,
  },
  scrollList: {
    paddingBottom: 110, // Clearance for floating PillBar
  },
  giantClockContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  giantClockHours: {
    fontSize: typography.sizes.giantClock,
    letterSpacing: -2,
    lineHeight: 84,
  },
  captionText: {
    fontSize: typography.sizes.body,
    marginTop: spacing.xs,
  },
  sectionHeaderRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    fontSize: typography.sizes.micro,
    letterSpacing: 1.2,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.bodySmall,
  },
});
