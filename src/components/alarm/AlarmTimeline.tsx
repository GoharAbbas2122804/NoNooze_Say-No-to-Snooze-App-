import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Alarm } from '../../domain/types';
import { typography, spacing, radii } from '../../theme/tokens';

export interface AlarmTimelineProps {
  alarms: Alarm[];
  currentTimeMinutes?: number; // Minutes from midnight 0..1440
}

/** Pure math helper: computes X position in pixels for a given minute within the timeline */
export function calculateTickPosition(
  minute: number,
  totalMinutes = 1440,
  timelineWidth = 720
): number {
  const clamped = Math.max(0, Math.min(minute, totalMinutes));
  return (clamped / totalMinutes) * timelineWidth;
}

/** Pure helper: generates discrete timeline tick markers across 24 hours */
export function generateTimelineTicks(
  intervalMinutes = 30,
  totalHours = 24
): { minute: number; isHour: boolean; isQuarter: boolean }[] {
  const total = totalHours * 60;
  const ticks = [];
  for (let m = 0; m <= total; m += intervalMinutes) {
    ticks.push({
      minute: m,
      isHour: m % 60 === 0,
      isQuarter: m % 180 === 0,
    });
  }
  return ticks;
}

const TIMELINE_TOTAL_WIDTH = 840;

export function AlarmTimeline({
  alarms,
  currentTimeMinutes,
}: AlarmTimelineProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Live system minute from midnight if not provided
  const nowMinutes = React.useMemo(() => {
    if (currentTimeMinutes !== undefined) return currentTimeMinutes;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [currentTimeMinutes]);

  // Enabled alarm minutes
  const alarmMinutes = React.useMemo(() => {
    return alarms
      .filter((a) => a.enabled)
      .map((a) => {
        const [h, m] = a.time.split(':').map((s) => parseInt(s, 10) || 0);
        return h * 60 + m;
      });
  }, [alarms]);

  const ticks = React.useMemo(() => generateTimelineTicks(30, 24), []);
  const nowX = calculateTickPosition(nowMinutes, 1440, TIMELINE_TOTAL_WIDTH);

  // Auto-scroll to center on NOW or first upcoming alarm
  useEffect(() => {
    const timer = setTimeout(() => {
      const targetX = Math.max(0, nowX - 160);
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [nowX]);

  return (
    <View
      testID="alarm-timeline-card"
      style={[styles.card, { backgroundColor: colors.surface }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, { color: colors.muted, fontFamily: typography.fonts.bold }]}>
          24H SCHEDULE
        </Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: colors.accentYellow }]} />
          <Text style={[styles.legendText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            Now
          </Text>
          <View style={[styles.legendDot, { backgroundColor: colors.ink, marginLeft: spacing.sm }]} />
          <Text style={[styles.legendText, { color: colors.muted, fontFamily: typography.fonts.medium }]}>
            Alarm
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.timelineTrack, { width: TIMELINE_TOTAL_WIDTH }]}>
          {/* Base Horizontal Ruler Line */}
          <View style={[styles.baseLine, { backgroundColor: colors.borderSubtle }]} />

          {/* Regular Tick Marks */}
          {ticks.map((t) => {
            const x = calculateTickPosition(t.minute, 1440, TIMELINE_TOTAL_WIDTH);
            const height = t.isQuarter ? 24 : t.isHour ? 16 : 10;
            return (
              <View
                key={t.minute}
                style={[
                  styles.tick,
                  {
                    left: x,
                    height,
                    backgroundColor: t.isHour ? colors.muted : colors.borderSubtle,
                  },
                ]}
              />
            );
          })}

          {/* Alarm Indicator Ticks (Black / Ink, thicker) */}
          {alarmMinutes.map((m, idx) => {
            const alarmX = calculateTickPosition(m, 1440, TIMELINE_TOTAL_WIDTH);
            return (
              <View
                key={`alarm-${m}-${idx}`}
                testID={`alarm-tick-${m}`}
                style={[
                  styles.alarmMarker,
                  {
                    left: alarmX - 2,
                    backgroundColor: colors.ink,
                  },
                ]}
              >
                <View
                  style={[
                    styles.alarmBeacon,
                    { backgroundColor: colors.ink },
                  ]}
                />
              </View>
            );
          })}

          {/* NOW Yellow Line */}
          <View
            testID="now-indicator"
            style={[
              styles.nowMarker,
              {
                left: nowX - 1.5,
                backgroundColor: colors.accentYellow,
              },
            ]}
          >
            <View
              style={[
                styles.nowBeacon,
                { backgroundColor: colors.accentYellow },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.micro,
    letterSpacing: 1.2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: typography.sizes.caption,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  timelineTrack: {
    height: 52,
    position: 'relative',
    justifyContent: 'center',
  },
  baseLine: {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    height: 1,
  },
  tick: {
    position: 'absolute',
    top: 14,
    width: 1,
    borderRadius: 0.5,
  },
  alarmMarker: {
    position: 'absolute',
    top: 6,
    width: 4,
    height: 38,
    borderRadius: 2,
    zIndex: 5,
    alignItems: 'center',
  },
  alarmBeacon: {
    position: 'absolute',
    top: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nowMarker: {
    position: 'absolute',
    top: 4,
    width: 3,
    height: 42,
    borderRadius: 1.5,
    zIndex: 6,
    alignItems: 'center',
  },
  nowBeacon: {
    position: 'absolute',
    top: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
