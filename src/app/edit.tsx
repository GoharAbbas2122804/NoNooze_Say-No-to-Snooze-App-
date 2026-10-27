import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAlarmStore } from '../store/alarm-store';
import { DayOfWeek, Step } from '../domain/types';
import { parseTo12Hour, formatTo24Hour } from '../domain/time-format';
import { DaySelector } from '../components/alarm/DaySelector';
import { StepBuilder } from '../components/alarm/StepBuilder';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';
import * as Haptics from 'expo-haptics';

export default function EditAlarmScreen() {
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
  const [errorText, setErrorText] = useState<string | null>(null);

  const adjustHour = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const current = parseInt(hours, 10) || 1;
    if (timeFormat === '12h') {
      // 1 to 12
      const next = (((current - 1 + delta) % 12) + 12) % 12 + 1;
      setHours(next.toString().padStart(2, '0'));
    } else {
      // 0 to 23
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

  const handleSave = () => {
    setErrorText(null);

    // Canonical 24-hour time string
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
        setErrorText(result.errors?.join('\n') || 'Failed to update alarm');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
    } else {
      const result = addAlarm({
        time,
        days,
        label,
        steps,
        enabled: true,
        sound: 'default',
      });

      if (!result.success) {
        setErrorText(result.errors?.join('\n') || 'Failed to save alarm');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Alarm', 'Are you sure you want to delete this alarm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAlarm(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="cancel-edit-button"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Alarm' : 'New Alarm'}
        </Text>

        <TouchableOpacity
          testID="save-alarm-button"
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Error Banner */}
        {errorText && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorText}</Text>
          </View>
        )}

        {/* Time Picker Card (Supports 12-hour with AM/PM & 24-hour) */}
        <View style={styles.timeCard}>
          {/* Hours */}
          <View style={styles.timeColumn}>
            <TouchableOpacity
              testID="hour-up"
              style={styles.adjustBtn}
              onPress={() => adjustHour(1)}
              accessibilityLabel="Increase hour"
            >
              <Text style={styles.adjustBtnText}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeDigit} testID="hours-display">
              {hours}
            </Text>
            <TouchableOpacity
              testID="hour-down"
              style={styles.adjustBtn}
              onPress={() => adjustHour(-1)}
              accessibilityLabel="Decrease hour"
            >
              <Text style={styles.adjustBtnText}>▼</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.colonText}>:</Text>

          {/* Minutes */}
          <View style={styles.timeColumn}>
            <TouchableOpacity
              testID="minute-up"
              style={styles.adjustBtn}
              onPress={() => adjustMinute(5)}
              accessibilityLabel="Increase minute"
            >
              <Text style={styles.adjustBtnText}>▲</Text>
            </TouchableOpacity>
            <Text style={styles.timeDigit} testID="minutes-display">
              {minutes}
            </Text>
            <TouchableOpacity
              testID="minute-down"
              style={styles.adjustBtn}
              onPress={() => adjustMinute(-5)}
              accessibilityLabel="Decrease minute"
            >
              <Text style={styles.adjustBtnText}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* AM / PM Segmented Selector for 12-hour format */}
          {timeFormat === '12h' && (
            <View style={styles.ampmColumn}>
              <TouchableOpacity
                testID="period-am"
                style={[styles.ampmBtn, ampm === 'AM' && styles.ampmBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setAmpm('AM');
                }}
                activeOpacity={0.7}
                accessibilityLabel="Set AM"
              >
                <Text style={[styles.ampmText, ampm === 'AM' && styles.ampmTextActive]}>
                  AM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="period-pm"
                style={[styles.ampmBtn, ampm === 'PM' && styles.ampmBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setAmpm('PM');
                }}
                activeOpacity={0.7}
                accessibilityLabel="Set PM"
              >
                <Text style={[styles.ampmText, ampm === 'PM' && styles.ampmTextActive]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Day Selector */}
        <DaySelector selectedDays={days} onChange={setDays} />

        {/* Label Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Label</Text>
          <TextInput
            testID="alarm-label-input"
            style={styles.textInput}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Work, Morning Run"
            placeholderTextColor={colors.textMuted}
            maxLength={30}
          />
        </View>

        {/* Dismissal Step Builder */}
        <StepBuilder steps={steps} onChange={setSteps} />

        {/* Delete Button (when editing) */}
        {isEditing && (
          <TouchableOpacity
            testID="delete-alarm-button"
            style={styles.deleteAlarmBtn}
            onPress={handleDelete}
          >
            <Text style={styles.deleteAlarmText}>Delete Alarm</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerButton: {
    paddingVertical: spacing.xs,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...shadows.glowLime,
  },
  saveText: {
    color: colors.textInverse,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: 60,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  timeCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
    gap: spacing.md,
  },
  timeColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  adjustBtn: {
    padding: spacing.sm,
  },
  adjustBtnText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
  },
  timeDigit: {
    color: colors.textPrimary,
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    letterSpacing: -1,
    minWidth: 80,
    textAlign: 'center',
  },
  colonText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.light,
    marginTop: -spacing.md,
  },
  ampmColumn: {
    marginLeft: spacing.sm,
    gap: spacing.xs + 2,
  },
  ampmBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    minWidth: 50,
  },
  ampmBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glowLime,
  },
  ampmText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
  ampmTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.black,
  },
  fieldContainer: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  deleteAlarmBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radii.xl,
    paddingVertical: spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: spacing.md,
  },
  deleteAlarmText: {
    color: colors.error,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
});
