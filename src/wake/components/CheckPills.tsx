/**
 * CheckPills — row of 4 status pills (Eyes open, Upright, Blink, Light).
 * States: pending | active | done. 250ms tint morph on change.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Eye, ArrowUp, RefreshCw, Sun, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography, spacing, radii, iconSizes } from '../../theme/tokens';
import { WakeCheckState } from '../contract';

type PillState = 'pending' | 'active' | 'done';

interface Pill {
  id: string;
  label: string;
  state: PillState;
  Icon: React.ElementType;
}

function derivePills(checks: WakeCheckState['checks']): Pill[] {
  const eyeState: PillState = checks.eyesOpen.ok
    ? 'done'
    : checks.eyesOpen.heldMs > 0
    ? 'active'
    : 'pending';

  const uprightState: PillState = checks.upright.ok ? 'done' : 'pending';

  const blinkState: PillState = checks.liveness.ok
    ? 'done'
    : checks.liveness.challenge
    ? 'active'
    : 'pending';

  const lightState: PillState = checks.lighting.ok ? 'done' : 'active';

  return [
    { id: 'eyes', label: 'Eyes open', state: eyeState, Icon: Eye },
    { id: 'upright', label: 'Upright', state: uprightState, Icon: ArrowUp },
    { id: 'blink', label: 'Blink ×2', state: blinkState, Icon: RefreshCw },
    { id: 'light', label: 'Light', state: lightState, Icon: Sun },
  ];
}

const AnimatedPill = React.memo(function AnimatedPill({
  pill,
  surfaceColor,
  activeColor,
  doneColor,
  inkColor,
  mutedColor,
}: {
  pill: Pill;
  surfaceColor: string;
  activeColor: string;
  doneColor: string;
  inkColor: string;
  mutedColor: string;
}) {
  const { colors } = useTheme();
  // 0 = pending, 1 = active, 2 = done
  const progress = useSharedValue(pill.state === 'done' ? 2 : pill.state === 'active' ? 1 : 0);

  React.useEffect(() => {
    const target = pill.state === 'done' ? 2 : pill.state === 'active' ? 1 : 0;
    progress.value = withTiming(target, { duration: 250 });
  }, [pill.state, progress]);

  const pillStyle = useAnimatedStyle(() => {
    const bg = progress.value <= 1
      ? interpolateColor(progress.value, [0, 1], [surfaceColor, activeColor])
      : interpolateColor(progress.value - 1, [0, 1], [activeColor, doneColor]);
    return { backgroundColor: bg };
  });

  const { Icon } = pill;
  const iconColor =
    pill.state === 'done' ? colors.background : pill.state === 'active' ? inkColor : mutedColor;

  return (
    <Animated.View
      style={[styles.pill, pillStyle]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${pill.label}: ${pill.state}`}
    >
      {pill.state === 'done' ? (
        <Check size={iconSizes.xs} color={iconColor} strokeWidth={2.5} />
      ) : (
        <Icon size={iconSizes.xs} color={iconColor} strokeWidth={2} />
      )}
      <Text
        style={[
          styles.label,
          {
            fontFamily: typography.fonts.medium,
            color: pill.state === 'done' ? colors.background : pill.state === 'active' ? inkColor : mutedColor,
          },
        ]}
        numberOfLines={1}
      >
        {pill.label}
      </Text>
    </Animated.View>
  );
});

interface CheckPillsProps {
  checks: WakeCheckState['checks'];
}

export function CheckPills({ checks }: CheckPillsProps) {
  const { colors } = useTheme();
  const pills = derivePills(checks);

  return (
    <View style={styles.row} accessibilityRole="list">
      {pills.map((pill) => (
        <AnimatedPill
          key={pill.id}
          pill={pill}
          surfaceColor={colors.surface}
          activeColor={colors.accentYellow}
          doneColor={colors.ink}
          inkColor={colors.ink}
          mutedColor={colors.muted}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.pill,
    minHeight: 32,
  },
  label: {
    fontSize: typography.sizes.caption,
    letterSpacing: 0.2,
  },
});
