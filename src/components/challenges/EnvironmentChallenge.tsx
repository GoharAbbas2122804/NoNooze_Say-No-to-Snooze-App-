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
  Sun,
  CheckCircle,
  Lightbulb,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Step } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing, radii } from '../../theme/tokens';
import { notify } from '../../ui/notify';

export interface EnvironmentChallengeProps {
  step: Step;
  onProgress: () => void;
  onComplete: () => void;
}

export const EnvironmentChallenge: React.FC<EnvironmentChallengeProps> = ({
  step,
  onProgress,
  onComplete,
}) => {
  const { colors, isDark } = useTheme();

  const [currentLux, setCurrentLux] = useState<number>(18);
  const targetLux = (step.options?.targetLux as number) || 75;
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);

  // Radar beam animation
  const radarRotate = useSharedValue(0);
  const lightPulse = useSharedValue(1);

  useEffect(() => {
    radarRotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    lightPulse.value = withRepeat(
      withTiming(1.15, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [radarRotate, lightPulse]);

  const animatedRadarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${radarRotate.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lightPulse.value }],
  }));

  // Scanning simulation loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isScanning && !isVerified) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          const next = prev + 20;
          setCurrentLux((l) => Math.min(95, l + 16));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          if (next >= 100) {
            setIsVerified(true);
            setIsScanning(false);
            setCurrentLux(88);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            notify.success('Morning light verified! Room illuminated.');
            onProgress();
            setTimeout(() => {
              onComplete();
            }, 600);
            return 100;
          }
          return next;
        });
      }, 400);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, isVerified, onProgress, onComplete]);

  const handleStartScan = () => {
    if (isVerified) return;
    Haptics.selectionAsync().catch(() => {});
    setIsScanning(true);
  };

  const handleReset = () => {
    setIsScanning(false);
    setIsVerified(false);
    setScanProgress(0);
    setCurrentLux(18);
  };

  return (
    <View style={styles.container} testID="environment-challenge-container">
      {/* Challenge Title & Instruction */}
      <View style={styles.headerGroup}>
        <View style={[styles.badge, { backgroundColor: colors.accentYellow }]}>
          <Sparkles size={12} color="#0D0D0D" />
          <Text style={[styles.badgeText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
            ENVIRONMENT & LIGHT AI
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
          Environment Light Tracking
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
          Move towards morning light or turn on room lights to exceed {targetLux} Lux and dismiss alarm.
        </Text>
      </View>

      {/* Environmental Radar Viewfinder */}
      <View
        style={[
          styles.radarFrame,
          {
            backgroundColor: isDark ? '#141413' : '#E2E3DF',
            borderColor: isVerified ? colors.success : isScanning ? colors.accentYellow : colors.border,
          },
        ]}
      >
        {/* Animated Radar Sweep */}
        <Animated.View style={[styles.radarSweep, animatedRadarStyle]}>
          <View
            style={[
              styles.radarNeedle,
              { backgroundColor: isVerified ? colors.success : colors.accentYellow },
            ]}
          />
        </Animated.View>

        {/* Center Sun / Lux Beacon */}
        <Animated.View
          style={[
            styles.centerBeacon,
            { backgroundColor: isVerified ? colors.success : colors.accentYellow },
            animatedPulseStyle,
          ]}
        >
          {isVerified ? (
            <CheckCircle size={32} color="#0D0D0D" strokeWidth={2.5} />
          ) : (
            <Sun size={32} color="#0D0D0D" strokeWidth={2.5} />
          )}
        </Animated.View>

        {/* Top & Bottom Stats Readouts */}
        <View style={styles.hudTopRow}>
          <Text style={[styles.hudText, { color: colors.ink, fontFamily: typography.fonts.medium }]}>
            SENSOR: AMBIENT_LIGHT_RGB
          </Text>
          <Text
            testID="environment-lux-text"
            style={[
              styles.hudText,
              { color: isVerified ? colors.success : colors.accentYellow, fontFamily: typography.fonts.bold },
            ]}
          >
            LUX: {currentLux} / {targetLux} LUX
          </Text>
        </View>

        <View style={styles.hudBottomRow}>
          <Text style={[styles.hudText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            TARGET: MORNING_ILLUMINATION
          </Text>
          <Text style={[styles.hudText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            {isVerified ? 'THRESHOLD MET' : isScanning ? 'MEASURING' : 'DARK (BED)'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {isScanning || isVerified ? (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressLabel, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              {isVerified ? 'ILLUMINATION VERIFIED!' : 'MEASURING AMBIENT LIGHT...'}
            </Text>
            <Text
              testID="environment-progress-text"
              style={[styles.progressPercent, { color: colors.ink, fontFamily: typography.fonts.bold }]}
            >
              {scanProgress}%
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${scanProgress}%`,
                  backgroundColor: isVerified ? colors.success : colors.accentYellow,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      {/* Action Button */}
      {!isVerified && (
        <Pressable
          testID="verify-environment-btn"
          onPress={handleStartScan}
          style={[
            styles.actionButton,
            {
              backgroundColor: isScanning ? colors.ink : colors.accentYellow,
            },
          ]}
        >
          <Lightbulb size={20} color={isScanning ? colors.background : '#0D0D0D'} strokeWidth={2.4} />
          <Text
            style={[
              styles.actionButtonText,
              {
                color: isScanning ? colors.background : '#0D0D0D',
                fontFamily: typography.fonts.bold,
              },
            ]}
          >
            {isScanning ? 'Measuring Environment...' : 'Scan Room Light (Simulate Sensor)'}
          </Text>
        </Pressable>
      )}

      {isScanning && !isVerified && (
        <Pressable onPress={handleReset} style={styles.resetRow}>
          <RefreshCw size={14} color={colors.muted} />
          <Text style={[styles.resetText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            Reset scanner
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
  radarFrame: {
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
  radarSweep: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarNeedle: {
    width: 2,
    height: 90,
    position: 'absolute',
    top: 0,
    borderRadius: 1,
    opacity: 0.6,
  },
  centerBeacon: {
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
