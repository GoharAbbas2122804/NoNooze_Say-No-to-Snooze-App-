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
      style={[
        styles.card,
        alarm.enabled ? styles.cardActive : styles.cardDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Alarm for ${alarm.time}, ${alarm.label || 'Alarm'}`}
    >
      <View style={styles.topRow}>
        <View style={styles.timeContainer}>
          <Text
            style={[
              styles.timeText,
              !alarm.enabled && styles.timeTextDisabled,
            ]}
          >
            {alarm.time}
          </Text>
          <Text
            style={[
              styles.repeatText,
              !alarm.enabled && styles.repeatTextDisabled,
            ]}
          >
            {getDaysSummary()}
          </Text>
        </View>

        <Switch
          testID={`alarm-toggle-${alarm.id}`}
          value={alarm.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
          thumbColor={colors.switchThumb}
          accessibilityLabel={`Toggle alarm for ${alarm.time}`}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text
          style={[
            styles.labelText,
            !alarm.enabled && styles.labelTextDisabled,
          ]}
          numberOfLines={1}
        >
          {alarm.label || 'Wake Up Challenge'}
        </Text>

        <View style={styles.stepsPillContainer}>
          {alarm.steps.map((step, idx) => {
            const def = DISMISSAL_METHODS[step.methodId];
            return (
              <View
                key={idx}
                style={[
                  styles.stepBadge,
                  alarm.enabled && styles.stepBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepBadgeText,
                    alarm.enabled && styles.stepBadgeTextActive,
                  ]}
                >
                  {def?.title || step.methodId} · {step.target}
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
    borderColor: colors.borderSubtle,
    ...shadows.card,
    gap: spacing.md,
  },
  cardActive: {
    borderColor: 'rgba(112, 244, 100, 0.2)',
  },
  cardDisabled: {
    opacity: 0.6,
    borderColor: colors.borderSubtle,
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
  repeatTextDisabled: {
    color: colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  labelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  labelTextDisabled: {
    color: colors.textMuted,
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
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  stepBadgeActive: {
    borderColor: 'rgba(112, 244, 100, 0.35)',
    backgroundColor: 'rgba(112, 244, 100, 0.08)',
  },
  stepBadgeText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  stepBadgeTextActive: {
    color: colors.primary,
  },
});
