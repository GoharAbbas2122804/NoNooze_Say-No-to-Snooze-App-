import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { X, Video, Share2, ShieldAlert, CheckCircle, Database } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { notify } from '../../ui/notify';
import { typography, spacing, radii } from '../../theme/tokens';

export interface DataCollectorModalProps {
  onClose: () => void;
}

export function DataCollectorModal({ onClose }: DataCollectorModalProps) {
  const { colors } = useTheme();

  // Label pickers
  const [posture, setPosture] = useState<'supine' | 'sitting' | 'standing'>('supine');
  const [eyes, setEyes] = useState<'open' | 'closed' | 'squinting' | 'blinking'>('open');
  const [lighting, setLighting] = useState<'dark' | 'dim' | 'bright'>('dim');
  const [glasses, setGlasses] = useState<'none' | 'reading' | 'heavy-frame'>('none');

  // Consent toggle
  const [consentEyeCrops, setConsentEyeCrops] = useState<boolean>(false);

  // Recording state
  const [recording, setRecording] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(10);

  // Sample session list
  const [sessions, setSessions] = useState<
    { id: string; timestamp: string; label: string; frames: number }[]
  >([
    { id: 'sess-1', timestamp: '10:14:02', label: 'supine / open / dim', frames: 300 },
    { id: 'sess-2', timestamp: '10:15:30', label: 'sitting / closed / dark', frames: 298 },
  ]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    if (recording) {
      t = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setRecording(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            notify.success('10s session recorded');
            setSessions((s) => [
              {
                id: `sess-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                label: `${posture} / ${eyes} / ${lighting}`,
                frames: 300,
              },
              ...s,
            ]);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [recording, posture, eyes, lighting]);

  const handleStartRecord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCountdown(10);
    setRecording(true);
  };

  const handleExport = () => {
    Haptics.selectionAsync().catch(() => {});
    notify.success('Dataset exported to JSON format');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]} testID="data-collector-modal">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Database size={20} color={colors.accentYellow} />
          <TwoToneTitle primary="Vision Dataset" secondary="Collector" />
        </View>
        <Pressable
          testID="collector-close-btn"
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
          accessibilityRole="button"
          accessibilityLabel="Close dataset collector"
        >
          <X size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Label Pickers Section */}
        <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
          SESSION GROUND TRUTH LABELS
        </Text>

        {/* Posture */}
        <View style={styles.pickerRow}>
          <Text style={[styles.pickerLabel, { color: colors.ink }]}>Posture:</Text>
          <View style={styles.chipsRow}>
            {(['supine', 'sitting', 'standing'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPosture(p)}
                style={[
                  styles.chip,
                  { backgroundColor: posture === p ? colors.accentYellow : colors.surfaceAlt },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: posture === p ? '#0D0D0D' : colors.muted, fontFamily: typography.fonts.bold },
                  ]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Eyes */}
        <View style={styles.pickerRow}>
          <Text style={[styles.pickerLabel, { color: colors.ink }]}>Eyes:</Text>
          <View style={styles.chipsRow}>
            {(['open', 'closed', 'squinting', 'blinking'] as const).map((e) => (
              <Pressable
                key={e}
                onPress={() => setEyes(e)}
                style={[
                  styles.chip,
                  { backgroundColor: eyes === e ? colors.accentYellow : colors.surfaceAlt },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: eyes === e ? '#0D0D0D' : colors.muted, fontFamily: typography.fonts.bold },
                  ]}
                >
                  {e}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Lighting */}
        <View style={styles.pickerRow}>
          <Text style={[styles.pickerLabel, { color: colors.ink }]}>Lighting:</Text>
          <View style={styles.chipsRow}>
            {(['dark', 'dim', 'bright'] as const).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLighting(l)}
                style={[
                  styles.chip,
                  { backgroundColor: lighting === l ? colors.accentYellow : colors.surfaceAlt },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: lighting === l ? '#0D0D0D' : colors.muted, fontFamily: typography.fonts.bold },
                  ]}
                >
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Glasses */}
        <View style={styles.pickerRow}>
          <Text style={[styles.pickerLabel, { color: colors.ink }]}>Glasses:</Text>
          <View style={styles.chipsRow}>
            {(['none', 'reading', 'heavy-frame'] as const).map((g) => (
              <Pressable
                key={g}
                onPress={() => setGlasses(g)}
                style={[
                  styles.chip,
                  { backgroundColor: glasses === g ? colors.accentYellow : colors.surfaceAlt },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: glasses === g ? '#0D0D0D' : colors.muted, fontFamily: typography.fonts.bold },
                  ]}
                >
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Consent Toggle for Eye Crops */}
        <View style={[styles.consentCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderSubtle }]}>
          <View style={styles.consentTop}>
            <ShieldAlert size={18} color={colors.accentYellow} />
            <Text style={[styles.consentTitle, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              Save 48x48 eye crops for training
            </Text>
          </View>
          <Text style={[styles.consentDesc, { color: colors.muted }]}>
            Off by default. When enabled, anonymized eye crops are saved locally in the app sandbox to evaluate the CNN classifier.
          </Text>
          <View style={styles.consentSwitchRow}>
            <Text style={[styles.consentSwitchLabel, { color: colors.ink }]}>Enable eye crop saving:</Text>
            <Switch
              testID="consent-eye-crops-switch"
              value={consentEyeCrops}
              onValueChange={setConsentEyeCrops}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={colors.switchThumb}
            />
          </View>
        </View>

        {/* Record 10s Button */}
        <Pressable
          testID="record-10s-btn"
          onPress={handleStartRecord}
          disabled={recording}
          style={[
            styles.recordButton,
            { backgroundColor: recording ? colors.error : colors.accentYellow },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Record 10 second dataset session"
        >
          <Video size={20} color="#0D0D0D" />
          <Text style={[styles.recordButtonText, { color: '#0D0D0D', fontFamily: typography.fonts.bold }]}>
            {recording ? `Recording... (${countdown}s remaining)` : 'Record 10s Session'}
          </Text>
        </Pressable>

        {/* Session List & Export */}
        <View style={styles.sessionsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
            RECORDED SESSIONS ({sessions.length})
          </Text>
          <Pressable
            testID="export-dataset-btn"
            onPress={handleExport}
            style={[styles.exportBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <Share2 size={14} color={colors.ink} />
            <Text style={[styles.exportBtnText, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              Export
            </Text>
          </Pressable>
        </View>

        <View style={styles.sessionsList}>
          {sessions.map((sess) => (
            <View
              key={sess.id}
              style={[styles.sessionItem, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderSubtle }]}
            >
              <View style={styles.sessionLeft}>
                <CheckCircle size={16} color={colors.success} />
                <View>
                  <Text style={[styles.sessionLabel, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                    {sess.label}
                  </Text>
                  <Text style={[styles.sessionMeta, { color: colors.muted }]}>
                    {sess.timestamp} · {sess.frames} frames
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: spacing.md,
    gap: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.sizes.caption,
    letterSpacing: 0.8,
  },
  pickerRow: {
    gap: spacing.xs,
  },
  pickerLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.medium,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  chipText: {
    fontSize: typography.sizes.caption,
  },
  consentCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.sm,
  },
  consentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  consentTitle: {
    fontSize: typography.sizes.bodySmall,
  },
  consentDesc: {
    fontSize: typography.sizes.micro,
    lineHeight: 16,
  },
  consentSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  consentSwitchLabel: {
    fontSize: typography.sizes.bodySmall,
  },
  recordButton: {
    width: '100%',
    height: 56,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  recordButtonText: {
    fontSize: typography.sizes.body,
  },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  exportBtnText: {
    fontSize: typography.sizes.caption,
  },
  sessionsList: {
    gap: spacing.xs,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionLabel: {
    fontSize: typography.sizes.caption,
  },
  sessionMeta: {
    fontSize: typography.sizes.micro,
  },
});
