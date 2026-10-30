import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  X,
  Check,
  Bell,
  Zap,
  Repeat,
  Play,
  Smile,
  Sun,
  Dumbbell,
  Calculator,
  Plus,
  Minus,
  FolderPlus,
  Music,
  ChevronRight,
} from 'lucide-react-native';
import { useAlarmStore } from '../store/alarm-store';
import { DayOfWeek, Step, MethodId } from '../domain/types';
import { parseTo12Hour, formatTo24Hour } from '../domain/time-format';
import { useTheme } from '../theme/ThemeProvider';
import { WheelPickerColumn } from '../components/alarm/WheelPicker';
import { RoundButton } from '../components/ui/RoundButton';
import { notify } from '../ui/notify';
import { typography, spacing, radii, iconSizes } from '../theme/tokens';
import { ALARM_SOUNDS } from '../constants/sounds';
import { pickSoundFromDevice, previewSoundAudio } from '../services/sound-service';
import { DISMISSAL_METHODS } from '../domain/dismissal-registry';
import * as Haptics from 'expo-haptics';

export default function EditAlarmScreen() {
  const { colors } = useTheme();
  const { id, challenge } = useLocalSearchParams<{ id?: string; challenge?: MethodId }>();
  const isEditing = Boolean(id);

  const existingAlarm = useAlarmStore((state) =>
    id ? state.getAlarmById(id) : undefined
  );

  const timeFormat = useAlarmStore((state) => state.timeFormat);
  const setTimeFormat = useAlarmStore((state) => state.setTimeFormat);
  const defaultStoreSound = useAlarmStore((state) => state.defaultSound);
  const customSounds = useAlarmStore((state) => state.customSounds || []);
  const addCustomSound = useAlarmStore((state) => state.addCustomSound);
  const addAlarm = useAlarmStore((state) => state.addAlarm);
  const updateAlarm = useAlarmStore((state) => state.updateAlarm);
  const deleteAlarm = useAlarmStore((state) => state.deleteAlarm);

  const [pageScrollEnabled, setPageScrollEnabled] = useState(true);

  // Form State based on 12h or 24h format
  const initialTimeParts = React.useMemo(() => {
    if (existingAlarm) {
      if (timeFormat === '12h') {
        const p = parseTo12Hour(existingAlarm.time);
        return { hours: p.hoursString, minutes: p.minutesString, ampm: p.ampm };
      }
      const [h, m] = existingAlarm.time.split(':');
      return { hours: h || '07', minutes: m || '00', ampm: 'AM' as const };
    }
    return { hours: '07', minutes: '00', ampm: 'AM' as const };
  }, [existingAlarm, timeFormat]);

  const [hours, setHours] = useState(initialTimeParts.hours);
  const [minutes, setMinutes] = useState(initialTimeParts.minutes);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initialTimeParts.ampm);

  useEffect(() => {
    setHours(initialTimeParts.hours);
    setMinutes(initialTimeParts.minutes);
    setAmpm(initialTimeParts.ampm);
  }, [initialTimeParts]);

  const [days, setDays] = useState<DayOfWeek[]>(existingAlarm?.days || []);
  const [label, setLabel] = useState(existingAlarm?.label || '');
  const [steps, setSteps] = useState<Step[]>(() => {
    if (existingAlarm?.steps && existingAlarm.steps.length > 0) {
      return existingAlarm.steps;
    }
    if (challenge && DISMISSAL_METHODS[challenge]) {
      return [{ methodId: challenge, target: DISMISSAL_METHODS[challenge].defaultTarget || 1 }];
    }
    return [{ methodId: 'math', target: 3 }];
  });
  const [soundName, setSoundName] = useState(
    existingAlarm?.sound || defaultStoreSound || 'Melodian'
  );

  // Modals
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);

  // Clockwise / Chronological Hours list: 01, 02... 12 for 12h; 00, 01... 23 for 24h
  const hoursList = React.useMemo(() => {
    if (timeFormat === '12h') {
      return Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    }
    return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  }, [timeFormat]);

  // Clockwise / Chronological Minutes list: 00, 01, 02... 59
  const minutesList = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  }, []);

  const selectedHourIndex = Math.max(0, hoursList.indexOf(hours));
  const selectedMinuteIndex = Math.max(0, minutesList.indexOf(minutes));

  const handleHourSelect = (index: number) => {
    if (hoursList[index]) {
      setHours(hoursList[index]);
    }
  };

  const handleMinuteSelect = (index: number) => {
    if (minutesList[index]) {
      setMinutes(minutesList[index]);
    }
  };

  const QUICK_ADJUST_PRESETS = [
    { label: '-15m', delta: -15 },
    { label: '-5m', delta: -5 },
    { label: '+5m', delta: 5 },
    { label: '+15m', delta: 15 },
    { label: '+1h', delta: 60 },
  ];

  const handleQuickAdjust = (deltaMinutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const currentH = parseInt(hours, 10) || (timeFormat === '12h' ? 12 : 0);
    const currentM = parseInt(minutes, 10) || 0;

    let hour24 = currentH;
    if (timeFormat === '12h') {
      if (ampm === 'AM') {
        hour24 = currentH === 12 ? 0 : currentH;
      } else {
        hour24 = currentH === 12 ? 12 : currentH + 12;
      }
    }

    const currentTotalMinutes = hour24 * 60 + currentM;
    const newTotalMinutes = (currentTotalMinutes + deltaMinutes + 24 * 60 * 100) % (24 * 60);

    const newHour24 = Math.floor(newTotalMinutes / 60);
    const newM = newTotalMinutes % 60;

    if (timeFormat === '12h') {
      const newPeriod = newHour24 >= 12 ? 'PM' : 'AM';
      let newHour12 = newHour24 % 12;
      if (newHour12 === 0) newHour12 = 12;
      setHours(newHour12.toString().padStart(2, '0'));
      setMinutes(newM.toString().padStart(2, '0'));
      setAmpm(newPeriod);
    } else {
      setHours(newHour24.toString().padStart(2, '0'));
      setMinutes(newM.toString().padStart(2, '0'));
    }
  };

  // Repeat helper
  const getDaysSummary = (): string => {
    if (!days || days.length === 0) return 'Once (No repeat)';
    if (days.length === 7) return 'Every day';
    if (
      days.length === 5 &&
      [1, 2, 3, 4, 5].every((d) => days.includes(d as DayOfWeek))
    ) {
      return 'Weekdays (Mon–Fri)';
    }
    if (
      days.length === 2 &&
      [0, 6].every((d) => days.includes(d as DayOfWeek))
    ) {
      return 'Weekends (Sat–Sun)';
    }
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((d) => dayLabels[d]).join(', ');
  };

  const toggleDay = (day: DayOfWeek) => {
    Haptics.selectionAsync().catch(() => {});
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    } else {
      setDays([...days, day].sort());
    }
  };

  const applyPreset = (preset: 'once' | 'weekdays' | 'weekends' | 'everyday') => {
    Haptics.selectionAsync().catch(() => {});
    switch (preset) {
      case 'once':
        setDays([]);
        break;
      case 'weekdays':
        setDays([1, 2, 3, 4, 5]);
        break;
      case 'weekends':
        setDays([0, 6]);
        break;
      case 'everyday':
        setDays([0, 1, 2, 3, 4, 5, 6]);
        break;
    }
  };

  const handleSelectSound = (soundIdOrName: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSoundName(soundIdOrName);
    previewSoundAudio(soundIdOrName, 80).catch(() => {});
  };

  const handlePickCustomSound = async () => {
    try {
      const picked = await pickSoundFromDevice();
      if (picked) {
        addCustomSound(picked);
        setSoundName(picked.name);
        notify.success(`Imported "${picked.name}"`);
        previewSoundAudio(picked.uri || picked.id, 80).catch(() => {});
        setSoundModalVisible(false);
      }
    } catch {
      notify.error('Could not import audio file from device');
    }
  };

  const handleSelectChallenge = (methodId: MethodId) => {
    Haptics.selectionAsync().catch(() => {});
    const def = DISMISSAL_METHODS[methodId];
    setSteps([{ methodId, target: def?.defaultTarget || 1 }]);
    setChallengeModalVisible(false);
  };

  const handleAdjustTarget = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const current = steps[0];
    if (!current) return;
    const def = DISMISSAL_METHODS[current.methodId];
    const newTarget = Math.max(def.minTarget, Math.min(def.maxTarget, current.target + delta));
    setSteps([{ ...current, target: newTarget }]);
  };

  const handleSave = () => {
    const time =
      timeFormat === '12h'
        ? formatTo24Hour(
            parseInt(hours, 10) || 12,
            parseInt(minutes, 10) || 0,
            ampm
          )
        : `${(parseInt(hours, 10) || 0).toString().padStart(2, '0')}:${(parseInt(minutes, 10) || 0).toString().padStart(2, '0')}`;

    if (isEditing && id) {
      const result = updateAlarm(id, {
        time,
        days,
        label,
        steps,
        sound: soundName,
        enabled: true,
      });

      if (!result.success) {
        notify.error(result.errors?.join('\n') || 'Failed to update alarm');
        return;
      }
    } else {
      const result = addAlarm({
        time,
        days,
        label,
        steps,
        enabled: true,
        sound: soundName,
      });

      if (!result.success) {
        notify.error(result.errors?.join('\n') || 'Failed to save alarm');
        return;
      }
    }

    notify.success(`Alarm set for ${time}`);
    router.back();
  };

  const handleDelete = () => {
    if (!id || !existingAlarm) return;
    const savedCopy = { ...existingAlarm };
    deleteAlarm(id);
    notify.action('Alarm deleted', {
      label: 'Undo',
      onPress: () => {
        addAlarm(savedCopy);
      },
    });
    router.back();
  };

  const currentChallengeDef = DISMISSAL_METHODS[steps[0]?.methodId || 'math'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        scrollEnabled={pageScrollEnabled}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
            {isEditing ? 'Edit Alarm' : 'Set Alarm Time'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Pressable
              testID="format-toggle-btn"
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${timeFormat === '12h' ? '24-hour' : '12-hour'} format`}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setTimeFormat(timeFormat === '12h' ? '24h' : '12h');
              }}
              style={[
                styles.formatTogglePill,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.formatToggleText,
                  { color: colors.accentYellow, fontFamily: typography.fonts.bold },
                ]}
              >
                {timeFormat.toUpperCase()}
              </Text>
            </Pressable>
            {isEditing ? (
              <Pressable testID="delete-alarm-button" onPress={handleDelete}>
                <Text style={[styles.deleteText, { color: colors.error, fontFamily: typography.fonts.bold }]}>
                  Delete
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* 12h AM / PM Toggle Row */}
        {timeFormat === '12h' ? (
          <View style={styles.ampmRow}>
            <Pressable
              testID="period-am"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setAmpm('AM');
              }}
              style={[
                styles.ampmButton,
                {
                  backgroundColor: ampm === 'AM' ? colors.accentYellow : colors.surface,
                  borderColor: ampm === 'AM' ? colors.accentYellow : colors.borderSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.ampmButtonText,
                  {
                    color: ampm === 'AM' ? '#0D0D0D' : colors.muted,
                    fontFamily: ampm === 'AM' ? typography.fonts.bold : typography.fonts.medium,
                  },
                ]}
              >
                AM
              </Text>
            </Pressable>
            <Pressable
              testID="period-pm"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setAmpm('PM');
              }}
              style={[
                styles.ampmButton,
                {
                  backgroundColor: ampm === 'PM' ? colors.accentYellow : colors.surface,
                  borderColor: ampm === 'PM' ? colors.accentYellow : colors.borderSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.ampmButtonText,
                  {
                    color: ampm === 'PM' ? '#0D0D0D' : colors.muted,
                    fontFamily: ampm === 'PM' ? typography.fonts.bold : typography.fonts.medium,
                  },
                ]}
              >
                PM
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Digital Selected Readout Pill */}
        <View style={[styles.digitalPill, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text
            testID="hours-display"
            style={[styles.digitalPillNum, { color: colors.ink, fontFamily: typography.fonts.bold }]}
          >
            {hours}
          </Text>
          <Text style={[styles.digitalPillColon, { color: colors.muted }]}>:</Text>
          <Text
            testID="minutes-display"
            style={[styles.digitalPillNum, { color: colors.ink, fontFamily: typography.fonts.bold }]}
          >
            {minutes}
          </Text>
          {timeFormat === '12h' && (
            <Pressable
              testID="digital-pill-ampm-btn"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setAmpm((prev) => (prev === 'AM' ? 'PM' : 'AM'));
              }}
              style={styles.digitalPillAmpmTouch}
              accessibilityRole="button"
              accessibilityLabel={`Current period is ${ampm}. Tap to switch to ${ampm === 'AM' ? 'PM' : 'AM'}`}
            >
              <Text
                style={[
                  styles.digitalPillAmpm,
                  {
                    color: colors.accentYellow,
                    fontFamily: typography.fonts.bold,
                  },
                ]}
              >
                {ampm}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Quick Adjust Preset Pills */}
        <View style={styles.quickAdjustRow}>
          {QUICK_ADJUST_PRESETS.map((preset) => (
            <Pressable
              key={preset.label}
              testID={`quick-adjust-${preset.label}`}
              accessibilityRole="button"
              accessibilityLabel={`Adjust time by ${preset.label}`}
              onPress={() => handleQuickAdjust(preset.delta)}
              style={({ pressed }) => [
                styles.quickAdjustPill,
                {
                  backgroundColor: pressed ? colors.accentYellow : colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.quickAdjustText,
                  { color: colors.ink, fontFamily: typography.fonts.medium },
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Dual Curved Lens Wheel Pickers (Clockwise Swiping, Non-Blocking) */}
        <View
          style={styles.wheelWrapper}
        >
          <WheelPickerColumn
            testID="hours-wheel-picker"
            items={hoursList}
            selectedIndex={selectedHourIndex}
            onSelectIndex={handleHourSelect}
            isLeftColumn={true}
            label="HOURS"
            onInteractionStart={() => setPageScrollEnabled(false)}
            onInteractionEnd={() => setPageScrollEnabled(true)}
          />
          <WheelPickerColumn
            testID="minutes-wheel-picker"
            items={minutesList}
            selectedIndex={selectedMinuteIndex}
            onSelectIndex={handleMinuteSelect}
            isLeftColumn={false}
            label="MINUTES"
            onInteractionStart={() => setPageScrollEnabled(false)}
            onInteractionEnd={() => setPageScrollEnabled(true)}
          />
          {timeFormat === '12h' && (
            <View style={styles.wheelAmPmCol}>
              <Pressable
                testID="wheel-period-am"
                accessibilityRole="button"
                accessibilityLabel="Select AM"
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setAmpm('AM');
                }}
                style={[
                  styles.wheelAmPmBtn,
                  {
                    backgroundColor: ampm === 'AM' ? colors.accentYellow : colors.surface,
                    borderColor: ampm === 'AM' ? colors.accentYellow : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.wheelAmPmText,
                    {
                      color: ampm === 'AM' ? '#0D0D0D' : colors.muted,
                      fontFamily: ampm === 'AM' ? typography.fonts.bold : typography.fonts.medium,
                    },
                  ]}
                >
                  AM
                </Text>
              </Pressable>
              <Pressable
                testID="wheel-period-pm"
                accessibilityRole="button"
                accessibilityLabel="Select PM"
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setAmpm('PM');
                }}
                style={[
                  styles.wheelAmPmBtn,
                  {
                    backgroundColor: ampm === 'PM' ? colors.accentYellow : colors.surface,
                    borderColor: ampm === 'PM' ? colors.accentYellow : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.wheelAmPmText,
                    {
                      color: ampm === 'PM' ? '#0D0D0D' : colors.muted,
                      fontFamily: ampm === 'PM' ? typography.fonts.bold : typography.fonts.medium,
                    },
                  ]}
                >
                  PM
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Alarm Label Input */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <TextInput
            testID="alarm-label-input"
            value={label}
            onChangeText={setLabel}
            placeholder="Alarm label (e.g. Work Wake Up)"
            placeholderTextColor={colors.muted}
            style={[styles.textInput, { color: colors.ink, fontFamily: typography.fonts.medium }]}
          />
        </View>

        {/* REPEAT SECTION (User Request 5: Properly Visible & Adjustable) */}
        <View style={[styles.repeatCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.repeatHeaderRow}>
            <View style={styles.repeatTitleGroup}>
              <Repeat size={16} color={colors.accentYellow} />
              <Text style={[styles.cardTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Repeat Schedule
              </Text>
            </View>
            <Text
              testID="repeat-summary-text"
              style={[styles.repeatSummaryText, { color: colors.muted, fontFamily: typography.fonts.medium }]}
            >
              {getDaysSummary()}
            </Text>
          </View>

          {/* Quick Preset Pills */}
          <View style={styles.presetRow}>
            {[
              { id: 'once', label: 'Once' },
              { id: 'weekdays', label: 'Weekdays' },
              { id: 'weekends', label: 'Weekends' },
              { id: 'everyday', label: 'Every day' },
            ].map((p) => {
              const isSelected =
                (p.id === 'once' && days.length === 0) ||
                (p.id === 'everyday' && days.length === 7) ||
                (p.id === 'weekdays' &&
                  days.length === 5 &&
                  [1, 2, 3, 4, 5].every((d) => days.includes(d as DayOfWeek))) ||
                (p.id === 'weekends' &&
                  days.length === 2 &&
                  [0, 6].every((d) => days.includes(d as DayOfWeek)));

              return (
                <Pressable
                  key={p.id}
                  testID={`repeat-preset-${p.id}`}
                  onPress={() => applyPreset(p.id as any)}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: isSelected ? colors.accentYellow : colors.surfaceAlt,
                      borderColor: isSelected ? colors.accentYellow : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetPillText,
                      {
                        color: isSelected ? '#0D0D0D' : colors.ink,
                        fontFamily: isSelected ? typography.fonts.bold : typography.fonts.medium,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 7 Interactive Day Chips (M, T, W, T, F, S, S) */}
          <View style={styles.daysChipRow}>
            {[
              { day: 1 as DayOfWeek, label: 'M' },
              { day: 2 as DayOfWeek, label: 'T' },
              { day: 3 as DayOfWeek, label: 'W' },
              { day: 4 as DayOfWeek, label: 'T' },
              { day: 5 as DayOfWeek, label: 'F' },
              { day: 6 as DayOfWeek, label: 'S' },
              { day: 0 as DayOfWeek, label: 'S' },
            ].map(({ day, label }) => {
              const active = days.includes(day);
              return (
                <Pressable
                  key={day}
                  testID={`repeat-day-${day}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle day ${label}`}
                  onPress={() => toggleDay(day)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: active ? colors.accentYellow : colors.surfaceAlt,
                      borderColor: active ? colors.accentYellow : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayChipText,
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

        {/* TWO OPTION TILES: SOUND & CHALLENGE */}
        <View style={styles.optionsTilesRow}>
          {/* Sound Selector Tile */}
          <Pressable
            testID="sound-select-btn"
            onPress={() => setSoundModalVisible(true)}
            style={[styles.tileCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
          >
            <View style={styles.tileHeader}>
              <Bell size={18} color={colors.accentYellow} />
              <Text style={[styles.tileCategory, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
                SOUND
              </Text>
            </View>
            <Text
              testID="selected-sound-name"
              numberOfLines={1}
              style={[styles.tileValue, { color: colors.ink, fontFamily: typography.fonts.bold }]}
            >
              {soundName}
            </Text>
            <Text style={[styles.tileSub, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
              Tap to change
            </Text>
          </Pressable>

          {/* AI Challenge Selector Tile */}
          <Pressable
            testID="challenge-select-btn"
            onPress={() => setChallengeModalVisible(true)}
            style={[styles.tileCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
          >
            <View style={styles.tileHeader}>
              <Zap size={18} color={colors.accentYellow} />
              <Text style={[styles.tileCategory, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
                AI CHALLENGE
              </Text>
            </View>
            <Text
              testID="selected-challenge-name"
              numberOfLines={1}
              style={[styles.tileValue, { color: colors.ink, fontFamily: typography.fonts.bold }]}
            >
              {currentChallengeDef?.title || 'Challenge'} ({steps[0]?.target || 1}x)
            </Text>
            <Text style={[styles.tileSub, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
              Tap to choose game
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle }]}>
        <RoundButton
          testID="cancel-edit-button"
          accessibilityLabel="Cancel editing alarm"
          variant="surface"
          size={56}
          onPress={() => router.back()}
        >
          <X size={iconSizes.md} color={colors.ink} strokeWidth={2.2} />
        </RoundButton>

        <Text style={[styles.bottomBarLabel, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
          {isEditing ? 'Save Changes' : 'Create Alarm'}
        </Text>

        <RoundButton
          testID="save-alarm-button"
          accessibilityLabel="Save Alarm"
          variant="accentYellow"
          size={56}
          onPress={handleSave}
        >
          <Check size={iconSizes.md} color="#0D0D0D" strokeWidth={2.6} />
        </RoundButton>
      </View>

      {/* SOUND PICKER MODAL */}
      <Modal
        visible={soundModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSoundModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Choose Alarm Sound
              </Text>
              <RoundButton
                size={36}
                variant="surfaceAlt"
                onPress={() => setSoundModalVisible(false)}
              >
                <X size={18} color={colors.ink} />
              </RoundButton>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Button to pick custom audio file from device storage */}
              <Pressable
                testID="pick-device-sound-btn"
                onPress={handlePickCustomSound}
                style={[
                  styles.deviceAudioBtn,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={[styles.deviceAudioIconBox, { backgroundColor: colors.surface }]}>
                  <FolderPlus size={20} color={colors.accentYellow} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.deviceAudioTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                    Choose from Device
                  </Text>
                  <Text style={[styles.deviceAudioSubtitle, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
                    Select any MP3, WAV, AAC from storage
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </Pressable>

              {/* Custom device sounds section */}
              {customSounds.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.soundSectionLabel, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
                    DEVICE STORAGE ({customSounds.length})
                  </Text>
                  {customSounds.map((s) => {
                    const isSelected = soundName === s.name || soundName === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        testID={`sound-option-${s.id}`}
                        onPress={() => {
                          handleSelectSound(s.name);
                          setSoundModalVisible(false);
                        }}
                        style={[
                          styles.soundOptionRow,
                          {
                            backgroundColor: isSelected ? 'rgba(242, 230, 58, 0.12)' : colors.surfaceAlt,
                            borderColor: isSelected ? colors.accentYellow : colors.borderSubtle,
                          },
                        ]}
                      >
                        <View style={styles.soundOptionLeft}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Music size={14} color={isSelected ? colors.accentYellow : colors.muted} style={{ marginRight: 6 }} />
                            <Text
                              style={[
                                styles.soundOptionName,
                                {
                                  color: isSelected ? colors.accentYellow : colors.ink,
                                  fontFamily: isSelected ? typography.fonts.bold : typography.fonts.medium,
                                },
                              ]}
                            >
                              {s.name}
                            </Text>
                          </View>
                          <Text style={[styles.soundOptionDesc, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
                            {s.description}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => previewSoundAudio(s.uri || s.id, 80)}
                          style={[styles.previewPlayBtn, { backgroundColor: colors.surface }]}
                        >
                          <Play size={14} color={colors.ink} />
                        </TouchableOpacity>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Built-in sounds & voices */}
              <Text style={[styles.soundSectionLabel, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
                BUILT-IN TONES & AI VOICES
              </Text>

              {ALARM_SOUNDS.map((s) => {
                const isSelected = soundName === s.name || soundName === s.id;
                return (
                  <Pressable
                    key={s.id}
                    testID={`sound-option-${s.name}`}
                    onPress={() => {
                      handleSelectSound(s.name);
                      setSoundModalVisible(false);
                    }}
                    style={[
                      styles.soundOptionRow,
                      {
                        backgroundColor: isSelected ? 'rgba(242, 230, 58, 0.12)' : colors.surfaceAlt,
                        borderColor: isSelected ? colors.accentYellow : colors.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.soundOptionLeft}>
                      <Text
                        style={[
                          styles.soundOptionName,
                          {
                            color: isSelected ? colors.accentYellow : colors.ink,
                            fontFamily: isSelected ? typography.fonts.bold : typography.fonts.medium,
                          },
                        ]}
                      >
                        {s.name}
                      </Text>
                      <Text style={[styles.soundOptionDesc, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
                        {s.description}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => previewSoundAudio(s.id, 80)}
                      style={[styles.previewPlayBtn, { backgroundColor: colors.surface }]}
                    >
                      <Play size={14} color={colors.ink} />
                    </TouchableOpacity>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CHALLENGE PICKER MODAL */}
      <Modal
        visible={challengeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChallengeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                Choose AI & Wake Challenge
              </Text>
              <RoundButton
                size={36}
                variant="surfaceAlt"
                onPress={() => setChallengeModalVisible(false)}
              >
                <X size={18} color={colors.ink} />
              </RoundButton>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {[
                {
                  id: 'face' as MethodId,
                  title: 'AI Face Wake Check',
                  desc: 'Deep learning vision verifies wide smile and eye alertness.',
                  Icon: Smile,
                },
                {
                  id: 'environment' as MethodId,
                  title: 'Environment & Light Scan',
                  desc: 'Scan morning lumens (≥ 75 Lux) to break sleep inertia.',
                  Icon: Sun,
                },
                {
                  id: 'math' as MethodId,
                  title: 'Math Problems',
                  desc: 'Solve arithmetic equations to wake up your brain.',
                  Icon: Calculator,
                },
                {
                  id: 'pushups' as MethodId,
                  title: 'Pushup Motion Reps',
                  desc: 'Physical reps verified by camera pose tracking.',
                  Icon: Dumbbell,
                },
              ].map(({ id: mId, title, desc, Icon }) => {
                const isSelected = steps[0]?.methodId === mId;
                return (
                  <Pressable
                    key={mId}
                    testID={`challenge-option-${mId}`}
                    onPress={() => handleSelectChallenge(mId)}
                    style={[
                      styles.challengeOptionCard,
                      {
                        backgroundColor: isSelected ? 'rgba(242, 230, 58, 0.12)' : colors.surfaceAlt,
                        borderColor: isSelected ? colors.accentYellow : colors.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.challengeIconCol}>
                      <View
                        style={[
                          styles.challengeIconCircle,
                          { backgroundColor: isSelected ? colors.accentYellow : colors.surface },
                        ]}
                      >
                        <Icon size={20} color={isSelected ? '#0D0D0D' : colors.ink} />
                      </View>
                    </View>
                    <View style={styles.challengeInfoCol}>
                      <Text
                        style={[
                          styles.challengeTitle,
                          {
                            color: isSelected ? colors.accentYellow : colors.ink,
                            fontFamily: isSelected ? typography.fonts.bold : typography.fonts.medium,
                          },
                        ]}
                      >
                        {title}
                      </Text>
                      <Text style={[styles.challengeDesc, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
                        {desc}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Target Adjuster */}
            <View style={[styles.targetAdjusterBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.targetLabel, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
                Target Goal ({currentChallengeDef?.unit || 'reps'}):
              </Text>
              <View style={styles.targetControlsRow}>
                <RoundButton
                  size={36}
                  variant="surface"
                  onPress={() => handleAdjustTarget(-1)}
                >
                  <Minus size={14} color={colors.ink} />
                </RoundButton>
                <Text
                  testID="challenge-target-value"
                  style={[styles.targetValueText, { color: colors.ink, fontFamily: typography.fonts.bold }]}
                >
                  {steps[0]?.target || 1}
                </Text>
                <RoundButton
                  size={36}
                  variant="surface"
                  onPress={() => handleAdjustTarget(1)}
                >
                  <Plus size={14} color={colors.ink} />
                </RoundButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.base,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  screenTitle: {
    fontSize: typography.sizes.h2,
    letterSpacing: -0.6,
  },
  formatTogglePill: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatToggleText: {
    fontSize: typography.sizes.micro + 1,
    letterSpacing: 0.8,
  },
  deleteText: {
    fontSize: typography.sizes.bodySmall,
  },
  ampmRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  ampmButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  ampmButtonText: {
    fontSize: typography.sizes.bodySmall,
  },
  digitalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  digitalPillNum: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  digitalPillColon: {
    fontSize: 20,
    marginHorizontal: 4,
  },
  digitalPillAmpmTouch: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  digitalPillAmpm: {
    fontSize: 15,
    marginLeft: 6,
  },
  quickAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  quickAdjustPill: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  quickAdjustText: {
    fontSize: typography.sizes.micro + 1,
  },
  wheelWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelAmPmCol: {
    justifyContent: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  wheelAmPmBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelAmPmText: {
    fontSize: typography.sizes.caption,
  },
  inputCard: {
    borderRadius: radii.card,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  textInput: {
    fontSize: typography.sizes.body,
    paddingVertical: spacing.xs,
  },
  repeatCard: {
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  repeatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  repeatTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: typography.sizes.body,
  },
  repeatSummaryText: {
    fontSize: typography.sizes.caption,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetPill: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: typography.sizes.micro,
  },
  daysChipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayChip: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: typography.sizes.bodySmall,
  },
  optionsTilesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tileCard: {
    flex: 1,
    borderRadius: radii.card,
    padding: spacing.base,
    borderWidth: 1,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tileCategory: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.8,
  },
  tileValue: {
    fontSize: typography.sizes.body,
    marginVertical: 2,
  },
  tileSub: {
    fontSize: typography.sizes.micro,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  bottomBarLabel: {
    fontSize: typography.sizes.bodyLarge,
    letterSpacing: -0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing.base,
    paddingBottom: 40,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.h3,
  },
  soundOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  soundOptionLeft: {
    flex: 1,
  },
  soundOptionName: {
    fontSize: typography.sizes.body,
  },
  soundOptionDesc: {
    fontSize: typography.sizes.caption,
    marginTop: 2,
  },
  previewPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  challengeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  challengeIconCol: {
    marginRight: spacing.md,
  },
  challengeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeInfoCol: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: typography.sizes.body,
  },
  challengeDesc: {
    fontSize: typography.sizes.caption,
    marginTop: 2,
  },
  targetAdjusterBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  targetLabel: {
    fontSize: typography.sizes.bodySmall,
  },
  targetControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  targetValueText: {
    fontSize: typography.sizes.bodyLarge,
    minWidth: 24,
    textAlign: 'center',
  },
  deviceAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  deviceAudioIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceAudioTitle: {
    fontSize: typography.sizes.body,
  },
  deviceAudioSubtitle: {
    fontSize: typography.sizes.caption,
    marginTop: 2,
  },
  soundSectionLabel: {
    fontSize: typography.sizes.caption,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
});

