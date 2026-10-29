import React, { useEffect, useReducer, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Zap, ShieldAlert } from 'lucide-react-native';
import { useAlarmStore } from '../store/alarm-store';
import { getAlarmScheduler } from '../services/alarm-scheduler';
import {
  createInitialStepRunnerState,
  stepRunnerReducer,
} from '../domain/step-runner';
import { DISMISSAL_METHODS } from '../domain/dismissal-registry';
import { DotMatrixDisplay } from '../components/alarm/DotMatrixDisplay';
import { useTheme } from '../theme/ThemeProvider';
import { notify } from '../ui/notify';
import { typography, spacing, radii } from '../theme/tokens';
import * as Haptics from 'expo-haptics';
import { playAlarmAudio, stopAlarmAudio } from '../services/sound-service';

export default function RingingScreen() {
  useKeepAwake();
  const { colors } = useTheme();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const activeAlarm = useAlarmStore((state) =>
    id ? state.getAlarmById(id) : state.alarms.find((a) => a.enabled) || state.alarms[0]
  );

  const fallbackSteps = [{ methodId: 'math' as const, target: 3 }];
  const alarmSteps =
    activeAlarm?.steps && activeAlarm.steps.length > 0
      ? activeAlarm.steps
      : fallbackSteps;

  const [state, dispatch] = useReducer(
    stepRunnerReducer,
    alarmSteps,
    createInitialStepRunnerState
  );

  // Live seconds ticker for the dot matrix display
  const [seconds, setSeconds] = useState(() =>
    new Date().getSeconds().toString().padStart(2, '0')
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(new Date().getSeconds().toString().padStart(2, '0'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time parts for dot matrix display
  const alarmTime = activeAlarm?.time;
  const [hoursPart, minutesPart] = React.useMemo(() => {
    if (alarmTime) {
      return alarmTime.split(':');
    }
    const d = new Date();
    return [
      d.getHours().toString().padStart(2, '0'),
      d.getMinutes().toString().padStart(2, '0'),
    ];
  }, [alarmTime]);

  // Subtle breathing animation on time (motion spec: 2400ms sine cycle, scale 1.0 to 1.02)
  const breatheScale = useSharedValue(1);

  useEffect(() => {
    breatheScale.value = withRepeat(
      withTiming(1.02, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [breatheScale]);

  const animatedBreatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  // Disable Android hardware back button
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );
    return () => subscription.remove();
  }, []);

  // Start looped alarm audio on mount and stop on unmount
  useEffect(() => {
    const soundToPlay = activeAlarm?.sound || 'Melodian';
    const volume = useAlarmStore.getState().alarmVolume ?? 80;
    playAlarmAudio(soundToPlay, volume, true).catch(() => {});

    return () => {
      stopAlarmAudio();
    };
  }, [activeAlarm?.sound]);

  // Watchdog failsafe: schedule a 60-second re-ring notification if killed mid-challenge
  useEffect(() => {
    const currentId = activeAlarm?.id || id || 'default_active_alarm';
    const scheduler = getAlarmScheduler();
    if (scheduler.scheduleWatchdog) {
      scheduler.scheduleWatchdog(currentId).catch(() => {});
      const interval = setInterval(() => {
        scheduler.scheduleWatchdog?.(currentId).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeAlarm?.id, id]);

  // When step runner completes all steps
  useEffect(() => {
    if (state.status === 'completed') {
      stopAlarmAudio();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      notify.success('Alarm dismissed!');
      const currentId = activeAlarm?.id || id;
      getAlarmScheduler().stopRinging(currentId).catch(() => {});
      useAlarmStore.getState().setActiveAlarmId(null);
      router.replace('/success');
    }
  }, [state.status, activeAlarm?.id, id]);

  const currentStep = state.status === 'running' ? state.currentStep : null;
  const methodDef = currentStep ? DISMISSAL_METHODS[currentStep.methodId] : null;
  const ChallengeComponent = methodDef?.Component;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Status Pill: ALARM RINGING & NO SNOOZE */}
        <View style={styles.topStatusRow}>
          <View style={[styles.statusPill, { backgroundColor: colors.surface }]}>
            <Zap size={14} color={colors.accentYellow} />
            <Text
              style={[
                styles.statusPillText,
                { color: colors.ink, fontFamily: typography.fonts.bold },
              ]}
            >
              ALARM RINGING
            </Text>
          </View>

          <View style={[styles.noSnoozeBadge, { backgroundColor: 'rgba(229, 55, 43, 0.12)' }]}>
            <ShieldAlert size={14} color={colors.error} />
            <Text
              style={[
                styles.noSnoozeText,
                { color: colors.error, fontFamily: typography.fonts.bold },
              ]}
            >
              No snooze allowed
            </Text>
          </View>
        </View>

        {/* Breathing Dot-Matrix Clock (Inspiration 01) */}
        <Animated.View style={[styles.clockWrapper, animatedBreatheStyle]}>
          <DotMatrixDisplay
            hours={hoursPart || '07'}
            minutes={minutesPart || '00'}
            seconds={seconds}
            dotSize={6}
            gap={3}
          />
        </Animated.View>

        {/* Alarm Time (for screen reading & tests) & Label */}
        <View style={styles.labelSection}>
          <Text
            style={[
              styles.timeSubtitle,
              { color: colors.ink, fontFamily: typography.fonts.bold },
            ]}
          >
            {activeAlarm?.time || '07:00'}
          </Text>
          <Text
            style={[
              styles.alarmLabel,
              { color: colors.muted, fontFamily: typography.fonts.medium },
            ]}
          >
            {activeAlarm?.label || 'Wake Up!'}
          </Text>
        </View>

        {/* Step Runner Progress Indicator */}
        {state.status === 'running' && (
          <View style={[styles.stepCard, { backgroundColor: colors.surface }]}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: colors.accentYellow }]}>
                <Text style={[styles.stepBadgeText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
                  Step {state.stepIndex + 1} of {state.totalSteps}
                </Text>
              </View>
              <Text style={[styles.stepTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                {methodDef?.title}
              </Text>
            </View>

            {/* Active Challenge Component */}
            {ChallengeComponent && currentStep && (
              <ChallengeComponent
                step={currentStep}
                onProgress={() => dispatch({ type: 'PROGRESS' })}
                onComplete={() => dispatch({ type: 'PROGRESS', increment: currentStep.target })}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  statusPillText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.8,
  },
  noSnoozeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  noSnoozeText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.5,
  },
  clockWrapper: {
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  labelSection: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  timeSubtitle: {
    fontSize: typography.sizes.h2,
    letterSpacing: -0.5,
  },
  alarmLabel: {
    fontSize: typography.sizes.body,
    marginTop: 2,
  },
  stepCard: {
    width: '100%',
    borderRadius: radii.card,
    padding: spacing.base,
    alignItems: 'center',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
    alignSelf: 'flex-start',
  },
  stepBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  stepBadgeText: {
    fontSize: typography.sizes.caption,
  },
  stepTitle: {
    fontSize: typography.sizes.bodyLarge,
  },
});
