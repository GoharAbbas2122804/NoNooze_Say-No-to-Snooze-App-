import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getAlarmScheduler } from '../services/alarm-scheduler';
import { PermissionStatus } from '../services/alarm-scheduler/types';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';
import { APP_NAME } from '../constants/app';
import * as Haptics from 'expo-haptics';

export default function PermissionsScreen() {
  const [status, setStatus] = useState<PermissionStatus>({
    notifications: false,
    exactAlarms: false,
    fullScreenIntent: true,
    batteryOptimizationIgnored: false,
  });

  const checkStatus = useCallback(async () => {
    try {
      const s = await getAlarmScheduler().getPermissionStatus();
      setStatus(s);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAlarmScheduler()
      .getPermissionStatus()
      .then((s) => {
        if (active) {
          setStatus(s);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleRequestNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await getAlarmScheduler().requestPermissions();
    await checkStatus();
  };

  const handleOpenExactAlarms = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await getAlarmScheduler().openExactAlarmSettings();
    setTimeout(checkStatus, 1500);
  };

  const handleOpenBatteryOpt = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await getAlarmScheduler().openBatteryOptimizationSettings();
    setTimeout(checkStatus, 1500);
  };

  const isAllGranted =
    status.notifications &&
    status.exactAlarms &&
    status.batteryOptimizationIgnored;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.shieldEmoji}>🛡️</Text>
          <Text style={styles.title}>Alarm Reliability Setup</Text>
          <Text style={styles.subtitle}>
            Android requires specific system exemptions so {APP_NAME} rings
            unfailingly while your screen is off, in deep sleep (Doze), or when
            the app is swiped away.
          </Text>
        </View>

        <View style={styles.cardsList}>
          {/* 1. Notifications */}
          <View style={styles.permissionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.permissionName}>1. Notifications</Text>
              <View
                style={[
                  styles.statusBadge,
                  status.notifications && styles.statusBadgeGranted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    status.notifications && styles.statusBadgeTextGranted,
                  ]}
                >
                  {status.notifications ? '✓ Granted' : 'Required'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>
              Allows foreground alarm notifications and audio playback alerts.
            </Text>
            {!status.notifications && (
              <TouchableOpacity
                testID="enable-notifications-btn"
                style={styles.actionBtn}
                onPress={handleRequestNotifications}
              >
                <Text style={styles.actionBtnText}>Allow Notifications</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 2. Exact Alarms */}
          <View style={styles.permissionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.permissionName}>2. Exact Alarms</Text>
              <View
                style={[
                  styles.statusBadge,
                  status.exactAlarms && styles.statusBadgeGranted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    status.exactAlarms && styles.statusBadgeTextGranted,
                  ]}
                >
                  {status.exactAlarms ? '✓ Granted' : 'Required'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>
              Required for Android to wake your phone at the exact minute
              without OS power delay.
            </Text>
            {!status.exactAlarms && (
              <TouchableOpacity
                testID="enable-exact-alarms-btn"
                style={styles.actionBtn}
                onPress={handleOpenExactAlarms}
              >
                <Text style={styles.actionBtnText}>Open Exact Alarm Settings</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 3. Full-Screen Intent */}
          <View style={styles.permissionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.permissionName}>3. Full-Screen Wakeup</Text>
              <View style={[styles.statusBadge, styles.statusBadgeGranted]}>
                <Text style={[styles.statusBadgeText, styles.statusBadgeTextGranted]}>
                  ✓ Enabled
                </Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>
              Enables the ringing challenge screen to display directly over your
              lock screen.
            </Text>
          </View>

          {/* 4. Battery Optimization */}
          <View style={styles.permissionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.permissionName}>4. Battery Optimization</Text>
              <View
                style={[
                  styles.statusBadge,
                  status.batteryOptimizationIgnored && styles.statusBadgeGranted,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    status.batteryOptimizationIgnored && styles.statusBadgeTextGranted,
                  ]}
                >
                  {status.batteryOptimizationIgnored ? '✓ Exempt' : 'Recommended'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>
              Prevents Android Doze mode and OEM battery managers (Xiaomi,
              Vivo, Samsung) from putting the alarm to sleep overnight.
            </Text>
            {!status.batteryOptimizationIgnored && (
              <TouchableOpacity
                testID="enable-battery-opt-btn"
                style={styles.actionBtn}
                onPress={handleOpenBatteryOpt}
              >
                <Text style={styles.actionBtnText}>
                  Disable Battery Optimization
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          testID="permissions-continue-btn"
          style={[styles.continueButton, isAllGranted && styles.continueButtonPrimary]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {isAllGranted ? 'Continue to Alarms' : 'Done & Return'}
          </Text>
        </TouchableOpacity>
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
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  shieldEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardsList: {
    gap: spacing.base,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  statusBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  statusBadgeGranted: {
    backgroundColor: 'rgba(112, 244, 100, 0.15)',
  },
  statusBadgeText: {
    color: colors.error,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  statusBadgeTextGranted: {
    color: colors.primary,
  },
  cardDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  actionBtnText: {
    color: colors.accent,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.bold,
  },
  continueButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glowLime,
  },
  continueButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
});
