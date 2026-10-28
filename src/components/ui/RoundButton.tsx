import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { radii, hitSlop } from '../../theme/tokens';

export interface RoundButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  size?: number;
  variant?: 'ink' | 'surface' | 'surfaceAlt' | 'accentYellow';
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export function RoundButton({
  onPress,
  children,
  size = 56,
  variant = 'surface',
  style,
  testID,
  accessibilityLabel,
  disabled = false,
}: RoundButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getBackgroundColor = () => {
    if (disabled) return colors.disabled;
    switch (variant) {
      case 'ink':
        return colors.ink;
      case 'accentYellow':
        return colors.accentYellow;
      case 'surfaceAlt':
        return colors.surfaceAlt;
      case 'surface':
      default:
        return colors.surface;
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        hitSlop={hitSlop}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: radii.round,
            backgroundColor: getBackgroundColor(),
          },
          style,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
