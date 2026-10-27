import React, { useEffect, useReducer } from 'react';
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
import { Zap, Lock } from 'lucide-react-native';
import { useAlarmStore } from '../store/alarm-store';
import { getAlarmScheduler } from '../services/alarm-scheduler';
import {
  createInitialStepRunnerState,
  stepRunnerReducer,
} from '../domain/step-runner';
import { DISMISSAL_METHODS } from '../domain/dismissal-registry';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';
import { APP_NAME } from '../constants/app';
import * as Haptics from 'expo-haptics';

export default function RingingScreen() {
  useKeepAwake();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const activeAlarm = useAlarmStore((state) =>
    id ? state.getAlarmById(id) : state.alarms.find((a) => a.enabled) || state.alarms[0]
  );

  const fallbackSteps = [{ methodId: 'math' as const, target: 3 }];
  const alarmSteps = activeAlarm?.steps && activeAlarm.steps.length > 0
    ? activeAlarm.steps
    : fallbackSteps;

  const [state, dispatch] = useReducer(
    stepRunnerReducer,
    alarmSteps,
    createInitialStepRunnerState
  );

  // Subtle, calm breathing animation on time (motion spec: 2200ms sine cycle)
  const breatheScale = useSharedValue(1);
  const breatheOpacity = useSharedValue(0.92);

  useEffect(() => {
    breatheScale.value = withRepeat(
      withTiming(1.03, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    breatheOpacity.value = withRepeat(
      withTiming(1.0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [breatheScale, breatheOpacity]);

  const animatedTimeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
    opacity: breatheOpacity.value,
  }));

  // Disable Android hardware back button
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );
    return () => subscription.remove();
  }, []);

  // When step runner completes all steps
  useEffect(() => {
    if (state.status === 'completed') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      getAlarmScheduler().stopRinging().catch(() => {});
      useAlarmStore.getState().setActiveAlarmId(null);
      router.replace('/success');
    }
  }, [state.status]);

  const currentStep = state.status === 'running' ? state.currentStep : null;
  const methodDef = currentStep ? DISMISSAL_METHODS[currentStep.methodId] : null;
  const ChallengeComponent = methodDef?.Component;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Alarm Time & Label */}
        <View style={styles.header}>
          <View style={styles.ringingPill}>
            <Zap size={14} color={colors.accent} />
            <Text style={styles.ringingPillText}>{APP_NAME} ALARM RINGING</Text>
          </View>

          <Animated.View style={[styles.timeWrapper, animatedTimeStyle]}>
            <Text style={styles.alarmTimeText}>
              {activeAlarm?.time || '07:00'}
            </Text>
          </Animated.View>

          <Text style={styles.alarmLabelText}>
            {activeAlarm?.label || 'Wake Up!'}
          </Text>
        </View>

        {/* Step Runner Progress Indicator */}
        {state.status === 'running' && (
          <View style={styles.stepProgressContainer}>
            <View style={styles.stepProgressHeader}>
              <View style={styles.stepCounterBadge}>
                <Text style={styles.stepCounterText}>
                  Step {state.stepIndex + 1} of {state.totalSteps}
                </Text>
              </View>
              <Text style={styles.stepMethodText}>{methodDef?.title}</Text>
            </View>

            {/* Step Segments */}
            <View style={styles.segmentsRow}>
              {state.steps.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.segment,
                    idx < state.stepIndex && styles.segmentCompleted,
                    idx === state.stepIndex && styles.segmentActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Challenge Area */}
        <View style={styles.challengeArea}>
          {ChallengeComponent && currentStep ? (
            <ChallengeComponent
              step={currentStep}
              onProgress={() => dispatch({ type: 'PROGRESS' })}
              onComplete={() => dispatch({ type: 'PROGRESS' })}
            />
          ) : (
            <Text style={styles.waitingText}>Preparing challenge...</Text>
          )}
        </View>

        {/* Unskippable Notice */}
        <View style={styles.footerNotice}>
          <Lock size={14} color={colors.textMuted} />
          <Text style={styles.footerNoticeText}>
            No snooze allowed. Complete all challenges to dismiss.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  ringingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentGlow,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: spacing.xs,
  },
  ringingPillText: {
    color: colors.accent,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  timeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmTimeText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.black,
    letterSpacing: -1.5,
  },
  alarmLabelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.medium,
  },
  stepProgressContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
    ...shadows.card,
  },
  stepProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCounterBadge: {
    backgroundColor: 'rgba(112, 244, 100, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  stepCounterText: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
  stepMethodText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.semibold,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    height: 6,
    width: '100%',
  },
  segment: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
  },
  segmentActive: {
    backgroundColor: colors.primary,
    ...shadows.glowLime,
  },
  segmentCompleted: {
    backgroundColor: colors.success,
  },
  challengeArea: {
    width: '100%',
    alignItems: 'center',
  },
  waitingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.base,
  },
  footerNoticeText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    textAlign: 'center',
  },
});
