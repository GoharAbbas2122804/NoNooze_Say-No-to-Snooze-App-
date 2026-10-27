/* eslint-disable no-undef */
globalThis.__workletsModuleProxy = {
  loadUnpackersWithCode: () => {},
  registerWorklet: () => {},
};

jest.mock('react-native-worklets', () => ({
  createWorklet: (fn) => fn,
}));

jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: (c) => c,
    },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (fn) => fn(),
    withTiming: (toValue) => toValue,
    withSequence: (...args) => args[args.length - 1],
    withSpring: (toValue) => toValue,
    withRepeat: (anim) => anim,
    Easing: {
      inOut: (fn) => fn,
      sin: (t) => t,
      elastic: () => (t) => t,
      cubic: (t) => t,
      linear: (t) => t,
      out: (fn) => fn,
    },
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock AsyncStorage globally
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        const MockIcon = (props) => React.createElement(View, { testID: `icon-${String(prop)}`, ...props });
        MockIcon.displayName = String(prop);
        return MockIcon;
      },
    }
  );
});

