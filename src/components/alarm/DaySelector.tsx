import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DayOfWeek } from '../../domain/types';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import * as Haptics from 'expo-haptics';

interface DaySelectorProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
}

const DAYS: { day: DayOfWeek; label: string }[] = [
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
  { day: 0, label: 'S' },
];

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDays,
  onChange,
}) => {
  const toggleDay = (day: DayOfWeek) => {
    Haptics.selectionAsync().catch(() => {});
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day].sort());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Repeat: {selectedDays.length === 0 ? 'Once' : selectedDays.length === 7 ? 'Every day' : `${selectedDays.length} days/week`}
      </Text>
      <View style={styles.row}>
        {DAYS.map(({ day, label }, index) => {
          const isSelected = selectedDays.includes(day);
          return (
            <TouchableOpacity
              key={`${day}-${index}`}
              testID={`day-selector-${day}`}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => toggleDay(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  pill: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  pillTextSelected: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
});
