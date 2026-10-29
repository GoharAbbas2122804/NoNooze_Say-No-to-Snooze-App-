import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ShieldCheck, EyeOff, Clock, Camera } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { typography, spacing, radii, iconSizes } from '../../theme/tokens';

export interface CameraRationaleProps {
  onContinue: () => void;
  onFallbackMath?: () => void;
}

export function CameraRationale({ onContinue, onFallbackMath }: CameraRationaleProps) {
  const { colors } = useTheme();

  const privacyPoints = [
    {
      icon: ShieldCheck,
      title: 'Frames never leave the phone',
      desc: 'All computer vision and eye tracking runs 100% on device.',
    },
    {
      icon: EyeOff,
      title: 'Nothing is stored or recorded',
      desc: 'Images are processed in memory and discarded instantly.',
    },
    {
      icon: Clock,
      title: 'Active only while alarm rings',
      desc: 'The sensor shuts down completely the moment you wake up.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="camera-rationale-view">
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
          <Camera size={32} color={colors.accentYellow} />
        </View>
        <TwoToneTitle primary="Camera" secondary="stays on your phone" />
      </View>

      <View style={styles.pointsList}>
        {privacyPoints.map((item, idx) => {
          const Icon = item.icon;
          return (
            <View
              key={idx}
              style={[styles.pointCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            >
              <View style={[styles.pointIconBox, { backgroundColor: colors.surfaceAlt }]}>
                <Icon size={iconSizes.sm} color={colors.ink} strokeWidth={2} />
              </View>
              <View style={styles.pointTextColumn}>
                <Text style={[styles.pointTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                  {item.title}
                </Text>
                <Text style={[styles.pointDesc, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
                  {item.desc}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.actionSection}>
        <Pressable
          testID="camera-enable-btn"
          onPress={onContinue}
          style={[styles.primaryButton, { backgroundColor: colors.accentYellow }]}
          accessibilityRole="button"
          accessibilityLabel="Enable camera for wake check"
        >
          <Text style={[styles.primaryButtonText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
            Enable Camera
          </Text>
        </Pressable>

        {onFallbackMath ? (
          <Pressable
            testID="camera-fallback-math-btn"
            onPress={onFallbackMath}
            style={styles.fallbackButton}
            accessibilityRole="button"
            accessibilityLabel="Use math challenge instead"
          >
            <Text style={[styles.fallbackButtonText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              Use math instead
            </Text>
          </Pressable>
        ) : null}
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
    marginBottom: spacing.md,
  },
  pointsList: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.base,
  },
  pointIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointTextColumn: {
    flex: 1,
  },
  pointTitle: {
    fontSize: typography.sizes.body,
    letterSpacing: -0.2,
  },
  pointDesc: {
    fontSize: typography.sizes.bodySmall,
    marginTop: 2,
    lineHeight: 18,
  },
  actionSection: {
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: typography.sizes.body,
    letterSpacing: 0.2,
  },
  fallbackButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  fallbackButtonText: {
    fontSize: typography.sizes.bodySmall,
  },
});
