import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { TwoToneTitle } from '../components/ui/TwoToneTitle';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { RoundButton } from '../components/ui/RoundButton';
import { DotMatrixDisplay } from '../components/alarm/DotMatrixDisplay';
import { AlarmTimeline } from '../components/alarm/AlarmTimeline';
import { WeekdayStrip } from '../components/alarm/WeekdayStrip';
import { AlarmCard } from '../components/alarm/AlarmCard';
import { StepDots } from '../components/alarm/StepDots';
import { PillBar } from '../components/alarm/PillBar';
import { notify } from '../ui/notify';
import { typography, spacing, radii, iconSizes } from '../theme/tokens';
import { Alarm, DayOfWeek } from '../domain/types';

export default function ComponentGalleryScreen() {
  const { colors, isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(4);
  const [dotsProgress, setDotsProgress] = useState(2);

  const sampleAlarmEnabled: Alarm = {
    id: 'gallery-1',
    time: '09:50',
    days: [1, 2, 3, 4, 5],
    enabled: true,
    label: 'Morning Focus Routine',
    steps: [{ methodId: 'math', target: 3 }, { methodId: 'math', target: 2 }],
    sound: 'default',
  };

  const sampleAlarmDisabled: Alarm = {
    id: 'gallery-2',
    time: '08:00',
    days: [0, 6],
    enabled: false,
    label: 'Weekend Rest',
    steps: [{ methodId: 'math', target: 1 }],
    sound: 'default',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <RoundButton
          variant="surface"
          size={44}
          onPress={() => router.back()}
          accessibilityLabel="Back to Home"
        >
          <ArrowLeft size={iconSizes.sm} color={colors.ink} />
        </RoundButton>
        <TwoToneTitle primary="Design System" secondary="Gallery" />
        <ThemeToggle />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Color Tokens */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            1. PALETTE TOKENS ({isDark ? 'DARK' : 'LIGHT'})
          </Text>
          <View style={styles.swatchGrid}>
            {[
              { name: 'background', color: colors.background, text: colors.ink },
              { name: 'surface', color: colors.surface, text: colors.ink },
              { name: 'surfaceAlt', color: colors.surfaceAlt, text: colors.ink },
              { name: 'ink', color: colors.ink, text: colors.background },
              { name: 'muted', color: colors.muted, text: colors.background },
              { name: 'accentYellow', color: colors.accentYellow, text: '#0D0D0D' },
              { name: 'markerRed', color: colors.markerRed, text: '#FFF' },
              { name: 'disabled', color: colors.disabled, text: colors.ink },
            ].map((s) => (
              <View
                key={s.name}
                style={[
                  styles.swatchItem,
                  { backgroundColor: s.color, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.swatchLabel, { color: s.text, fontFamily: typography.fonts.bold }]}>
                  {s.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 2: Round Buttons in All States */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            2. ROUND BUTTONS (DEFAULT, DISABLED, LOADING)
          </Text>
          <View style={styles.buttonRow}>
            {/* Default Ink */}
            <RoundButton variant="ink" size={56} onPress={() => {}}>
              <Plus size={24} color={colors.background} />
            </RoundButton>
            {/* Surface */}
            <RoundButton variant="surface" size={56} onPress={() => {}}>
              <Check size={24} color={colors.ink} />
            </RoundButton>
            {/* Accent Yellow */}
            <RoundButton variant="accentYellow" size={56} onPress={() => {}}>
              <Check size={24} color="#0D0D0D" strokeWidth={3} />
            </RoundButton>
            {/* Disabled */}
            <RoundButton variant="surface" size={56} disabled onPress={() => {}}>
              <Plus size={24} color={colors.muted} />
            </RoundButton>
            {/* Loading */}
            <RoundButton variant="surface" size={56} onPress={() => {}}>
              <ActivityIndicator color={colors.ink} size="small" />
            </RoundButton>
          </View>
        </View>

        {/* Section 3: Dot Matrix Clock (Inspiration 01) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            3. DOT-MATRIX CLOCK (06 / 42 / 56)
          </Text>
          <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
            <DotMatrixDisplay hours="06" minutes="42" seconds="56" />
          </View>
        </View>

        {/* Section 4: 24h Timeline Strip (Inspiration 04) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            4. 24-HOUR TIMELINE STRIP
          </Text>
          <AlarmTimeline alarms={[sampleAlarmEnabled, sampleAlarmDisabled]} />
        </View>

        {/* Section 5: Weekday Strip with Sliding Disc */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            5. WEEKDAY STRIP (SLIDING YELLOW CIRCLE)
          </Text>
          <WeekdayStrip
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            activeAlarmDays={[1, 2, 3, 4, 5]}
          />
        </View>

        {/* Section 6: Alarm Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            6. ALARM CARDS (ENABLED & DISABLED)
          </Text>
          <AlarmCard
            alarm={sampleAlarmEnabled}
            onPress={() => {}}
            onToggle={() => {}}
          />
          <AlarmCard
            alarm={sampleAlarmDisabled}
            onPress={() => {}}
            onToggle={() => {}}
          />
        </View>

        {/* Section 7: Step Dots Progress */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            7. STEP DOTS PROGRESS
          </Text>
          <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
            <StepDots total={4} current={dotsProgress} />
            <View style={styles.dotsControlRow}>
              <RoundButton
                size={36}
                variant="surfaceAlt"
                onPress={() => setDotsProgress((p) => Math.max(0, p - 1))}
              >
                <Text style={{ color: colors.ink, fontWeight: 'bold' }}>-</Text>
              </RoundButton>
              <RoundButton
                size={36}
                variant="surfaceAlt"
                onPress={() => setDotsProgress((p) => Math.min(4, p + 1))}
              >
                <Text style={{ color: colors.ink, fontWeight: 'bold' }}>+</Text>
              </RoundButton>
            </View>
          </View>
        </View>

        {/* Section 8: Toast Trigger Testing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            8. TOAST NOTIFICATIONS (NOTIFY FACADE)
          </Text>
          <View style={styles.toastGrid}>
            <RoundButton
              variant="accentYellow"
              size={52}
              onPress={() => notify.success('Alarm set for 06:30')}
            >
              <Text style={styles.toastBtnText}>OK</Text>
            </RoundButton>
            <RoundButton
              variant="surface"
              size={52}
              onPress={() => notify.error('Wrong answer')}
            >
              <Text style={[styles.toastBtnText, { color: colors.error }]}>ERR</Text>
            </RoundButton>
            <RoundButton
              variant="surface"
              size={52}
              onPress={() => notify.warning('Exact alarm permission missing')}
            >
              <Text style={[styles.toastBtnText, { color: colors.warning }]}>WARN</Text>
            </RoundButton>
            <RoundButton
              variant="ink"
              size={52}
              onPress={() =>
                notify.action('Alarm deleted', {
                  label: 'Undo',
                  onPress: () => notify.info('Restored!'),
                })
              }
            >
              <Text style={[styles.toastBtnText, { color: colors.background }]}>UNDO</Text>
            </RoundButton>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom PillBar Preview */}
      <PillBar
        onAddPress={() => notify.info('Add tapped')}
        onSettingsPress={() => notify.info('Settings tapped')}
        timeRangeText="9:41 ... 10:00"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 130,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.micro,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchItem: {
    width: '23%',
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  swatchLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  previewCard: {
    borderRadius: radii.card,
    padding: spacing.base,
    alignItems: 'center',
  },
  dotsControlRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  toastGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toastBtnText: {
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
  },
});
