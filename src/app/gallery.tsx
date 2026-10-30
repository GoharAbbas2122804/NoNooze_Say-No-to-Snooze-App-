import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Check, Play, Camera, Eye, RefreshCw } from 'lucide-react-native';
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
import { FakeWakeCheckEngine, FakeScenario } from '../wake/fake/FakeWakeCheckEngine';
import { LiveWakeCheck } from '../wake/screens/LiveWakeCheck';
import { DotRing } from '../wake/components/DotRing';
import { CheckPills } from '../wake/components/CheckPills';
import { AlertnessTick } from '../wake/components/AlertnessTick';
import { DotMatrixCountdown } from '../components/alarm/DotMatrixCountdown';
import { BlinkingEyesMiniIllustration } from '../components/alarm/BlinkingEyesMiniIllustration';
import { CameraRationale } from '../wake/screens/CameraRationale';
import { SetupGuide } from '../wake/screens/SetupGuide';
import { CalibrationModal } from '../wake/screens/CalibrationModal';

export default function ComponentGalleryScreen() {
  const { colors, isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(4);
  const [dotsProgress, setDotsProgress] = useState(2);
  const [selectedScenario, setSelectedScenario] = useState<FakeScenario>('happy-path');
  const [wakeModalVisible, setWakeModalVisible] = useState(false);
  const [rationaleModalVisible, setRationaleModalVisible] = useState(false);
  const [setupGuideModalVisible, setSetupGuideModalVisible] = useState(false);
  const [calibrationModalVisible, setCalibrationModalVisible] = useState(false);

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

        {/* Section 9: Wake Check Scenario Engine & Hero UI */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            9. WAKE-CHECK SCENARIO ENGINE & HERO UI
          </Text>

          {/* Scenario Picker Chips */}
          <View style={styles.scenarioChipsWrap}>
            {(
              [
                'happy-path',
                'dark-room',
                'no-face',
                'never-blinks',
                'permission-denied',
                'camera-error',
                'model-error',
              ] as FakeScenario[]
            ).map((scen) => {
              const active = selectedScenario === scen;
              return (
                <Pressable
                  key={scen}
                  testID={`scenario-chip-${scen}`}
                  onPress={() => setSelectedScenario(scen)}
                  style={[
                    styles.scenarioChip,
                    {
                      backgroundColor: active ? colors.accentYellow : colors.surfaceAlt,
                      borderColor: active ? colors.accentYellow : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scenarioChipText,
                      {
                        color: active ? '#0D0D0D' : colors.ink,
                        fontFamily: active ? typography.fonts.bold : typography.fonts.medium,
                      },
                    ]}
                  >
                    {scen}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Launch Buttons Row */}
          <Pressable
            testID="launch-wake-check-btn"
            onPress={() => setWakeModalVisible(true)}
            style={[styles.primaryActionBtn, { backgroundColor: colors.accentYellow }]}
          >
            <Play size={18} color="#0D0D0D" />
            <Text style={[styles.primaryActionBtnText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
              Run Wake Check ({selectedScenario})
            </Text>
          </Pressable>

          <View style={styles.flowButtonsRow}>
            <Pressable
              onPress={() => setRationaleModalVisible(true)}
              style={[styles.flowSubBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Camera size={14} color={colors.ink} />
              <Text style={[styles.flowSubBtnText, { color: colors.ink }]}>Rationale</Text>
            </Pressable>

            <Pressable
              onPress={() => setSetupGuideModalVisible(true)}
              style={[styles.flowSubBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Eye size={14} color={colors.ink} />
              <Text style={[styles.flowSubBtnText, { color: colors.ink }]}>Setup Guide</Text>
            </Pressable>

            <Pressable
              onPress={() => setCalibrationModalVisible(true)}
              style={[styles.flowSubBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <RefreshCw size={14} color={colors.ink} />
              <Text style={[styles.flowSubBtnText, { color: colors.ink }]}>Calibration</Text>
            </Pressable>
          </View>

          {/* Mini Illustrations & HUD Previews */}
          <View style={[styles.wakePreviewCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.miniHeader, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
              COMPONENT HUD PREVIEWS
            </Text>

            <View style={styles.miniGridRow}>
              {/* Blinking Eyes */}
              <View style={styles.miniCol}>
                <Text style={[styles.miniLabel, { color: colors.muted }]}>Blinking Eyes</Text>
                <BlinkingEyesMiniIllustration />
              </View>

              {/* DotMatrixCountdown */}
              <View style={styles.miniCol}>
                <Text style={[styles.miniLabel, { color: colors.muted }]}>Countdown</Text>
                <DotMatrixCountdown seconds={5} dotSize={4} gap={2} label="HOLD" />
              </View>

              {/* Dot Ring */}
              <View style={styles.miniCol}>
                <Text style={[styles.miniLabel, { color: colors.muted }]}>Dot Ring (60%)</Text>
                <DotRing holdProgress={0.6} />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Check Pills */}
            <CheckPills
              checks={{
                eyesOpen: { ok: true, heldMs: 5000, targetMs: 5000 },
                upright: { ok: true },
                liveness: { ok: false, challenge: { kind: 'blink', count: 2 } },
                lighting: { ok: true, level: 'ok' },
              }}
            />

            {/* Alertness Tick Strip */}
            <AlertnessTick alertness={74} />
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom PillBar Preview */}
      <PillBar
        onAddPress={() => notify.info('Add tapped')}
        onSettingsPress={() => notify.info('Settings tapped')}
        timeRangeText="9:41 ... 10:00"
      />

      {/* Live Wake Check Modal */}
      <Modal
        visible={wakeModalVisible}
        animationType="slide"
        onRequestClose={() => setWakeModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <LiveWakeCheck
            key={selectedScenario}
            engine={new FakeWakeCheckEngine(selectedScenario)}
            targetHoldSeconds={5}
            onComplete={() => {
              notify.success('Wake check completed successfully');
              setWakeModalVisible(false);
            }}
            onFallbackMath={() => {
              notify.info('Switched to math fallback');
              setWakeModalVisible(false);
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Rationale Modal */}
      <Modal
        visible={rationaleModalVisible}
        animationType="slide"
        onRequestClose={() => setRationaleModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <CameraRationale
            onContinue={() => setRationaleModalVisible(false)}
            onFallbackMath={() => setRationaleModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Setup Guide Modal */}
      <Modal
        visible={setupGuideModalVisible}
        animationType="slide"
        onRequestClose={() => setSetupGuideModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <SetupGuide
            faceFound={false}
            onComplete={() => setSetupGuideModalVisible(false)}
            onSkip={() => setSetupGuideModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Calibration Modal */}
      <Modal
        visible={calibrationModalVisible}
        animationType="slide"
        onRequestClose={() => setCalibrationModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <CalibrationModal
            engine={new FakeWakeCheckEngine('happy-path')}
            onComplete={() => setCalibrationModalVisible(false)}
            onCancel={() => setCalibrationModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>
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
  scenarioChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  scenarioChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  scenarioChipText: {
    fontSize: typography.sizes.caption,
  },
  primaryActionBtn: {
    height: 52,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  primaryActionBtnText: {
    fontSize: typography.sizes.body,
  },
  flowButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  flowSubBtn: {
    flex: 1,
    height: 40,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  flowSubBtnText: {
    fontSize: typography.sizes.caption,
  },
  wakePreviewCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.base,
    marginTop: spacing.sm,
  },
  miniHeader: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.8,
  },
  miniGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  miniCol: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniLabel: {
    fontSize: typography.sizes.micro,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
});
