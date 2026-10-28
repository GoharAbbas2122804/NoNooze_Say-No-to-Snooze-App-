import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { RoundButton } from './RoundButton';
import { iconSizes } from '../../theme/tokens';

export function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useTheme();
  const rotation = useSharedValue(isDark ? 0 : 180);

  useEffect(() => {
    rotation.value = withSpring(isDark ? 0 : 180, {
      damping: 14,
      stiffness: 140,
    });
  }, [isDark, rotation]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <RoundButton
      testID="theme-toggle-button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      variant="surface"
      onPress={toggleTheme}
      size={56}
    >
      <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
        {isDark ? (
          <Moon size={iconSizes.md} color={colors.ink} strokeWidth={2.0} />
        ) : (
          <Sun size={iconSizes.md} color={colors.ink} strokeWidth={2.0} />
        )}
      </Animated.View>
    </RoundButton>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
