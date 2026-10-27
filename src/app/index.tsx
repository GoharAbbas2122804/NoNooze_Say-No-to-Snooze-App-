import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Sliders,
  Plus,
  ShieldCheck,
  Clock,
  User,
  BellOff,
  MoreVertical,
} from 'lucide-react-native';
import { useAlarmStore } from '../store/alarm-store';
import { AlarmCard } from '../components/alarm/AlarmCard';
import { colors, spacing, radii, typography, shadows, iconSizes } from '../theme/tokens';
import { getNextTriggerDate } from '../domain/next-trigger';
import * as Haptics from 'expo-haptics';

const DAYS_HEADER = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function AlarmListScreen() {
  const alarms = useAlarmStore((state) => state.alarms);
  const toggleAlarm = useAlarmStore((state) => state.toggleAlarm);

  // Live system time for hero clock
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return { time: `${displayH}:${m}`, ampm };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      setCurrentTime({ time: `${displayH}:${m}`, ampm });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    Haptics.selectionAsync().catch(() => {});
    router.push('/permissions');
  };

  const handleOpenGallery = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/gallery');
  };

  // Compute active days among enabled alarms for hero display
  const activeDaysSet = React.useMemo(() => {
    const set = new Set<number>();
    alarms.filter((a) => a.enabled).forEach((a) => a.days?.forEach((d) => set.add(d)));
    return set;
  }, [alarms]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top App Bar (Inspiration Match: sliders left, orange + right) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            testID="permissions-header-button"
            style={styles.iconCircleButton}
            onPress={handleOpenPermissions}
            activeOpacity={0.7}
            accessibilityLabel="Reliability Settings"
          >
            <Sliders size={iconSizes.md} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="add-alarm-header-button"
            style={styles.addOrangeCircle}
            onPress={handleAddAlarm}
            activeOpacity={0.8}
            accessibilityLabel="Add Alarm"
          >
            <Plus size={iconSizes.md} color={colors.textInverse} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Hero Clock Readout (Inspiration 1 Match) */}
        <View style={styles.heroClockContainer}>
          <Text style={styles.locationSubtitle}>
            {nextAlarm
              ? `Next: ${nextAlarm.alarm.time} · ${nextAlarm.alarm.label || 'Alarm'}`
              : 'Local Time · Smart Wake-Up'}
          </Text>

          <View style={styles.clockRow}>
            <Text style={styles.clockDigits}>{currentTime.time}</Text>
            <Text style={styles.ampmText}>{currentTime.ampm}</Text>
          </View>

          <Text style={styles.repeatLabel}>Repeat</Text>

          <View style={styles.daysRow}>
            {DAYS_HEADER.map((label, index) => {
              // Map index to Sunday=0, Monday=1, ... Saturday=6
              const dayValue = index === 6 ? 0 : index + 1;
              const isActive = activeDaysSet.has(dayValue);
              return (
                <View
                  key={index}
                  style={[styles.dayBox, isActive && styles.dayBoxActive]}
                >
                  <Text
                    style={[
                      styles.dayBoxText,
                      isActive && styles.dayBoxTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Alarms Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Alarm.</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity
              onPress={handleAddAlarm}
              style={styles.miniActionBtn}
              accessibilityLabel="Create Alarm"
            >
              <Plus size={iconSizes.sm} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenGallery}
              style={styles.miniActionBtn}
              accessibilityLabel="Component Gallery"
            >
              <MoreVertical size={iconSizes.sm} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alarms List or Empty State */}
        {alarms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <BellOff size={36} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No Alarms Set</Text>
            <Text style={styles.emptySubtitle}>
              Create your first unskippable wake-up routine with interactive mental & physical challenges.
            </Text>
            <TouchableOpacity
              testID="empty-add-button"
              style={styles.emptyButton}
              onPress={handleAddAlarm}
              activeOpacity={0.8}
            >
              <Plus size={iconSizes.sm} color={colors.textInverse} strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>Create Alarm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={alarms}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <AlarmCard
                alarm={item}
                onPress={() => handleEditAlarm(item.id)}
                onToggle={() => toggleAlarm(item.id)}
              />
            )}
          />
        )}

        {/* Floating Action Button (Alternative) */}
        {alarms.length > 0 && (
          <TouchableOpacity
            testID="fab-add-alarm"
            style={styles.fab}
            onPress={handleAddAlarm}
            activeOpacity={0.8}
            accessibilityLabel="Add Alarm"
          >
            <Plus size={iconSizes.lg} color={colors.textInverse} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Floating Bottom Navigation Tab Dock (Inspiration 1 & 2 Match) */}
        <View style={styles.bottomDockWrapper} pointerEvents="box-none">
          <View style={styles.dock}>
            <TouchableOpacity
              style={styles.dockButton}
              onPress={handleOpenGallery}
              accessibilityLabel="Component Gallery & Profile"
            >
              <User size={iconSizes.md} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dockCenterPill}
              onPress={() => {}}
              accessibilityLabel="Alarms Home Tab"
            >
              <Clock size={iconSizes.md} color={colors.textInverse} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dockButton}
              onPress={handleOpenPermissions}
              accessibilityLabel="System Permissions & Settings"
            >
              <ShieldCheck size={iconSizes.md} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  iconCircleButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  addOrangeCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowAccent,
  },
  heroClockContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  locationSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.5,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  clockDigits: {
    color: colors.textPrimary,
    fontSize: typography.sizes.hero + 8,
    fontWeight: typography.weights.black,
    letterSpacing: -1.5,
    lineHeight: 72,
  },
  ampmText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    marginTop: 10,
    marginLeft: 4,
  },
  repeatLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  dayBox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dayBoxActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  dayBoxText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  dayBoxTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.bold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  miniActionBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  listContent: {
    gap: spacing.base,
    paddingBottom: 110,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: 100,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.xs,
    ...shadows.glowAccent,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    ...shadows.glowAccent,
  },
  emptyButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowAccent,
  },
  bottomDockWrapper: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 26, 45, 0.92)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
  },
  dockButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockCenterPill: {
    width: 56,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowLime,
  },
});
