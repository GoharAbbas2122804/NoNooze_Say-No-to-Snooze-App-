import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { X, Activity } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TwoToneTitle } from '../../components/ui/TwoToneTitle';
import { typography, spacing, radii } from '../../theme/tokens';
import { FrameSignals } from '../contract';

export interface SignalDebuggerOverlayProps {
  signals?: FrameSignals;
  onClose: () => void;
}

const HISTORY_LENGTH = 30;

export function SignalDebuggerOverlay({ signals, onClose }: SignalDebuggerOverlayProps) {
  const { colors } = useTheme();

  const [prevSignals, setPrevSignals] = useState(signals);
  // History buffer for sparkline tracking
  const [history, setHistory] = useState<{
    mlkit: number[];
    ear: number[];
    cnn: number[];
    fused: number[];
  }>({
    mlkit: Array(HISTORY_LENGTH).fill(0.8),
    ear: Array(HISTORY_LENGTH).fill(0.78),
    cnn: Array(HISTORY_LENGTH).fill(0.85),
    fused: Array(HISTORY_LENGTH).fill(0.82),
  });

  if (signals !== prevSignals) {
    setPrevSignals(signals);
    if (signals) {
      const src = signals.source || {};
      const mlkitVal = src.mlkit ?? signals.eyesOpen ?? 0.8;
      const earVal = src.ear ?? signals.eyesOpen ?? 0.78;
      const cnnVal = src.cnn ?? signals.eyesOpen ?? 0.85;
      const fusedVal = src.fused ?? signals.eyesOpen ?? 0.82;

      setHistory((prev) => ({
        mlkit: [...prev.mlkit.slice(1), mlkitVal],
        ear: [...prev.ear.slice(1), earVal],
        cnn: [...prev.cnn.slice(1), cnnVal],
        fused: [...prev.fused.slice(1), fusedVal],
      }));
    }
  }

  const sources = [
    { key: 'fused', name: 'Fused Output', color: colors.accentYellow, data: history.fused },
    { key: 'cnn', name: 'Custom Eye CNN', color: colors.success, data: history.cnn },
    { key: 'ear', name: 'FaceMesh EAR', color: '#60A5FA', data: history.ear },
    { key: 'mlkit', name: 'MLKit Probabilities', color: colors.muted, data: history.mlkit },
  ];

  const yaw = signals ? Math.round(signals.yaw) : 0;
  const pitch = signals ? Math.round(signals.pitch) : 0;
  const roll = signals ? Math.round(signals.roll) : 0;
  const latency = signals ? Math.round(signals.latencyMs) : 32;
  const fps = latency > 0 ? Math.min(60, Math.round(1000 / latency)) : 30;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]} testID="signal-debugger-overlay">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={22} color={colors.accentYellow} />
          <TwoToneTitle primary="Vision Signals" secondary="& Model Comparison" />
        </View>
        <Pressable
          testID="debugger-close-btn"
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
          accessibilityRole="button"
          accessibilityLabel="Close signal debugger"
        >
          <X size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Performance HUD Row */}
        <View style={styles.perfRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>INFERENCE</Text>
            <Text style={[styles.statValue, { color: colors.accentYellow, fontFamily: typography.fonts.bold }]}>
              {latency} ms
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>FRAME RATE</Text>
            <Text style={[styles.statValue, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              {fps} FPS
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>YAW / PITCH / ROLL</Text>
            <Text style={[styles.statValue, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
              {yaw}° / {pitch}° / {roll}°
            </Text>
          </View>
        </View>

        {/* Multi-Model Sparklines */}
        <Text style={[styles.sectionSubtitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
          MODEL COMPARISON (EYE OPENNESS 0.0 - 1.0)
        </Text>

        <View style={styles.sparklinesList}>
          {sources.map((src) => {
            const currentVal = src.data[src.data.length - 1];
            return (
              <View
                key={src.key}
                style={[styles.sparklineCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderSubtle }]}
              >
                <View style={styles.sparklineHeader}>
                  <View style={styles.srcBadgeRow}>
                    <View style={[styles.colorDot, { backgroundColor: src.color }]} />
                    <Text style={[styles.srcName, { color: colors.ink, fontFamily: typography.fonts.bold }]}>
                      {src.name}
                    </Text>
                  </View>
                  <Text style={[styles.srcValue, { color: src.color, fontFamily: typography.fonts.bold }]}>
                    {(currentVal * 100).toFixed(0)}%
                  </Text>
                </View>

                {/* Micro Sparkline Bar Graph */}
                <View style={styles.barsContainer}>
                  {/* Threshold line 0.6 */}
                  <View style={[styles.thresholdLine, { bottom: '60%', backgroundColor: colors.dotInactive }]} />
                  {/* Threshold line 0.3 */}
                  <View style={[styles.thresholdLine, { bottom: '30%', backgroundColor: colors.dotInactive }]} />

                  {src.data.map((val, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.sparkBar,
                        {
                          height: `${Math.max(4, Math.min(100, val * 100))}%`,
                          backgroundColor: src.color,
                          opacity: 0.3 + (idx / HISTORY_LENGTH) * 0.7,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            );
          })}
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
  headerLeft: {
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
  perfRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.sizes.bodySmall,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.caption,
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  sparklinesList: {
    gap: spacing.sm,
  },
  sparklineCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm + 2,
    gap: spacing.xs,
  },
  sparklineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  srcBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  srcName: {
    fontSize: typography.sizes.caption,
  },
  srcValue: {
    fontSize: typography.sizes.caption,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    gap: 3,
    position: 'relative',
    marginTop: 4,
  },
  thresholdLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 1,
  },
});
