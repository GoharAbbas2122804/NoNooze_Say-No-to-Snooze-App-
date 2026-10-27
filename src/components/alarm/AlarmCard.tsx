import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Alarm } from '../../domain/types';
import { DISMISSAL_METHODS } from '../../domain/dismissal-registry';
import { colors, spacing, radii, typography, shadows } from '../../theme/tokens';
import * as Haptics from 'expo-haptics';

interface AlarmCardProps {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onPress,
  onToggle,
}) => {
  const getDaysSummary = (): string => {
    if (!alarm.days || alarm.days.length === 0) return 'Once';
    if (alarm.days.length === 7) return 'Every day';
    if (
      alarm.days.length === 5 &&
      [1, 2, 3, 4, 5].every((d) => alarm.days.includes(d as any))
    ) {
      return 'Weekdays';
    }
    if (
      alarm.days.length === 2 &&
      [0, 6].every((d) => alarm.days.includes(d as any))
    ) {
      return 'Weekends';
    }
    return alarm.days.map((d) => DAY_NAMES[d]).join(', ');
  };

  const handleToggle = () => {
    Haptics.selectionAsync().catch(() => {});
    onToggle();
  };

  return (
    <TouchableOpacity
      testID={`alarm-card-${alarm.id}`}
      style={[styles.card, !alarm.enabled && styles.cardDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, !alarm.enabled && styles.timeTextDisabled]}>
            {alarm.time}
          </Text>
          <Text style={styles.repeatText}>{getDaysSummary()}</Text>
        </View>

        <Switch
          testID={`alarm-toggle-${alarm.id}`}
          value={alarm.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
          thumbColor={colors.switchThumb}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.labelText} numberOfLines={1}>
          {alarm.label || 'Alarm'}
        </Text>

        <View style={styles.stepsPillContainer}>
          {alarm.steps.map((step, idx) => {
            const def = DISMISSAL_METHODS[step.methodId];
            return (
              <View key={idx} style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  {def?.title || step.methodId} ({step.target})
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: spacing.md,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    gap: spacing.xs,
  },
  timeText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.time,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  timeTextDisabled: {
    color: colors.textMuted,
  },
  repeatText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  labelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  stepsPillContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  stepBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBadgeText: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
});
