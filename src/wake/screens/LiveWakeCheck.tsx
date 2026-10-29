/**
 * LiveWakeCheck — Hero wake check screen.
 * Orchestrates ViewfinderCard, CheckPills, DotMatrixCountdown, AlertnessTick,
 * HintText, LivenessOverlay, Fallback button, and Fill light.
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Calculator } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { DotMatrixCountdown } from '../../components/alarm/DotMatrixCountdown';
import { ViewfinderCard } from '../components/ViewfinderCard';
import { CheckPills } from '../components/CheckPills';
import { AlertnessTick } from '../components/AlertnessTick';
import { HintText } from '../components/HintText';
import { LivenessOverlay } from '../components/LivenessOverlay';
import { WakeSuccessView } from './WakeSuccessView';
import { WakeFallbackView } from './WakeFallbackView';
import { useFillLight } from '../hooks/useFillLight';
import { useFallbackTimer } from '../hooks/useFallbackTimer';
import { useAlarmTheme } from '../hooks/useAlarmTheme';
import { typography, spacing } from '../../theme/tokens';
import { GSAPEasings } from '../../motion/ease';
import { useMotionGuard } from '../../motion/choreo';
import { WakeCheckEngine, WakeCheckConfig, useWakeCheck } from '../contract';
import { FakeWakeCheckEngine } from '../fake/FakeWakeCheckEngine';

export interface LiveWakeCheckProps {
  engine?: WakeCheckEngine;
  targetHoldSeconds?: number;
  livenessEnabled?: boolean;
  onProgress?: (progress: number) => void;
  onComplete: () => void;
  onFallbackMath?: () => void;
}

export function LiveWakeCheck({
  engine: customEngine,
  targetHoldSeconds = 5,
  livenessEnabled = true,
  onProgress,
  onComplete,
  onFallbackMath,
}: LiveWakeCheckProps) {
  const { colors } = useTheme();
  const alarmTheme = useAlarmTheme();
  const { isReduced } = useMotionGuard();

  const [defaultEngine] = useState(() => new FakeWakeCheckEngine('happy-path'));
  const engine = customEngine || defaultEngine;
  const state = useWakeCheck(engine);

  const fallbackAvailable = useFallbackTimer(state.phase === 'searching' || state.phase === 'verifying');
  const [livenessShake, setLivenessShake] = useState(false);
  const prevLivenessChallenge = useRef(state.checks.liveness.challenge);
  const durationSeconds = Math.max(
    1,
    Math.round((state.checks.eyesOpen.heldMs || targetHoldSeconds * 1000) / 1000)
  );

  // Fill light support
  useFillLight(
    state.phase === 'searching' || state.phase === 'verifying',
    state.checks.lighting.level === 'dark'
  );

  // Start engine on mount
  useEffect(() => {
    const config: WakeCheckConfig = {
      holdMs: targetHoldSeconds * 1000,
      sensitivity: 'standard',
      liveness: livenessEnabled,
      livenessTimeoutMs: 5000,
      fillLight: true,
    };
    engine.start(config).catch(() => {});

    return () => {
      engine.stop().catch(() => {});
    };
  }, [engine, targetHoldSeconds, livenessEnabled]);

  // Report progress
  useEffect(() => {
    if (onProgress) {
      onProgress(state.progress);
    }
  }, [state.progress, onProgress]);

  // Detect liveness challenge retry shake
  useEffect(() => {
    const curr = state.checks.liveness.challenge;
    if (prevLivenessChallenge.current && curr && prevLivenessChallenge.current !== curr) {
      // Changed challenge implies retry shake
      setLivenessShake(true);
      const t = setTimeout(() => setLivenessShake(false), 500);
      return () => clearTimeout(t);
    }
    prevLivenessChallenge.current = curr;
  }, [state.checks.liveness.challenge]);

  // GSAP-style choreography entrances (transformed & opacity only)
  const titleY = useSharedValue(isReduced ? 0 : -20);
  const titleOpacity = useSharedValue(isReduced ? 1 : 0);
  const cardScale = useSharedValue(isReduced ? 1 : 0.96);
  const cardOpacity = useSharedValue(isReduced ? 1 : 0);

  useEffect(() => {
    if (isReduced) {
      titleOpacity.value = 1;
      cardOpacity.value = 1;
      return;
    }
    titleY.value = withTiming(0, { duration: 400, easing: GSAPEasings.power3.out });
    titleOpacity.value = withTiming(1, { duration: 400 });
    cardScale.value = withSpring(1.0, { damping: 16, stiffness: 140 });
    cardOpacity.value = withTiming(1, { duration: 450 });
  }, [isReduced, titleY, titleOpacity, cardScale, cardOpacity]);

  const animatedTitleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleY.value }],
    opacity: titleOpacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  // Remaining hold seconds countdown
  const remainingHoldSeconds = useMemo(() => {
    const heldMs = state.checks.eyesOpen.heldMs;
    const targetMs = state.checks.eyesOpen.targetMs || targetHoldSeconds * 1000;
    const remainingMs = Math.max(0, targetMs - heldMs);
    return Math.ceil(remainingMs / 1000);
  }, [state.checks.eyesOpen.heldMs, state.checks.eyesOpen.targetMs, targetHoldSeconds]);

  // TwoTone Title based on phase
  const getPhaseTitle = () => {
    switch (state.phase) {
      case 'searching':
        return { primary: 'Show your', secondary: 'eyes' };
      case 'verifying':
        return { primary: 'Hold steady', secondary: 'looking at camera' };
      case 'challenge':
        return { primary: 'Liveness', secondary: 'check' };
      default:
        return { primary: 'Show your', secondary: 'eyes' };
    }
  };

  const phaseTitle = getPhaseTitle();

  if (state.phase === 'success') {
    return (
      <WakeSuccessView
        durationSeconds={durationSeconds}
        alertness={state.alertness || 80}
        onComplete={onComplete}
      />
    );
  }

  if (state.phase === 'fallback' || state.phase === 'failed') {
    return (
      <WakeFallbackView
        reason={state.failureReason}
        onUseMath={() => onFallbackMath && onFallbackMath()}
        onRetry={() => {
          engine.start({
            holdMs: targetHoldSeconds * 1000,
            sensitivity: 'standard',
            liveness: livenessEnabled,
            livenessTimeoutMs: 5000,
            fillLight: true,
          }).catch(() => {});
        }}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: alarmTheme === 'dark' ? '#0B0B0A' : colors.background,
        },
      ]}
      showsVerticalScrollIndicator={false}
      testID="live-wake-check-screen"
    >
      {/* Title */}
      <Animated.View style={[styles.titleWrapper, animatedTitleStyle]}>
        <TwoToneTitle primary={phaseTitle.primary} secondary={phaseTitle.secondary} />
      </Animated.View>

      {/* Viewfinder Card */}
      <Animated.View style={[styles.viewfinderWrapper, animatedCardStyle]}>
        <ViewfinderCard
          engine={engine}
          state={state}
          fillLight={state.checks.lighting.level === 'dark'}
        />
        {/* Inline Hint label */}
        <View style={styles.hintContainer}>
          <HintText hint={state.hint} />
        </View>
      </Animated.View>

      {/* Countdown & Alertness strip */}
      <View style={styles.hudSection}>
        <DotMatrixCountdown
          seconds={remainingHoldSeconds}
          dotSize={5}
          gap={2.5}
          label="SECONDS TO HOLD"
        />
        <AlertnessTick alertness={state.alertness} />
      </View>

      {/* Status Check Pills */}
      <View style={styles.pillsSection}>
        <CheckPills checks={state.checks} />
      </View>

      {/* Always-visible Fallback (shown after 10s) */}
      {fallbackAvailable && onFallbackMath && (
        <Pressable
          testID="use-math-instead-ghost-btn"
          onPress={onFallbackMath}
          style={styles.ghostFallbackBtn}
          accessibilityRole="button"
          accessibilityLabel="Switch to math challenge"
        >
          <Calculator size={16} color={colors.muted} />
          <Text style={[styles.ghostFallbackText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            Use math instead
          </Text>
        </Pressable>
      )}

      {/* Liveness Slide-Up Card */}
      <LivenessOverlay
        visible={state.phase === 'challenge'}
        challenge={state.checks.liveness.challenge}
        remainingMs={state.checks.liveness.remainingMs}
        totalMs={5000}
        failedShake={livenessShake}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrapper: {
    width: '100%',
    paddingHorizontal: spacing.xs,
  },
  viewfinderWrapper: {
    width: '100%',
    position: 'relative',
    marginVertical: spacing.xs,
  },
  hintContainer: {
    position: 'absolute',
    bottom: spacing.base,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  pillsSection: {
    width: '100%',
    marginVertical: spacing.xs,
  },
  ghostFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  ghostFallbackText: {
    fontSize: typography.sizes.bodySmall,
  },
});
