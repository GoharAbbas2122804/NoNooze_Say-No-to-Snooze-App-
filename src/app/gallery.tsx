import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Check,
  Clock,
  Sparkles,
  Sliders,
  Trash2,
  AlertCircle,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows, iconSizes } from '../theme/tokens';
import { DaySelector } from '../components/alarm/DaySelector';
import { NumericKeypad } from '../components/challenges/NumericKeypad';
import { AlarmCard } from '../components/alarm/AlarmCard';
import { Alarm, DayOfWeek } from '../domain/types';

export default function ComponentGalleryScreen() {
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]);
  const [switchState, setSwitchState] = useState(true);

  const sampleAlarmEnabled: Alarm = {
    id: 'sample-1',
    time: '06:30',
    days: [1, 2, 3, 4, 5],
    enabled: true,
    label: 'Morning Workout & Run',
    steps: [{ methodId: 'math', target: 3 }],
    sound: 'default',
  };

  const sampleAlarmDisabled: Alarm = {
    id: 'sample-2',
    time: '08:00',
    days: [0, 6],
    enabled: false,
    label: 'Weekend Sleep In',
    steps: [{ methodId: 'math', target: 2 }],
    sound: 'default',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={iconSizes.md} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Component Gallery</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Color Palette */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>1. Palette Swatches</Text>
          <View style={styles.swatchGrid}>
            {[
              { name: 'background', color: colors.background, text: '#FFF' },
              { name: 'surface', color: colors.surface, text: '#FFF' },
              { name: 'surfaceElevated', color: colors.surfaceElevated, text: '#FFF' },
              { name: 'primary (Lime)', color: colors.primary, text: '#0B101E' },
              { name: 'accent (Amber)', color: colors.accent, text: '#0B101E' },
              { name: 'indigoGlow', color: colors.indigoGlow, text: '#FFF' },
              { name: 'success', color: colors.success, text: '#FFF' },
              { name: 'error', color: colors.error, text: '#FFF' },
            ].map((s) => (
              <View key={s.name} style={[styles.swatchItem, { backgroundColor: s.color }]}>
                <Text style={[styles.swatchText, { color: s.text }]}>{s.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 2: Buttons & States */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>2. Buttons in All States</Text>

          {/* Primary Lime Buttons */}
          <Text style={styles.stateLabel}>Primary Lime (Default, Pressed, Disabled, Loading)</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Default</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryBtn, styles.btnPressed]} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Pressed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryBtn, styles.btnDisabled]} disabled>
              <Text style={styles.primaryBtnTextDisabled}>Disabled</Text>
            </TouchableOpacity>

            <View style={[styles.primaryBtn, styles.btnLoading]}>
              <ActivityIndicator color={colors.textInverse} size="small" />
            </View>
          </View>

          {/* Accent Amber Buttons */}
          <Text style={styles.stateLabel}>Accent Amber (Default, Pressed, Disabled, Loading)</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.accentBtn} activeOpacity={0.8}>
              <Text style={styles.accentBtnText}>Default</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.accentBtn, styles.btnPressed]} activeOpacity={0.8}>
              <Text style={styles.accentBtnText}>Pressed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.accentBtn, styles.btnDisabled]} disabled>
              <Text style={styles.accentBtnTextDisabled}>Disabled</Text>
            </TouchableOpacity>

            <View style={[styles.accentBtn, styles.btnLoading]}>
              <ActivityIndicator color={colors.textInverse} size="small" />
            </View>
          </View>

          {/* Destructive / Outline */}
          <Text style={styles.stateLabel}>Destructive / Outline</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.destructiveBtn}>
              <Trash2 size={16} color={colors.error} />
              <Text style={styles.destructiveBtnText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Outline Action</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Badges, Pills & Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>3. Badges & Chips</Text>
          <View style={styles.chipRow}>
            <View style={styles.badgeLime}>
              <Check size={12} color={colors.primary} />
              <Text style={styles.badgeLimeText}>Active / Granted</Text>
            </View>

            <View style={styles.badgeAmber}>
              <Sparkles size={12} color={colors.accent} />
              <Text style={styles.badgeAmberText}>Recommended</Text>
            </View>

            <View style={styles.badgeError}>
              <AlertCircle size={12} color={colors.error} />
              <Text style={styles.badgeErrorText}>Required</Text>
            </View>

            <View style={styles.badgeMuted}>
              <Text style={styles.badgeMutedText}>Coming Soon</Text>
            </View>
          </View>
        </View>

        {/* Section 4: Form Controls & Switch */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>4. Controls & Switch</Text>
          <View style={styles.controlRow}>
            <Text style={styles.controlText}>Alarm Active State:</Text>
            <Switch
              value={switchState}
              onValueChange={setSwitchState}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={colors.switchThumb}
            />
          </View>
        </View>

        {/* Section 5: Day Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>5. Day Selector Component</Text>
          <DaySelector selectedDays={selectedDays} onChange={setSelectedDays} />
        </View>

        {/* Section 6: Alarm Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>6. Alarm Cards (Enabled vs Disabled)</Text>
          <AlarmCard
            alarm={sampleAlarmEnabled}
            onPress={() => {}}
            onToggle={() => {}}
          />
          <View style={{ height: spacing.base }} />
          <AlarmCard
            alarm={sampleAlarmDisabled}
            onPress={() => {}}
            onToggle={() => {}}
          />
        </View>

        {/* Section 7: Keypad */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>7. Numeric Keypad</Text>
          <NumericKeypad
            onDigit={() => {}}
            onBackspace={() => {}}
            onSubmit={() => {}}
            submitDisabled={false}
          />
        </View>

        {/* Section 8: Floating Tab Dock Mockup */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>8. Floating Tab Dock (Inspiration Style)</Text>
          <View style={styles.tabDockContainer}>
            <View style={styles.tabDock}>
              <TouchableOpacity style={styles.dockIconBtn}>
                <Sliders size={iconSizes.md} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.dockCenterPill}>
                <Clock size={iconSizes.md} color={colors.textInverse} />
              </View>

              <TouchableOpacity style={styles.dockIconBtn}>
                <Bell size={iconSizes.md} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodyLarge,
    fontWeight: typography.weights.bold,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: 60,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchItem: {
    width: '48%',
    height: 44,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  swatchText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  stateLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    minWidth: 70,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowLime,
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
  accentBtn: {
    flex: 1,
    minWidth: 70,
    height: 44,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowAccent,
  },
  accentBtnText: {
    color: colors.textInverse,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  btnDisabled: {
    backgroundColor: colors.disabled,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnTextDisabled: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  accentBtnTextDisabled: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  btnLoading: {
    backgroundColor: colors.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  destructiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  destructiveBtnText: {
    color: colors.error,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.semibold,
  },
  outlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeLime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(112, 244, 100, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeLimeText: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  badgeAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  badgeAmberText: {
    color: colors.accent,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  badgeError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.error,
  },
  badgeErrorText: {
    color: colors.error,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
  badgeMuted: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeMutedText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
  },
  tabDockContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  tabDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dockIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockCenterPill: {
    width: 52,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowLime,
  },
});
