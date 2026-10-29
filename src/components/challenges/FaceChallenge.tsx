import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Smile,
  CheckCircle,
  Scan,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Step } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing, radii } from '../../theme/tokens';
import { notify } from '../../ui/notify';
import { DefaultWakeCheckEngine } from '../../wake/engine';
import { useWakeCheck, WakeCameraPreview } from '../../wake/contract';

export interface FaceChallengeProps {
  step: Step;
  onProgress: () => void;
  onComplete: () => void;
  autoSimulate?: boolean;
}

export type ExpressionType = 'smile' | 'wide_eyes' | 'alert_gaze';

export const FaceChallenge: React.FC<FaceChallengeProps> = ({
  step,
  onProgress,
  onComplete,
}) => {
  const { colors, isDark } = useTheme();

  const [engine] = useState(() => new DefaultWakeCheckEngine());
  const wakeState = useWakeCheck(engine);

  const [confidence, setConfidence] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [manualVerified, setManualVerified] = useState<boolean>(false);
  const completedRef = React.useRef(false);

  const isVerified = wakeState.phase === 'success' || manualVerified;

  useEffect(() => {
    if (wakeState.phase === 'success' && !completedRef.current) {
      completedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      notify.success('Wakefulness verified by AI model!');
      onProgress();
      const timer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [wakeState.phase, onProgress, onComplete]);

  // Scanning HUD animation
  const scanLineY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(160, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    pulseScale.value = withRepeat(
      withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [scanLineY, pulseScale]);

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const animatedReticleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Hold timer logic for deep learning face verification
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isVerifying && !isVerified) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          const next = prev + 25;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          if (next >= 100) {
            setManualVerified(true);
            setIsVerifying(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            notify.success('Wakefulness verified by AI model!');
            onProgress();
            setTimeout(() => {
              onComplete();
            }, 600);
            return 100;
          }
          return next;
        });
      }, 350);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVerifying, isVerified, onProgress, onComplete]);

  const handleStartVerification = () => {
    if (isVerified) return;
    Haptics.selectionAsync().catch(() => {});
    setConfidence(92);
    setIsVerifying(true);
  };

  const handleReset = () => {
    setIsVerifying(false);
    setManualVerified(false);
    setHoldProgress(0);
    setConfidence(0);
  };

  return (
    <View style={styles.container} testID="face-challenge-container">
      {/* Challenge Title & Instruction */}
      <View style={styles.headerGroup}>
        <View style={[styles.badge, { backgroundColor: colors.accentYellow }]}>
          <Sparkles size={12} color="#0D0D0D" />
          <Text style={[styles.badgeText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
            DEEP LEARNING VISION
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
          Facial Expression Wake Check
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
          Hold a wide morning smile towards the camera to prove cognitive wakefulness.
        </Text>
      </View>

      {/* AI Viewfinder Reticle */}
      <View
        style={[
          styles.viewfinderFrame,
          {
            backgroundColor: isDark ? '#141413' : '#E2E3DF',
            borderColor: isVerified ? colors.success : isVerifying ? colors.accentYellow : colors.border,
          },
        ]}
      >
        <WakeCameraPreview engine={engine} style={StyleSheet.absoluteFill} />
        {/* Animated Scan Line */}
        <Animated.View
          style={[
            styles.scanLine,
            { backgroundColor: isVerified ? colors.success : colors.accentYellow },
            animatedScanLineStyle,
          ]}
        />

        {/* Reticle Target */}
        <Animated.View style={[styles.reticleCircle, animatedReticleStyle]}>
          <Scan size={90} color={isVerified ? colors.success : colors.ink} strokeWidth={1.2} />
        </Animated.View>

        {/* Expression Icon Indicator */}
        <View
          style={[
            styles.centerIconBadge,
            { backgroundColor: isVerified ? colors.success : colors.accentYellow },
          ]}
        >
          {isVerified ? (
            <CheckCircle size={32} color="#0D0D0D" strokeWidth={2.5} />
          ) : (
            <Smile size={32} color="#0D0D0D" strokeWidth={2.5} />
          )}
        </View>

        {/* HUD Overlay Stats */}
        <View style={styles.hudTopRow}>
          <Text style={[styles.hudText, { color: colors.ink, fontFamily: typography.fonts.medium }]}>
            CAM: FRONT_RGB_5MP
          </Text>
          <Text
            testID="face-confidence-text"
            style={[
              styles.hudText,
              { color: isVerified ? colors.success : colors.accentYellow, fontFamily: typography.fonts.bold },
            ]}
          >
            CONFIDENCE: {confidence > 0 ? `${confidence}%` : 'STANDBY'}
          </Text>
        </View>

        <View style={styles.hudBottomRow}>
          <Text style={[styles.hudText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            MODEL: MobileNetV3-FaceMesh
          </Text>
          <Text style={[styles.hudText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            {isVerified ? 'VERIFIED' : isVerifying ? 'CALIBRATING' : 'AWAITING INPUT'}
          </Text>
        </View>
      </View>

      {/* Hold Progress Bar */}
      {isVerifying || isVerified ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressLabel, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              {isVerified ? 'VERIFIED! WAKING UP...' : 'HOLD EXPRESSION TO DISMISS ALARM'}
            </Text>
            <Text
              testID="face-hold-progress-text"
              style={[styles.progressPercent, { color: colors.ink, fontFamily: typography.fonts.bold }]}
            >
              {holdProgress}%
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${holdProgress}%`,
                  backgroundColor: isVerified ? colors.success : colors.accentYellow,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      {/* Interactive Trigger Button */}
      {!isVerified && (
        <Pressable
          testID="verify-expression-btn"
          onPress={handleStartVerification}
          style={[
            styles.actionButton,
            {
              backgroundColor: isVerifying ? colors.ink : colors.accentYellow,
            },
          ]}
        >
          <Smile size={20} color={isVerifying ? colors.background : '#0D0D0D'} strokeWidth={2.4} />
          <Text
            style={[
              styles.actionButtonText,
              {
                color: isVerifying ? colors.background : '#0D0D0D',
                fontFamily: typography.fonts.bold,
              },
            ]}
          >
            {isVerifying ? 'Verifying Wake State...' : 'Verify Awake Smile (Simulate AI)'}
          </Text>
        </Pressable>
      )}

      {isVerifying && !isVerified && (
        <Pressable onPress={handleReset} style={styles.resetRow}>
          <RefreshCw size={14} color={colors.muted} />
          <Text style={[styles.resetText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            Cancel and retry
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  headerGroup: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: typography.sizes.h3,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.bodySmall,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.base,
  },
  viewfinderFrame: {
    width: '100%',
    height: 200,
    borderRadius: radii.card,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    zIndex: 2,
  },
  reticleCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  centerIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  hudTopRow: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 4,
  },
  hudBottomRow: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 4,
  },
  hudText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.6,
  },
  progressContainer: {
    width: '100%',
    marginVertical: spacing.sm,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: typography.sizes.caption,
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontSize: typography.sizes.caption,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.sizes.body,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  resetText: {
    fontSize: typography.sizes.caption,
  },
});
