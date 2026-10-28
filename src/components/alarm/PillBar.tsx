import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Plus, Sliders } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { RoundButton } from '../ui/RoundButton';
import { typography, spacing, radii, iconSizes } from '../../theme/tokens';
import * as Haptics from 'expo-haptics';

export interface PillBarProps {
  onAddPress: () => void;
  onSettingsPress: () => void;
  timeRangeText?: string;
}

export function PillBar({
  onAddPress,
  onSettingsPress,
  timeRangeText = '9:41 ... 10:00',
}: PillBarProps) {
  const { colors, isDark } = useTheme();

  const handleRulerPress = () => {
    Haptics.selectionAsync().catch(() => {});
    onAddPress();
  };

  return (
    <View style={styles.floatingContainer} testID="pill-bar-dock">
      {/* Left: Round Settings/Calendar button */}
      <RoundButton
        testID="pill-bar-settings-button"
        accessibilityLabel="Alarm and Reliability Settings"
        variant="surface"
        size={56}
        onPress={onSettingsPress}
      >
        <Sliders size={iconSizes.md} color={colors.ink} strokeWidth={2.0} />
      </RoundButton>

      {/* Center: Black/Ink Pill with Time Ruler & RED Center Marker */}
      <Pressable
        testID="pill-bar-ruler"
        accessibilityRole="button"
        accessibilityLabel="Time ruler, tap to quick add alarm"
        onPress={handleRulerPress}
        style={[
          styles.rulerPill,
          {
            backgroundColor: isDark ? '#171716' : '#0D0D0D',
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        {/* Subtle background tick marks */}
        <View style={styles.ticksRow}>
          {Array.from({ length: 15 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.rulerTick,
                {
                  height: i % 5 === 0 ? 14 : 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              ]}
            />
          ))}
        </View>

        {/* RED Center Needle Marker */}
        <View
          testID="ruler-red-marker"
          style={[styles.redMarker, { backgroundColor: colors.markerRed }]}
        />

        {/* Time label overlay */}
        <Text
          style={[
            styles.rulerText,
            { fontFamily: typography.fonts.medium },
          ]}
        >
          {timeRangeText}
        </Text>
      </Pressable>

      {/* Right: Round Add Alarm Button */}
      <RoundButton
        testID="pill-bar-add-button"
        accessibilityLabel="Create New Alarm"
        variant={isDark ? 'ink' : 'accentYellow'}
        size={56}
        onPress={onAddPress}
      >
        <Plus
          size={iconSizes.lg}
          color={isDark ? colors.background : '#0D0D0D'}
          strokeWidth={2.5}
        />
      </RoundButton>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  rulerPill: {
    flex: 1,
    height: 56,
    borderRadius: radii.pill,
    marginHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  ticksRow: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rulerTick: {
    width: 1,
    borderRadius: 0.5,
  },
  redMarker: {
    position: 'absolute',
    width: 2.5,
    height: 28,
    borderRadius: 1.5,
    zIndex: 2,
  },
  rulerText: {
    color: '#EDEDE8',
    fontSize: typography.sizes.caption,
    letterSpacing: 0.6,
    zIndex: 3,
    backgroundColor: 'rgba(13, 13, 13, 0.6)',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xs,
  },
});
