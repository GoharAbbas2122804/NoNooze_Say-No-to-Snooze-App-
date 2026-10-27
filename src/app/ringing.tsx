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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header with Alarm Time & Label */}
        <View style={styles.header}>
          <View style={styles.ringingPill}>
            <Text style={styles.ringingPillText}>⚡ {APP_NAME} ALARM RINGING</Text>
          </View>
          <Text style={styles.alarmTimeText}>
            {activeAlarm?.time || '07:00'}
          </Text>
          <Text style={styles.alarmLabelText}>
            {activeAlarm?.label || 'Wake Up!'}
          </Text>
        </View>

        {/* Step Runner Progress Indicator */}
        {state.status === 'running' && (
          <View style={styles.stepProgressContainer}>
            <View style={styles.stepProgressHeader}>
              <Text style={styles.stepCounterText}>
                Step {state.stepIndex + 1} of {state.totalSteps}
              </Text>
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
          <Text style={styles.footerNoticeText}>
            🔒 No snooze allowed. Complete all challenges to dismiss.
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
    backgroundColor: colors.accentGlow,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
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
  alarmTimeText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.black,
    letterSpacing: -1,
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
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.card,
  },
  stepProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCounterText: {
    color: colors.primary,
    fontSize: typography.sizes.bodySmall,
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
    marginTop: spacing.md,
    paddingHorizontal: spacing.base,
  },
  footerNoticeText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    textAlign: 'center',
  },
});
