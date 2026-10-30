/**
 * HintText — rate-limited inline hint label near the viewfinder.
 * Also fires notify.info at most once per 8 s.
 */
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/tokens';
import { notify } from '../../ui/notify';
import { Hint } from '../contract';
import { useHintRateLimit } from '../hooks/useHintRateLimit';

const HINT_MESSAGES: Record<Hint, string> = {
  'no-face': 'Look at the camera',
  'too-dark': 'Turn up the light',
  'too-bright': 'Move away from the light',
  'move-closer': 'Move a little closer',
  'move-back': 'Move back a little',
  'look-at-camera': 'Look at the camera',
  'sit-up': 'Sit up a little',
  'hold-still': 'Hold still',
  'eyes-closed': 'Open both eyes and look at the camera',
};

interface HintTextProps {
  hint: Hint | undefined;
}

export function HintText({ hint }: HintTextProps) {
  const { colors } = useTheme();
  const rateHint = useHintRateLimit(hint);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(4);
  const lastNotified = useRef<Hint | undefined>(undefined);

  useEffect(() => {
    if (rateHint) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 160 });

      if (lastNotified.current !== rateHint) {
        lastNotified.current = rateHint;
        notify.info(HINT_MESSAGES[rateHint]);
      }
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(4, { duration: 150 });
    }
  }, [rateHint, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!rateHint) return null;

  return (
    <Animated.View style={animStyle} accessible accessibilityLiveRegion="polite" accessibilityLabel={HINT_MESSAGES[rateHint ?? 'no-face']}>
      <Text
        style={[
          styles.hint,
          {
            fontFamily: typography.fonts.medium,
            color: colors.accentYellow,
          },
        ]}
      >
        {HINT_MESSAGES[rateHint]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
