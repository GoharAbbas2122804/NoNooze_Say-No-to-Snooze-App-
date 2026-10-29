import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Modal } from 'react-native';
import { Shield, Minus, Plus, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAlarmStore } from '../../store/alarm-store';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { RoundButton } from '../../components/ui/RoundButton';
import { CalibrationModal } from './CalibrationModal';
import { typography, spacing, radii } from '../../theme/tokens';
import { FakeWakeCheckEngine } from '../fake/FakeWakeCheckEngine';

export function WakeCheckSettings() {
  const { colors } = useTheme();

  const wakeSensitivity = useAlarmStore((state) => state.wakeSensitivity);
  const setWakeSensitivity = useAlarmStore((state) => state.setWakeSensitivity);

  const wakeHoldSeconds = useAlarmStore((state) => state.wakeHoldSeconds);
  const setWakeHoldSeconds = useAlarmStore((state) => state.setWakeHoldSeconds);

  const wakeLiveness = useAlarmStore((state) => state.wakeLiveness);
  const setWakeLiveness = useAlarmStore((state) => state.setWakeLiveness);

  const wakeFillLight = useAlarmStore((state) => state.wakeFillLight);
  const setWakeFillLight = useAlarmStore((state) => state.setWakeFillLight);

  const darkAtNight = useAlarmStore((state) => state.darkAtNight);
  const setDarkAtNight = useAlarmStore((state) => state.setDarkAtNight);

  const [calibrating, setCalibrating] = useState(false);
  const [fakeEngine] = useState(() => new FakeWakeCheckEngine());

  const handleSensitivityChange = (val: 'relaxed' | 'standard' | 'strict') => {
    Haptics.selectionAsync().catch(() => {});
    setWakeSensitivity(val);
  };

  const handleAdjustHold = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setWakeHoldSeconds(wakeHoldSeconds + delta);
  };

  return (
    <View style={styles.container} testID="wake-check-settings-section">
      <View style={styles.sectionHeader}>
        <TwoToneTitle primary="Face Wake" secondary="Preferences" />
      </View>

      {/* Sensitivity Segmented Control */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
            Detection Sensitivity
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            {wakeSensitivity.toUpperCase()}
          </Text>
        </View>

        <View style={[styles.segmentedTrack, { backgroundColor: colors.surfaceAlt }]}>
          {(['relaxed', 'standard', 'strict'] as const).map((s) => {
            const active = wakeSensitivity === s;
            return (
              <Pressable
                key={s}
                testID={`sensitivity-${s}`}
                onPress={() => handleSensitivityChange(s)}
                style={[
                  styles.segmentButton,
                  active && { backgroundColor: colors.accentYellow },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: active ? '#0D0D0D' : colors.muted,
                      fontFamily: active ? typography.fonts.bold : typography.fonts.medium,
                    },
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Hold Seconds Stepper */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
        <View style={styles.rowBetween}>
          <View style={styles.labelCol}>
            <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              Hold Time (Seconds)
            </Text>
            <Text style={[styles.rowSubtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              Required duration eyes must stay open
            </Text>
          </View>

          <View style={styles.stepperRow}>
            <RoundButton
              testID="hold-seconds-dec"
              size={36}
              variant="surfaceAlt"
              onPress={() => handleAdjustHold(-1)}
              disabled={wakeHoldSeconds <= 3}
            >
              <Minus size={14} color={colors.ink} />
            </RoundButton>
            <Text
              testID="hold-seconds-val"
              style={[styles.stepperVal, { color: colors.ink, fontFamily: typography.fonts.bold }]}
            >
              {wakeHoldSeconds}s
            </Text>
            <RoundButton
              testID="hold-seconds-inc"
              size={36}
              variant="surfaceAlt"
              onPress={() => handleAdjustHold(1)}
              disabled={wakeHoldSeconds >= 10}
            >
              <Plus size={14} color={colors.ink} />
            </RoundButton>
          </View>
        </View>
      </View>

      {/* Toggles */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
        {/* Liveness Check Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.labelCol}>
            <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              Liveness Verification
            </Text>
            <Text style={[styles.rowSubtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              Require blink or head turn to prevent photo spoofing
            </Text>
          </View>
          <Switch
            testID="liveness-toggle"
            value={wakeLiveness}
            onValueChange={setWakeLiveness}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={colors.switchThumb}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

        {/* Fill Light Lamp Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.labelCol}>
            <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              Low-Light Screen Lamp
            </Text>
            <Text style={[styles.rowSubtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              Ramps screen brightness softly when dark
            </Text>
          </View>
          <Switch
            testID="fill-light-toggle"
            value={wakeFillLight}
            onValueChange={setWakeFillLight}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={colors.switchThumb}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

        {/* Dark At Night */}
        <View style={styles.toggleRow}>
          <View style={styles.labelCol}>
            <Text style={[styles.rowTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              Dark Theme at Night (21:00–07:00)
            </Text>
            <Text style={[styles.rowSubtitle, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
              Prevents blinding user during nighttime wake checks
            </Text>
          </View>
          <Switch
            testID="dark-at-night-toggle"
            value={darkAtNight}
            onValueChange={setDarkAtNight}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={colors.switchThumb}
          />
        </View>
      </View>

      {/* Recalibrate Button */}
      <Pressable
        testID="recalibrate-eyes-btn"
        onPress={() => setCalibrating(true)}
        style={[styles.recalibrateButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderSubtle }]}
      >
        <RefreshCw size={18} color={colors.ink} />
        <Text style={[styles.recalibrateText, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
          Recalibrate Eye Profile
        </Text>
      </Pressable>

      {/* Privacy Note */}
      <View style={styles.privacyNoteBox}>
        <Shield size={16} color={colors.muted} />
        <Text style={[styles.privacyNoteText, { color: colors.muted, fontFamily: typography.fonts.regular }]}>
          Privacy first: Frames never leave your device. All computer vision is executed strictly in local memory and discarded instantly.
        </Text>
      </View>

      {/* Calibration Modal */}
      <Modal visible={calibrating} animationType="slide" onRequestClose={() => setCalibrating(false)}>
        <CalibrationModal
          engine={fakeEngine}
          onComplete={() => setCalibrating(false)}
          onCancel={() => setCalibrating(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
    marginVertical: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rowTitle: {
    fontSize: typography.sizes.body,
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    fontSize: typography.sizes.bodySmall,
    marginTop: 2,
    lineHeight: 18,
  },
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: typography.sizes.caption,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperVal: {
    fontSize: typography.sizes.body,
    width: 32,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  recalibrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  recalibrateText: {
    fontSize: typography.sizes.body,
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginTop: spacing.xs,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: typography.sizes.micro,
    lineHeight: 16,
  },
});
