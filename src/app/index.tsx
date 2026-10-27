import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAlarmStore } from '../store/alarm-store';
import { AlarmCard } from '../components/alarm/AlarmCard';
import { APP_NAME } from '../constants/app';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';
import { getNextTriggerDate } from '../domain/next-trigger';
import * as Haptics from 'expo-haptics';

export default function AlarmListScreen() {
  const alarms = useAlarmStore((state) => state.alarms);
  const toggleAlarm = useAlarmStore((state) => state.toggleAlarm);

  // Find next upcoming alarm among enabled ones
  const nextAlarm = React.useMemo(() => {
    const enabled = alarms.filter((a) => a.enabled);
    if (enabled.length === 0) return null;

    const withNextDates = enabled.map((alarm) => ({
      alarm,
      nextDate: getNextTriggerDate(alarm),
    }));

    withNextDates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
    return withNextDates[0];
  }, [alarms]);

  const handleAddAlarm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/edit');
  };

  const handleEditAlarm = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: '/edit', params: { id } });
  };

  const handleOpenPermissions = () => {
    router.push('/permissions');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.headerSubtitle}>Unskippable Alarms</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              testID="permissions-header-button"
              style={styles.iconButton}
              onPress={handleOpenPermissions}
              activeOpacity={0.7}
            >
              <Text style={styles.iconButtonText}>🛡️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="add-alarm-header-button"
              style={styles.addButtonHeader}
              onPress={handleAddAlarm}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonHeaderText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Alarm Banner */}
        {nextAlarm && (
          <View style={styles.nextAlarmBanner}>
            <View style={styles.nextAlarmIcon}>
              <Text style={styles.clockEmoji}>⏰</Text>
            </View>
            <View style={styles.nextAlarmInfo}>
              <Text style={styles.nextAlarmLabel}>Next Alarm</Text>
              <Text style={styles.nextAlarmTime}>
                {nextAlarm.alarm.time} ·{' '}
                {nextAlarm.alarm.label || 'Alarm'}
              </Text>
            </View>
          </View>
        )}

        {/* Alarms List or Empty State */}
        {alarms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No Alarms Set</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to create your first unskippable wake-up challenge.
            </Text>
            <TouchableOpacity
              testID="empty-add-button"
              style={styles.emptyButton}
              onPress={handleAddAlarm}
            >
              <Text style={styles.emptyButtonText}>+ Create Alarm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={alarms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <AlarmCard
                alarm={item}
                onPress={() => handleEditAlarm(item.id)}
                onToggle={() => toggleAlarm(item.id)}
              />
            )}
          />
        )}

        {/* Floating Action Button */}
        {alarms.length > 0 && (
          <TouchableOpacity
            testID="fab-add-alarm"
            style={styles.fab}
            onPress={handleAddAlarm}
            activeOpacity={0.8}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.black,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonText: {
    fontSize: 20,
  },
  addButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: radii.xl,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowAccent,
  },
  addButtonHeaderText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    lineHeight: 28,
  },
  nextAlarmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  nextAlarmIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockEmoji: {
    fontSize: 20,
  },
  nextAlarmInfo: {
    flex: 1,
  },
  nextAlarmLabel: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextAlarmTime: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    gap: spacing.base,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.base,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radii.pill,
    marginTop: spacing.md,
    ...shadows.glowAccent,
  },
  emptyButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowAccent,
  },
  fabText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    lineHeight: 36,
  },
});
