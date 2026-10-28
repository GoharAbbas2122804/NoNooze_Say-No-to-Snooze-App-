import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Check, Bell, Zap, Repeat, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useAlarmStore } from '../store/alarm-store';
import { DayOfWeek, Step } from '../domain/types';
import { parseTo12Hour, formatTo24Hour } from '../domain/time-format';
import { useTheme } from '../theme/ThemeProvider';
import { WheelPickerColumn } from '../components/alarm/WheelPicker';
import { RoundButton } from '../components/ui/RoundButton';
import { notify } from '../ui/notify';
import { typography, spacing, radii, iconSizes } from '../theme/tokens';
import * as Haptics from 'expo-haptics';

export default function EditAlarmScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const existingAlarm = useAlarmStore((state) =>
    id ? state.getAlarmById(id) : undefined
  );

  const timeFormat = useAlarmStore((state) => state.timeFormat);
  const addAlarm = useAlarmStore((state) => state.addAlarm);
  const updateAlarm = useAlarmStore((state) => state.updateAlarm);
  const deleteAlarm = useAlarmStore((state) => state.deleteAlarm);

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

  const [days, setDays] = useState<DayOfWeek[]>(existingAlarm?.days || []);
  const [label, setLabel] = useState(existingAlarm?.label || '');
  const [steps, setSteps] = useState<Step[]>(
    existingAlarm?.steps || [{ methodId: 'math', target: 3 }]
  );
  const [soundName] = useState(existingAlarm?.sound || 'Wake up');

  // Descending Hours list (e.g. 12, 11, 10... 01 for 12h; 23, 22... 00 for 24h)
  const hoursList = React.useMemo(() => {
    if (timeFormat === '12h') {
      return [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) =>
        n.toString().padStart(2, '0')
      );
    }
    return Array.from({ length: 24 }, (_, i) => (23 - i).toString().padStart(2, '0'));
  }, [timeFormat]);

  // Descending Minutes list (e.g. 59, 58, 57... 00)
  const minutesList = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => (59 - i).toString().padStart(2, '0'));
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

  const adjustHour = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const current = parseInt(hours, 10) || 1;
    if (timeFormat === '12h') {
      const next = (((current - 1 + delta) % 12) + 12) % 12 + 1;
      setHours(next.toString().padStart(2, '0'));
    } else {
      const next = (current + delta + 24) % 24;
      setHours(next.toString().padStart(2, '0'));
    }
  };

  const adjustMinute = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const current = parseInt(minutes, 10) || 0;
    const next = (current + delta + 60) % 60;
    setMinutes(next.toString().padStart(2, '0'));
  };

  const getDaysSummary = (): string => {
    if (!days || days.length === 0) return 'No (Once)';
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d as any))) {
      return 'Weekdays';
    }
    if (days.length === 2 && [0, 6].every((d) => days.includes(d as any))) {
      return 'Weekends';
    }
    return `${days.length} days`;
  };

  const toggleDayCycle = () => {
    Haptics.selectionAsync().catch(() => {});
    if (days.length === 0) {
      setDays([1, 2, 3, 4, 5]); // Weekdays
    } else if (days.length === 5) {
      setDays([0, 1, 2, 3, 4, 5, 6]); // Everyday
    } else {
      setDays([]); // Once
    }
  };

  const cycleChallengeTarget = () => {
    Haptics.selectionAsync().catch(() => {});
    const currentTarget = steps[0]?.target || 3;
    const nextTarget = currentTarget >= 5 ? 1 : currentTarget + 1;
    setSteps([{ methodId: 'math', target: nextTarget }]);
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surfaceAlt }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
            {isEditing ? 'Edit Alarm' : 'Choose time'}
          </Text>
          {isEditing ? (
            <Pressable testID="delete-alarm-button" onPress={handleDelete}>
              <Text style={[styles.deleteText, { color: colors.error, fontFamily: typography.fonts.medium }]}>
                Delete
              </Text>
            </Pressable>
          ) : null}
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
                  backgroundColor: ampm === 'AM' ? colors.ink : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.ampmButtonText,
                  {
                    color: ampm === 'AM' ? colors.background : colors.muted,
                    fontFamily: typography.fonts.bold,
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
                  backgroundColor: ampm === 'PM' ? colors.ink : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.ampmButtonText,
                  {
                    color: ampm === 'PM' ? colors.background : colors.muted,
                    fontFamily: typography.fonts.bold,
                  },
                ]}
              >
                PM
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Dual Curved Lens Wheel Pickers */}
        <View style={styles.wheelWrapper}>
          <WheelPickerColumn
            items={hoursList}
            selectedIndex={selectedHourIndex}
            onSelectIndex={handleHourSelect}
            isLeftColumn={true}
          />
          <WheelPickerColumn
            items={minutesList}
            selectedIndex={selectedMinuteIndex}
            onSelectIndex={handleMinuteSelect}
            isLeftColumn={false}
          />
        </View>

        {/* Accessible Quick Stepper Controls */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperGroup}>
            <RoundButton
              testID="hour-up"
              accessibilityLabel="Increase hour"
              variant="surface"
              size={44}
              onPress={() => adjustHour(1)}
            >
              <ChevronUp size={20} color={colors.ink} />
            </RoundButton>
            <Text
              testID="hours-display"
              style={[styles.stepperDisplayText, { color: colors.ink, fontFamily: typography.fonts.bold }]}
            >
              {hours}
            </Text>
            <RoundButton
              testID="hour-down"
              accessibilityLabel="Decrease hour"
              variant="surface"
              size={44}
              onPress={() => adjustHour(-1)}
            >
              <ChevronDown size={20} color={colors.ink} />
            </RoundButton>
          </View>

          <View style={styles.stepperGroup}>
            <RoundButton
              testID="minute-up"
              accessibilityLabel="Increase minute"
              variant="surface"
              size={44}
              onPress={() => adjustMinute(5)}
            >
              <ChevronUp size={20} color={colors.ink} />
            </RoundButton>
            <Text
              testID="minutes-display"
              style={[styles.stepperDisplayText, { color: colors.ink, fontFamily: typography.fonts.bold }]}
            >
              {minutes}
            </Text>
            <RoundButton
              testID="minute-down"
              accessibilityLabel="Decrease minute"
              variant="surface"
              size={44}
              onPress={() => adjustMinute(-5)}
            >
              <ChevronDown size={20} color={colors.ink} />
            </RoundButton>
          </View>
        </View>

        {/* Alarm Label Input */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
          <TextInput
            testID="alarm-label-input"
            value={label}
            onChangeText={setLabel}
            placeholder="Alarm name (optional)"
            placeholderTextColor={colors.muted}
            style={[styles.textInput, { color: colors.ink, fontFamily: typography.fonts.medium }]}
          />
        </View>

        {/* Three Option Row: Sound / Challenge / Repeat (Strictly NO snooze) */}
        <View style={styles.optionRow}>
          {/* Sound */}
          <View style={[styles.optionCard, { backgroundColor: colors.surface }]}>
            <Bell size={iconSizes.sm} color={colors.ink} strokeWidth={2} />
            <Text style={[styles.optionLabel, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              Sound
            </Text>
            <Text style={[styles.optionValue, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              {soundName}
            </Text>
          </View>

          {/* Challenge (replaces Snooze) */}
          <Pressable
            onPress={cycleChallengeTarget}
            style={[styles.optionCard, { backgroundColor: colors.surface }]}
          >
            <Zap size={iconSizes.sm} color={colors.accentYellow} strokeWidth={2} />
            <Text style={[styles.optionLabel, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              Challenge
            </Text>
            <Text style={[styles.optionValue, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              Math ({steps[0]?.target || 3}x)
            </Text>
          </Pressable>

          {/* Repeat */}
          <Pressable
            onPress={toggleDayCycle}
            style={[styles.optionCard, { backgroundColor: colors.surface }]}
          >
            <Repeat size={iconSizes.sm} color={colors.ink} strokeWidth={2} />
            <Text style={[styles.optionLabel, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              Repeat
            </Text>
            <Text style={[styles.optionValue, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              {getDaysSummary()}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom Bar: Round X (Left), "Choose time" (Center), Round Check (Right) */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surfaceAlt }]}>
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
          Choose time
        </Text>

        <RoundButton
          testID="save-alarm-button"
          accessibilityLabel="Save Alarm"
          variant="ink"
          size={56}
          onPress={handleSave}
        >
          <Check size={iconSizes.md} color={colors.background} strokeWidth={2.6} />
        </RoundButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.base,
    paddingBottom: 100,
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
  deleteText: {
    fontSize: typography.sizes.bodySmall,
  },
  ampmRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  ampmButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  ampmButtonText: {
    fontSize: typography.sizes.bodySmall,
  },
  wheelWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.sm,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperDisplayText: {
    fontSize: typography.sizes.h3,
    minWidth: 32,
    textAlign: 'center',
  },
  inputCard: {
    borderRadius: radii.card,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginVertical: spacing.sm,
  },
  textInput: {
    fontSize: typography.sizes.body,
    paddingVertical: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  optionCard: {
    flex: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
  },
  optionValue: {
    fontSize: typography.sizes.micro,
    marginTop: 2,
    textAlign: 'center',
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
  },
  bottomBarLabel: {
    fontSize: typography.sizes.bodyLarge,
    letterSpacing: -0.3,
  },
});
