import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Bell,
  Clock,
  BatteryCharging,
  Volume2,
  Volume1,
  VolumeX,
  Layers,
  Sun,
  Moon,
  Laptop,
  Play,
  Minus,
  Plus,
  FolderPlus,
} from 'lucide-react-native';
import { getAlarmScheduler } from '../services/alarm-scheduler';
import { PermissionStatus } from '../services/alarm-scheduler/types';
import { useAlarmStore } from '../store/alarm-store';
import { useTheme } from '../theme/ThemeProvider';
import { ALARM_SOUNDS } from '../constants/sounds';
import { pickSoundFromDevice, previewSoundAudio } from '../services/sound-service';
import { spacing, radii, typography, iconSizes } from '../theme/tokens';
import { RoundButton } from '../components/ui/RoundButton';
import { notify } from '../ui/notify';
import { APP_NAME } from '../constants/app';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  const timeFormat = useAlarmStore((state) => state.timeFormat);
  const setTimeFormat = useAlarmStore((state) => state.setTimeFormat);

  const alarmVolume = useAlarmStore((state) => state.alarmVolume);
  const setAlarmVolume = useAlarmStore((state) => state.setAlarmVolume);

  const defaultSound = useAlarmStore((state) => state.defaultSound);
  const setDefaultSound = useAlarmStore((state) => state.setDefaultSound);
  const customSounds = useAlarmStore((state) => state.customSounds || []);
  const addCustomSound = useAlarmStore((state) => state.addCustomSound);

  const gentleWake = useAlarmStore((state) => state.gentleWake);
  const setGentleWake = useAlarmStore((state) => state.setGentleWake);

  const vibrate = useAlarmStore((state) => state.vibrate);
  const setVibrate = useAlarmStore((state) => state.setVibrate);

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

  const handleOpenGallery = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/gallery');
  };

  const handleAdjustVolume = (newVol: number) => {
    Haptics.selectionAsync().catch(() => {});
    const clamped = Math.max(0, Math.min(100, Math.round(newVol)));
    setAlarmVolume(clamped);
  };

  const handlePreviewSound = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    previewSoundAudio(defaultSound, alarmVolume);
    notify.info(`Playing preview at ${alarmVolume}% volume`);
  };

  const handlePickCustomDefaultSound = async () => {
    try {
      const picked = await pickSoundFromDevice();
      if (picked) {
        addCustomSound(picked);
        setDefaultSound(picked.name);
        notify.success(`Default sound set to "${picked.name}"`);
        previewSoundAudio(picked.uri || picked.id, alarmVolume).catch(() => {});
      }
    } catch {
      notify.error('Could not import audio file from device');
    }
  };

  const isAllGranted =
    status.notifications &&
    status.exactAlarms &&
    status.batteryOptimizationIgnored;

  const VolumeIcon =
    alarmVolume === 0 ? VolumeX : alarmVolume < 50 ? Volume1 : Volume2;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle }]}>
        <RoundButton
          variant="surface"
          size={44}
          onPress={() => router.back()}
          accessibilityLabel="Back to Alarms"
        >
          <ArrowLeft size={iconSizes.md} color={colors.ink} />
        </RoundButton>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
            Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            Preferences & Reliability
          </Text>
        </View>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Reliability Overview Banner */}
        <View
          style={[
            styles.bannerCard,
            {
              backgroundColor: isAllGranted
                ? isDark
                  ? '#13231B'
                  : '#D1E7DD'
                : isDark
                ? '#241D12'
                : '#FDF0D5',
              borderColor: isAllGranted
                ? isDark
                  ? '#1F4732'
                  : '#A3CFBB'
                : isDark
                ? '#4D3814'
                : '#FCE0A6',
            },
          ]}
        >
          <View
            style={[
              styles.bannerIconCircle,
              {
                backgroundColor: isAllGranted
                  ? isDark
                    ? '#1E3E2D'
                    : '#C1E0D0'
                  : isDark
                  ? '#3A290E'
                  : '#FAD896',
              },
            ]}
          >
            {isAllGranted ? (
              <ShieldCheck size={24} color={isDark ? '#34D399' : '#0F5132'} />
            ) : (
              <AlertTriangle size={24} color={isDark ? colors.accentYellow : '#854D0E'} />
            )}
          </View>

          <View style={styles.bannerTextGroup}>
            <Text
              style={[
                styles.bannerTitle,
                {
                  color: isAllGranted
                    ? isDark
                      ? '#34D399'
                      : '#0F5132'
                    : isDark
                    ? colors.accentYellow
                    : '#854D0E',
                  fontFamily: typography.fonts.bold,
                },
              ]}
            >
              {isAllGranted ? '100% Reliable & Protected' : 'Setup Required for Alarms'}
            </Text>
            <Text
              style={[
                styles.bannerDescription,
                {
                  color: isAllGranted
                    ? isDark
                      ? '#A7F3D0'
                      : '#146C43'
                    : isDark
                    ? '#FDE68A'
                    : '#997404',
                  fontFamily: typography.fonts.regular,
                },
              ]}
            >
              {isAllGranted
                ? `${APP_NAME} will reliably wake your phone from sleep, doze, and lock screen.`
                : 'Grant critical Android exemptions to ensure alarms never fail while you sleep.'}
            </Text>
          </View>
        </View>

        {/* SECTION 1: APPEARANCE & THEME */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            APPEARANCE & THEME
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.medium }]}>
            Color Mode ({themeMode.toUpperCase()})
          </Text>
          <Text style={[styles.rowDescription, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
            Choose Light mode for soft paper slate or Dark mode for OLED midnight black.
          </Text>

          <View style={styles.segmentedRow}>
            {[
              { id: 'system', label: 'System', Icon: Laptop },
              { id: 'light', label: 'Light', Icon: Sun },
              { id: 'dark', label: 'Dark', Icon: Moon },
            ].map(({ id, label, Icon }) => {
              const active = themeMode === id;
              return (
                <Pressable
                  key={id}
                  testID={`theme-mode-${id}-btn`}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setThemeMode(id as any);
                  }}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: active ? colors.accentYellow : colors.surfaceAlt,
                      borderColor: active ? colors.accentYellow : colors.borderSubtle,
                    },
                  ]}
                >
                  <Icon
                    size={16}
                    color={active ? '#0D0D0D' : colors.ink}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.segmentButtonText,
                      {
                        color: active ? '#0D0D0D' : colors.ink,
                        fontFamily: active ? typography.fonts.bold : typography.fonts.medium,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SECTION 2: TIME & CLOCK DISPLAY */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            TIME & CLOCK DISPLAY
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.medium }]}>
            Clock Time Format
          </Text>
          <Text style={[styles.rowDescription, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
            Select standard 12-hour display with AM/PM indicators or continuous 24-hour time.
          </Text>

          <View style={styles.segmentedRow}>
            <TouchableOpacity
              testID="time-format-12h-btn"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setTimeFormat('12h');
              }}
              style={[
                styles.segmentButton,
                {
                  backgroundColor: timeFormat === '12h' ? colors.accentYellow : colors.surfaceAlt,
                  borderColor: timeFormat === '12h' ? colors.accentYellow : colors.borderSubtle,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  {
                    color: timeFormat === '12h' ? '#0D0D0D' : colors.ink,
                    fontFamily: timeFormat === '12h' ? typography.fonts.bold : typography.fonts.medium,
                  },
                ]}
              >
                12-Hour (AM / PM)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="time-format-24h-btn"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setTimeFormat('24h');
              }}
              style={[
                styles.segmentButton,
                {
                  backgroundColor: timeFormat === '24h' ? colors.accentYellow : colors.surfaceAlt,
                  borderColor: timeFormat === '24h' ? colors.accentYellow : colors.borderSubtle,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  {
                    color: timeFormat === '24h' ? '#0D0D0D' : colors.ink,
                    fontFamily: timeFormat === '24h' ? typography.fonts.bold : typography.fonts.medium,
                  },
                ]}
              >
                24-Hour (24h)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: SOUND & WAKE-UP EXPERIENCE */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            SOUND & WAKE-UP EXPERIENCE
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          {/* Default Alarm Sound Name */}
          <View style={styles.soundHeaderRow}>
            <View style={styles.soundTitleGroup}>
              <VolumeIcon size={iconSizes.sm} color={colors.accentYellow} />
              <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold, marginLeft: 8 }]}>
                Default Alarm Sound
              </Text>
            </View>
            <TouchableOpacity
              onPress={handlePreviewSound}
              style={[styles.previewBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderSubtle }]}
              accessibilityLabel="Preview sound"
            >
              <Play size={12} color={colors.ink} />
              <Text style={[styles.previewBadgeText, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Preview
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sound selection chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.soundChipsContainer}
          >
            {/* Pick from device chip */}
            <Pressable
              testID="settings-import-sound-btn"
              onPress={handlePickCustomDefaultSound}
              style={[
                styles.soundChip,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.borderSubtle,
                  flexDirection: 'row',
                  alignItems: 'center',
                },
              ]}
            >
              <FolderPlus size={14} color={colors.accentYellow} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.soundChipText,
                  {
                    color: colors.ink,
                    fontFamily: typography.fonts.medium,
                  },
                ]}
              >
                + Pick from Device
              </Text>
            </Pressable>

            {/* Custom sounds */}
            {customSounds.map((s) => {
              const isSelected = defaultSound === s.name || defaultSound === s.id;
              return (
                <Pressable
                  key={s.id}
                  testID={`sound-chip-${s.id}`}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setDefaultSound(s.name);
                  }}
                  style={[
                    styles.soundChip,
                    {
                      backgroundColor: isSelected ? colors.ink : colors.surfaceAlt,
                      borderColor: isSelected ? colors.ink : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.soundChipText,
                      {
                        color: isSelected ? colors.background : colors.muted,
                        fontFamily: isSelected ? typography.fonts.bold : typography.fonts.medium,
                      },
                    ]}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}

            {/* Built-in sounds */}
            {ALARM_SOUNDS.map((s) => {
              const isSelected = defaultSound === s.id || defaultSound === s.name;
              return (
                <Pressable
                  key={s.id}
                  testID={`sound-chip-${s.id}`}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setDefaultSound(s.name);
                  }}
                  style={[
                    styles.soundChip,
                    {
                      backgroundColor: isSelected ? colors.ink : colors.surfaceAlt,
                      borderColor: isSelected ? colors.ink : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.soundChipText,
                      {
                        color: isSelected ? colors.background : colors.muted,
                        fontFamily: isSelected ? typography.fonts.bold : typography.fonts.medium,
                      },
                    ]}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          {/* Interactive Volume Controls */}
          <View style={styles.volumeHeaderRow}>
            <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.medium }]}>
              Alarm Volume
            </Text>
            <Text
              testID="volume-display-text"
              style={[styles.volumeValueText, { color: colors.ink, fontFamily: typography.fonts.bold }]}
            >
              {alarmVolume}%
            </Text>
          </View>

          {/* Interactive Tap Track */}
          <View style={styles.sliderTrackContainer}>
            <Pressable
              testID="volume-track-slider"
              style={[styles.sliderTrackBackground, { backgroundColor: colors.surfaceAlt }]}
              onPress={(evt) => {
                const { locationX } = evt.nativeEvent;
                // Track width is estimated ~300dp, calculate ratio
                const percentage = Math.max(10, Math.min(100, Math.round((locationX / 280) * 100)));
                handleAdjustVolume(percentage);
              }}
            >
              <View
                style={[
                  styles.sliderTrackActive,
                  { width: `${alarmVolume}%`, backgroundColor: colors.accentYellow },
                ]}
              />
            </Pressable>
            <View
              style={[
                styles.sliderThumb,
                {
                  left: `${Math.max(0, Math.min(94, alarmVolume - 4))}%`,
                  backgroundColor: colors.ink,
                  borderColor: colors.accentYellow,
                },
              ]}
            />
          </View>

          {/* Quick Step Buttons: -10%, Presets, +10% */}
          <View style={styles.volumeActionsRow}>
            <RoundButton
              testID="volume-down-btn"
              variant="surface"
              size={44}
              onPress={() => handleAdjustVolume(alarmVolume - 10)}
              accessibilityLabel="Lower alarm volume"
            >
              <Minus size={18} color={colors.ink} strokeWidth={2.5} />
            </RoundButton>

            {/* Quick volume preset chips */}
            <View style={styles.presetButtonsRow}>
              {[25, 50, 75, 100].map((val) => {
                const isSelected = Math.abs(alarmVolume - val) < 5;
                return (
                  <Pressable
                    key={val}
                    testID={`volume-preset-${val}`}
                    onPress={() => handleAdjustVolume(val)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? colors.accentYellow : colors.surfaceAlt,
                        borderColor: isSelected ? colors.accentYellow : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        {
                          color: isSelected ? '#0D0D0D' : colors.ink,
                          fontFamily: isSelected ? typography.fonts.bold : typography.fonts.medium,
                        },
                      ]}
                    >
                      {val}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <RoundButton
              testID="volume-up-btn"
              variant="surface"
              size={44}
              onPress={() => handleAdjustVolume(alarmVolume + 10)}
              accessibilityLabel="Raise alarm volume"
            >
              <Plus size={18} color={colors.ink} strokeWidth={2.5} />
            </RoundButton>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          {/* Gentle Wake-up toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.medium }]}>
                Gentle Wake-Up (Volume Ramp)
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
                Gradually raises volume from 10% to target over 30s so you wake calmly.
              </Text>
            </View>
            <Switch
              testID="gentle-wake-switch"
              value={gentleWake}
              onValueChange={(val) => {
                Haptics.selectionAsync().catch(() => {});
                setGentleWake(val);
              }}
              trackColor={{ false: colors.disabled, true: colors.accentYellow }}
              thumbColor={colors.ink}
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          {/* Vibration toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.medium }]}>
                Vibrate on Alarm
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
                Dual sensory arousal pattern pulses simultaneously with audio tone.
              </Text>
            </View>
            <Switch
              testID="vibrate-switch"
              value={vibrate}
              onValueChange={(val) => {
                Haptics.selectionAsync().catch(() => {});
                setVibrate(val);
              }}
              trackColor={{ false: colors.disabled, true: colors.accentYellow }}
              thumbColor={colors.ink}
            />
          </View>
        </View>

        {/* SECTION 4: SYSTEM RELIABILITY EXEMPTIONS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            SYSTEM RELIABILITY PERMISSIONS
          </Text>
        </View>

        {/* Exact Alarms Permission Card */}
        <View style={[styles.permissionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.permissionIconCol}>
            <View style={[styles.permIconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <Clock size={iconSizes.sm} color={status.exactAlarms ? colors.accentYellow : colors.muted} />
            </View>
          </View>
          <View style={styles.permissionContentCol}>
            <View style={styles.permissionTitleRow}>
              <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Schedule Exact Alarms
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: status.exactAlarms ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: status.exactAlarms ? colors.success : colors.error, fontFamily: typography.fonts.bold },
                  ]}
                >
                  {status.exactAlarms ? 'GRANTED' : 'REQUIRED'}
                </Text>
              </View>
            </View>
            <Text style={[styles.permissionDesc, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
              Guarantees the Android AlarmManager fires at the exact scheduled second, even in deep sleep.
            </Text>
            {!status.exactAlarms && (
              <TouchableOpacity
                style={[styles.grantButton, { backgroundColor: colors.accentYellow }]}
                onPress={handleOpenExactAlarms}
                activeOpacity={0.8}
              >
                <Text style={[styles.grantButtonText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
                  Open Exact Alarm Settings
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Battery Optimization Card */}
        <View style={[styles.permissionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.permissionIconCol}>
            <View style={[styles.permIconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <BatteryCharging
                size={iconSizes.sm}
                color={status.batteryOptimizationIgnored ? colors.accentYellow : colors.muted}
              />
            </View>
          </View>
          <View style={styles.permissionContentCol}>
            <View style={styles.permissionTitleRow}>
              <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Ignore Battery Optimizations
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: status.batteryOptimizationIgnored ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: status.batteryOptimizationIgnored ? colors.success : colors.error,
                      fontFamily: typography.fonts.bold,
                    },
                  ]}
                >
                  {status.batteryOptimizationIgnored ? 'EXEMPTED' : 'REQUIRED'}
                </Text>
              </View>
            </View>
            <Text style={[styles.permissionDesc, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
              Prevents Android Doze mode from sleeping or deferring alarms when your screen is off overnight.
            </Text>
            {!status.batteryOptimizationIgnored && (
              <TouchableOpacity
                style={[styles.grantButton, { backgroundColor: colors.accentYellow }]}
                onPress={handleOpenBatteryOpt}
                activeOpacity={0.8}
              >
                <Text style={[styles.grantButtonText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
                  Exempt from Battery Optimization
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications Permission Card */}
        <View style={[styles.permissionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.permissionIconCol}>
            <View style={[styles.permIconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <Bell size={iconSizes.sm} color={status.notifications ? colors.accentYellow : colors.muted} />
            </View>
          </View>
          <View style={styles.permissionContentCol}>
            <View style={styles.permissionTitleRow}>
              <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Notifications & Full Screen
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: status.notifications ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: status.notifications ? colors.success : colors.error, fontFamily: typography.fonts.bold },
                  ]}
                >
                  {status.notifications ? 'ACTIVE' : 'ACTION NEEDED'}
                </Text>
              </View>
            </View>
            <Text style={[styles.permissionDesc, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
              Required to show full-screen lockscreen alarms with wakefulness challenges.
            </Text>
            {!status.notifications && (
              <TouchableOpacity
                style={[styles.grantButton, { backgroundColor: colors.accentYellow }]}
                onPress={handleRequestNotifications}
                activeOpacity={0.8}
              >
                <Text style={[styles.grantButtonText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
                  Enable Notifications
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Developer Design System Gallery Link */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            DEVELOPER & DESIGN TOKENS
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenGallery}
          style={[styles.galleryNavCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
          activeOpacity={0.8}
        >
          <View style={styles.galleryNavLeft}>
            <Layers size={iconSizes.md} color={colors.accentYellow} />
            <View style={styles.galleryNavTextGroup}>
              <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Design Tokens & Component Gallery
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
                View live palette swatches, typography scales, buttons, and test states.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.h3,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: typography.sizes.caption,
    marginTop: 2,
  },
  container: {
    padding: spacing.base,
    paddingBottom: 60,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.sizes.body,
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: typography.sizes.bodySmall,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.micro,
    letterSpacing: 1.2,
  },
  card: {
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  rowTitle: {
    fontSize: typography.sizes.body,
  },
  rowDescription: {
    fontSize: typography.sizes.bodySmall,
    marginTop: 4,
    lineHeight: 18,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  segmentButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  segmentButtonText: {
    fontSize: typography.sizes.bodySmall,
  },
  soundHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  soundTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  previewBadgeText: {
    fontSize: typography.sizes.caption,
  },
  soundChipsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  soundChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  soundChipText: {
    fontSize: typography.sizes.caption,
  },
  volumeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  volumeValueText: {
    fontSize: typography.sizes.bodyLarge,
  },
  sliderTrackContainer: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: spacing.xs,
  },
  sliderTrackBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  sliderTrackActive: {
    height: '100%',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    top: 8,
  },
  volumeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: typography.sizes.caption,
  },
  rowDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextGroup: {
    flex: 1,
    marginRight: spacing.md,
  },
  permissionCard: {
    flexDirection: 'row',
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  permissionIconCol: {
    marginRight: spacing.md,
  },
  permIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContentCol: {
    flex: 1,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusBadgeText: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.5,
  },
  permissionDesc: {
    fontSize: typography.sizes.bodySmall,
    marginTop: 4,
    lineHeight: 18,
  },
  grantButton: {
    marginTop: spacing.sm,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  grantButtonText: {
    fontSize: typography.sizes.bodySmall,
  },
  galleryNavCard: {
    padding: spacing.base,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  galleryNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  galleryNavTextGroup: {
    flex: 1,
  },
});
