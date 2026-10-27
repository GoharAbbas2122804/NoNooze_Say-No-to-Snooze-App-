import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Bell,
  Clock,
  Smartphone,
  BatteryCharging,
  Volume2,
  Vibrate,
  Lock,
  Layers,
  Check,
} from 'lucide-react-native';
import { getAlarmScheduler } from '../services/alarm-scheduler';
import { PermissionStatus } from '../services/alarm-scheduler/types';
import { useAlarmStore } from '../store/alarm-store';
import { colors, spacing, radii, typography, shadows, iconSizes } from '../theme/tokens';
import { APP_NAME } from '../constants/app';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const timeFormat = useAlarmStore((state) => state.timeFormat);
  const setTimeFormat = useAlarmStore((state) => state.setTimeFormat);

  const [status, setStatus] = useState<PermissionStatus>({
    notifications: false,
    exactAlarms: false,
    fullScreenIntent: true,
    batteryOptimizationIgnored: false,
  });

  // Sound & Wake-up preference state
  const [volume, setVolume] = useState(80);
  const [gentleWake, setGentleWake] = useState(true);
  const [vibrate, setVibrate] = useState(true);

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

  const handleOpenGallery = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/gallery');
  };

  const handleAdjustVolume = (newVol: number) => {
    Haptics.selectionAsync().catch(() => {});
    setVolume(Math.max(10, Math.min(100, newVol)));
  };

  const isAllGranted =
    status.notifications &&
    status.exactAlarms &&
    status.batteryOptimizationIgnored;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Back to Alarms"
          activeOpacity={0.7}
        >
          <ArrowLeft size={iconSizes.md} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Preferences & Reliability</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Reliability Overview Banner */}
        <View
          style={[
            styles.bannerCard,
            isAllGranted ? styles.bannerCardSuccess : styles.bannerCardWarning,
          ]}
        >
          <View
            style={[
              styles.bannerIconCircle,
              isAllGranted ? styles.bannerIconCircleSuccess : styles.bannerIconCircleWarning,
            ]}
          >
            {isAllGranted ? (
              <ShieldCheck size={24} color={colors.primary} />
            ) : (
              <AlertTriangle size={24} color={colors.accent} />
            )}
          </View>

          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>
              {isAllGranted
                ? 'Alarms are 100% Reliable'
                : 'Reliability Exemptions Required'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isAllGranted
                ? 'System exemptions active. Alarms will ring through Doze and screen lock.'
                : 'Android may delay background alarms without exact alarm and battery exemptions.'}
            </Text>
          </View>
        </View>

        {/* Section: Time Format & Display */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>TIME & CLOCK DISPLAY</Text>
            <Text style={styles.sectionBadge}>
              {timeFormat === '12h' ? '12-Hour Active' : '24-Hour Active'}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.rowIconCircle}>
              <Clock size={iconSizes.md} color={colors.primary} />
            </View>

            <View style={styles.rowContent}>
              <View style={styles.rowTitleHeader}>
                <Text style={styles.rowTitle}>Time Format</Text>
              </View>
              <Text style={styles.rowDescription}>
                Choose between 12-hour (AM/PM) and 24-hour display across your alarms, alarm editor, and home clock.
              </Text>

              {/* Segmented Control Pills */}
              <View style={styles.formatSegmentContainer}>
                <TouchableOpacity
                  testID="time-format-12h-btn"
                  style={[
                    styles.formatSegmentBtn,
                    timeFormat === '12h' && styles.formatSegmentBtnActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setTimeFormat('12h');
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="12-hour time format with AM and PM"
                >
                  <Text
                    style={[
                      styles.formatSegmentText,
                      timeFormat === '12h' && styles.formatSegmentTextActive,
                    ]}
                  >
                    12-Hour (AM / PM)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="time-format-24h-btn"
                  style={[
                    styles.formatSegmentBtn,
                    timeFormat === '24h' && styles.formatSegmentBtnActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setTimeFormat('24h');
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="24-hour military time format"
                >
                  <Text
                    style={[
                      styles.formatSegmentText,
                      timeFormat === '24h' && styles.formatSegmentTextActive,
                    ]}
                  >
                    24-Hour (24h)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Section 1: Android System Permissions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>RELIABILITY & PERMISSIONS</Text>
            <Text style={styles.sectionBadge}>
              {isAllGranted ? 'All Active' : 'Action Needed'}
            </Text>
          </View>

          {/* 1. Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.rowIconCircle}>
              <Bell size={iconSizes.md} color={colors.textSecondary} />
            </View>

            <View style={styles.rowContent}>
              <View style={styles.rowTitleHeader}>
                <Text style={styles.rowTitle}>Notifications</Text>
                <View
                  style={[
                    styles.statusBadge,
                    status.notifications ? styles.statusBadgeGranted : styles.statusBadgeRequired,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      status.notifications ? styles.statusBadgeTextGranted : styles.statusBadgeTextRequired,
                    ]}
                  >
                    {status.notifications ? '✓ Granted' : 'Required'}
                  </Text>
                </View>
              </View>
              <Text style={styles.rowDescription}>
                Displays ringing alerts and persistent notification controls.
              </Text>

              {!status.notifications && (
                <TouchableOpacity
                  testID="enable-notifications-btn"
                  style={styles.actionButton}
                  onPress={handleRequestNotifications}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Allow Notifications</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* 2. Exact Alarms */}
          <View style={styles.settingRow}>
            <View style={styles.rowIconCircle}>
              <Clock size={iconSizes.md} color={colors.textSecondary} />
            </View>

            <View style={styles.rowContent}>
              <View style={styles.rowTitleHeader}>
                <Text style={styles.rowTitle}>Exact Alarms</Text>
                <View
                  style={[
                    styles.statusBadge,
                    status.exactAlarms ? styles.statusBadgeGranted : styles.statusBadgeRequired,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      status.exactAlarms ? styles.statusBadgeTextGranted : styles.statusBadgeTextRequired,
                    ]}
                  >
                    {status.exactAlarms ? '✓ Granted' : 'Required'}
                  </Text>
                </View>
              </View>
              <Text style={styles.rowDescription}>
                Wakes the device at the exact target minute without power saving delay.
              </Text>

              {!status.exactAlarms && (
                <TouchableOpacity
                  testID="enable-exact-alarms-btn"
                  style={styles.actionButton}
                  onPress={handleOpenExactAlarms}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Open Exact Alarm Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* 3. Full-Screen Intent */}
          <View style={styles.settingRow}>
            <View style={styles.rowIconCircle}>
              <Smartphone size={iconSizes.md} color={colors.textSecondary} />
            </View>

            <View style={styles.rowContent}>
              <View style={styles.rowTitleHeader}>
                <Text style={styles.rowTitle}>Full-Screen Wakeup</Text>
                <View style={[styles.statusBadge, styles.statusBadgeGranted]}>
                  <Text style={[styles.statusBadgeText, styles.statusBadgeTextGranted]}>
                    ✓ Enabled
                  </Text>
                </View>
              </View>
              <Text style={styles.rowDescription}>
                Presents the interactive challenge screen directly over lock screen.
              </Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* 4. Battery Optimization */}
          <View style={styles.settingRow}>
            <View style={styles.rowIconCircle}>
              <BatteryCharging size={iconSizes.md} color={colors.textSecondary} />
            </View>

            <View style={styles.rowContent}>
              <View style={styles.rowTitleHeader}>
                <Text style={styles.rowTitle}>Battery Optimization</Text>
                <View
                  style={[
                    styles.statusBadge,
                    status.batteryOptimizationIgnored
                      ? styles.statusBadgeGranted
                      : styles.statusBadgeWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      status.batteryOptimizationIgnored
                        ? styles.statusBadgeTextGranted
                        : styles.statusBadgeTextWarning,
                    ]}
                  >
                    {status.batteryOptimizationIgnored ? '✓ Exempt' : 'Recommended'}
                  </Text>
                </View>
              </View>
              <Text style={styles.rowDescription}>
                Prevents Android Doze mode and OEM task killers from killing the alarm.
              </Text>

              {!status.batteryOptimizationIgnored && (
                <TouchableOpacity
                  testID="enable-battery-opt-btn"
                  style={styles.actionButton}
                  onPress={handleOpenBatteryOpt}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Disable Battery Optimization</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Section 2: Sound & Wake-Up Preferences (Inspiration 2 Match) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOUND & WAKE-UP EXPERIENCE</Text>

          {/* Sound Name & Slider (Design Inspiration 2 Match) */}
          <View style={styles.soundCard}>
            <View style={styles.soundHeaderRow}>
              <View style={styles.soundTitleGroup}>
                <Volume2 size={iconSizes.sm} color={colors.textSecondary} />
                <Text style={styles.soundLabel}>Alarm Sound</Text>
              </View>
              <Text style={styles.soundValue}>Melodian</Text>
            </View>

            {/* Interactive Volume Track (Inspiration 2 neon green track) */}
            <View style={styles.sliderTrackContainer}>
              <View style={styles.sliderTrackBackground}>
                <View style={[styles.sliderTrackActive, { width: `${volume}%` }]} />
              </View>
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${Math.max(0, Math.min(94, volume - 4))}%` },
                ]}
              />
            </View>

            <View style={styles.sliderLabelsRow}>
              <TouchableOpacity onPress={() => handleAdjustVolume(volume - 15)}>
                <Text style={styles.sliderActionText}>− Lower</Text>
              </TouchableOpacity>
              <Text style={styles.volumePercentText}>{volume}%</Text>
              <TouchableOpacity onPress={() => handleAdjustVolume(volume + 15)}>
                <Text style={styles.sliderActionText}>+ Louder</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Gentle Wake-up toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <Text style={styles.rowTitle}>Gentle Wake-Up (Volume Ramp)</Text>
              <Text style={styles.rowDescription}>
                Gradually raises volume from 10% to target over 30s so you wake calmly at 5 AM.
              </Text>
            </View>
            <Switch
              value={gentleWake}
              onValueChange={setGentleWake}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={colors.switchThumb}
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Vibration toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <View style={styles.iconInlineGroup}>
                <Vibrate size={iconSizes.sm} color={colors.textSecondary} />
                <Text style={styles.rowTitle}>Vibrate With Sound</Text>
              </View>
              <Text style={styles.rowDescription}>
                Pulsing tactile haptic patterns synchronized with the alarm melody.
              </Text>
            </View>
            <Switch
              value={vibrate}
              onValueChange={setVibrate}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={colors.switchThumb}
            />
          </View>
        </View>

        {/* Section 3: Strict Anti-Snooze Protocol */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANTI-SNOOZE ENFORCEMENT</Text>

          <View style={styles.settingRow}>
            <View style={styles.rowIconCircle}>
              <Lock size={iconSizes.md} color={colors.primary} />
            </View>

            <View style={styles.rowContent}>
              <View style={styles.rowTitleHeader}>
                <Text style={styles.rowTitle}>Unskippable Challenge Mode</Text>
                <View style={[styles.statusBadge, styles.statusBadgeGranted]}>
                  <Text style={[styles.statusBadgeText, styles.statusBadgeTextGranted]}>
                    Locked Active
                  </Text>
                </View>
              </View>
              <Text style={styles.rowDescription}>
                Snooze buttons are eliminated. Alarms will only silence once you finish your configured mental or physical challenges.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: Developer & About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT & TOOLS</Text>

          <TouchableOpacity
            style={styles.clickableRow}
            onPress={handleOpenGallery}
            activeOpacity={0.7}
          >
            <View style={styles.rowIconCircle}>
              <Layers size={iconSizes.md} color={colors.accent} />
            </View>

            <View style={styles.rowContent}>
              <View style={styles.rowTitleHeader}>
                <Text style={styles.rowTitle}>Component Design Gallery</Text>
                <Text style={styles.chevronText}>→</Text>
              </View>
              <Text style={styles.rowDescription}>
                Preview design tokens, button states, and theme elements.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{APP_NAME} Version</Text>
            <Text style={styles.aboutValue}>v1.0.0 (Build 2026)</Text>
          </View>
        </View>

        {/* Done / Continue Button */}
        <TouchableOpacity
          testID="permissions-continue-btn"
          style={[
            styles.continueButton,
            isAllGranted ? styles.continueButtonPrimary : styles.continueButtonSecondary,
          ]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Check size={iconSizes.md} color={colors.textInverse} strokeWidth={2.5} />
          <Text style={styles.continueButtonText}>
            {isAllGranted ? 'Save & Return to Alarms' : 'Done & Return'}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
  headerRightSpacer: {
    width: 44,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 60,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  bannerCardSuccess: {
    backgroundColor: 'rgba(112, 244, 100, 0.08)',
    borderColor: 'rgba(112, 244, 100, 0.3)',
  },
  bannerCardWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderColor: 'rgba(255, 149, 0, 0.35)',
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerIconCircleSuccess: {
    backgroundColor: 'rgba(112, 244, 100, 0.18)',
  },
  bannerIconCircleWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.18)',
  },
  bannerTextContainer: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  bannerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
    lineHeight: 16,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
  },
  sectionBadge: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  settingRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  clickableRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  rowIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  rowDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    lineHeight: 18,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusBadgeGranted: {
    backgroundColor: 'rgba(112, 244, 100, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(112, 244, 100, 0.3)',
  },
  statusBadgeRequired: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  statusBadgeText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
  statusBadgeTextGranted: {
    color: colors.primary,
  },
  statusBadgeTextRequired: {
    color: colors.error,
  },
  statusBadgeTextWarning: {
    color: colors.accent,
  },
  actionButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  actionButtonText: {
    color: colors.accent,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.bold,
  },
  soundCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.base,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  soundHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soundTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  soundLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  soundValue: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.bold,
  },
  sliderTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBackground: {
    height: 6,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  sliderTrackActive: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    ...shadows.glowLime,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary,
    top: 2,
    ...shadows.card,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderActionText: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  volumePercentText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleTextGroup: {
    flex: 1,
    gap: 2,
  },
  iconInlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chevronText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
  },
  aboutValue: {
    color: colors.textMuted,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 54,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
  },
  continueButtonPrimary: {
    backgroundColor: colors.primary,
    ...shadows.glowLime,
  },
  continueButtonSecondary: {
    backgroundColor: colors.accent,
    ...shadows.glowAccent,
  },
  continueButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  formatSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 3,
    marginTop: spacing.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  formatSegmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatSegmentBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.glowLime,
  },
  formatSegmentText: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  formatSegmentTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
});
