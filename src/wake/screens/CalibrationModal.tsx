import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { DotMatrixCountdown } from '../../components/alarm/DotMatrixCountdown';
import { DotRing } from '../components/DotRing';
import { notify } from '../../ui/notify';
import { typography, spacing, radii } from '../../theme/tokens';
import { WakeCheckEngine } from '../contract';

export interface CalibrationModalProps {
  engine: WakeCheckEngine;
  onComplete: () => void;
  onCancel: () => void;
}

export function CalibrationModal({ engine, onComplete, onCancel }: CalibrationModalProps) {
  const { colors } = useTheme();

  // 0 = Step 1: Open eyes (3s), 1 = Step 2: Close eyes (2s), 2 = Done
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [prevStep, setPrevStep] = useState<0 | 1 | 2>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3);
  const [progress, setProgress] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (step !== prevStep) {
    setPrevStep(step);
    setSecondsRemaining(step === 0 ? 3 : 2);
    setProgress(0);
  }

  useEffect(() => {
    // Step 1: 3 seconds countdown
    const duration = step === 0 ? 3 : 2;
    const startTime = Date.now();
    const totalMs = duration * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProg = Math.min(1, elapsed / totalMs);
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));

      setProgress(currentProg);
      setSecondsRemaining(remaining);

      if (elapsed >= totalMs) {
        if (timerRef.current) clearInterval(timerRef.current);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

        if (step === 0) {
          setStep(1);
        } else if (step === 1) {
          setStep(2);
          engine
            .calibrate()
            .then(() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              notify.success('Calibrated');
              setTimeout(() => {
                onComplete();
              }, 600);
            })
            .catch(() => {
              notify.error('Calibration failed, using default baselines');
              onComplete();
            });
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, engine, onComplete]);

  const stepInfo =
    step === 0
      ? {
          primary: 'Hold eyes',
          secondary: 'wide open',
          desc: 'Look directly at the screen and hold eyes wide open.',
          label: 'OPEN',
        }
      : step === 1
      ? {
          primary: 'Keep eyes',
          secondary: 'gently closed',
          desc: 'Close eyes softly so the baseline closed state is recorded.',
          label: 'CLOSED',
        }
      : {
          primary: 'Eye profile',
          secondary: 'calibrated',
          desc: 'Your personalized eye threshold model has been saved.',
          label: 'DONE',
        };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="calibration-view">
      {/* Top Header */}
      <View style={styles.topRow}>
        <TwoToneTitle primary={stepInfo.primary} secondary={stepInfo.secondary} />
        <Pressable
          testID="calibration-cancel-btn"
          onPress={onCancel}
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Cancel calibration"
        >
          <X size={18} color={colors.ink} />
        </Pressable>
      </View>

      {/* Central Dot Ring & Countdown */}
      <View style={styles.centerSection}>
        <View style={styles.ringWrapper}>
          <DotRing holdProgress={progress} />
          <View style={styles.countdownCenter}>
            {step === 2 ? (
              <View style={[styles.successIconBadge, { backgroundColor: colors.accentYellow }]}>
                <Check size={36} color="#0D0D0D" strokeWidth={3} />
              </View>
            ) : (
              <DotMatrixCountdown
                seconds={secondsRemaining}
                dotSize={6}
                gap={3}
                label={stepInfo.label}
              />
            )}
          </View>
        </View>

        <Text style={[styles.instructionText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
          {stepInfo.desc}
        </Text>
      </View>

      {/* Bottom Step Indicator */}
      <View style={styles.bottomSection}>
        <View style={styles.stepsIndicator}>
          <View
            style={[
              styles.stepPill,
              {
                backgroundColor: step >= 0 ? colors.accentYellow : colors.surfaceAlt,
              },
            ]}
          >
            <Text style={[styles.stepPillText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
              1. Open
            </Text>
          </View>
          <View
            style={[
              styles.stepPill,
              {
                backgroundColor: step >= 1 ? colors.accentYellow : colors.surfaceAlt,
              },
            ]}
          >
            <Text
              style={[
                styles.stepPillText,
                { color: step >= 1 ? '#0D0D0D' : colors.muted, fontFamily: typography.fonts.bold },
              ]}
            >
              2. Closed
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xxl,
  },
  ringWrapper: {
    width: 200,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  countdownCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: typography.sizes.body,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  bottomSection: {
    marginBottom: spacing.base,
    alignItems: 'center',
  },
  stepsIndicator: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  stepPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
  },
  stepPillText: {
    fontSize: typography.sizes.caption,
  },
});
