import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle, Calculator, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { notify } from '../../ui/notify';
import { typography, spacing, radii } from '../../theme/tokens';
import { WakeCheckState } from '../contract';

export interface WakeFallbackViewProps {
  reason?: WakeCheckState['failureReason'];
  onUseMath: () => void;
  onRetry: () => void;
}

export function WakeFallbackView({
  reason = 'timeout',
  onUseMath,
  onRetry,
}: WakeFallbackViewProps) {
  const { colors } = useTheme();

  const getReasonDetails = () => {
    switch (reason) {
      case 'too-dark':
        return {
          titlePrimary: 'Too dark',
          titleSecondary: 'to verify',
          desc: 'Lighting is too low to accurately see your eyes. Turn on a light or switch to math.',
        };
      case 'camera-error':
        return {
          titlePrimary: 'Camera',
          titleSecondary: 'unavailable',
          desc: 'Camera feed could not be opened or initialized.',
        };
      case 'permission-denied':
        return {
          titlePrimary: 'Camera',
          titleSecondary: 'permission denied',
          desc: 'Camera access is required for face detection.',
        };
      case 'model-error':
        return {
          titlePrimary: 'Model',
          titleSecondary: 'initialization failed',
          desc: 'Vision pipeline encountered an internal error.',
        };
      case 'timeout':
      default:
        return {
          titlePrimary: "Couldn't see",
          titleSecondary: 'your eyes',
          desc: 'Look directly into the camera lens and hold still.',
        };
    }
  };

  const details = getReasonDetails();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    notify.warning(`${details.titlePrimary} ${details.titleSecondary}`);
  }, [details.titlePrimary, details.titleSecondary]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="wake-fallback-view">
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(229, 55, 43, 0.12)' }]}>
          <AlertTriangle size={32} color={colors.error} />
        </View>
        <TwoToneTitle primary={details.titlePrimary} secondary={details.titleSecondary} />
        <Text style={[styles.descText, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
          {details.desc}
        </Text>
      </View>

      <View style={styles.actionsSection}>
        <Pressable
          testID="fallback-math-btn"
          onPress={onUseMath}
          style={[styles.primaryButton, { backgroundColor: colors.accentYellow }]}
          accessibilityRole="button"
          accessibilityLabel="Use math challenge instead"
        >
          <Calculator size={20} color="#0D0D0D" />
          <Text style={[styles.primaryButtonText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
            Use math instead
          </Text>
        </Pressable>

        <Pressable
          testID="fallback-retry-btn"
          onPress={onRetry}
          style={styles.ghostButton}
          accessibilityRole="button"
          accessibilityLabel="Try face check again"
        >
          <RefreshCw size={16} color={colors.ink} />
          <Text style={[styles.ghostButtonText, { color: colors.ink, fontFamily: typography.fonts.medium }]}>
            Try again
          </Text>
        </Pressable>
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
  header: {
    marginTop: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  descText: {
    fontSize: typography.sizes.body,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  actionsSection: {
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.sizes.body,
    letterSpacing: 0.2,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  ghostButtonText: {
    fontSize: typography.sizes.bodySmall,
  },
});
