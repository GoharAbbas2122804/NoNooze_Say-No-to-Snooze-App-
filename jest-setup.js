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
// Mock sonner-native
jest.mock('sonner-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const toastMock = jest.fn((msg) => String(msg));
  toastMock.success = jest.fn((msg) => String(msg));
  toastMock.error = jest.fn((msg) => String(msg));
  toastMock.warning = jest.fn((msg) => String(msg));
  toastMock.info = jest.fn((msg) => String(msg));
  toastMock.promise = jest.fn((p) => p);
  toastMock.dismiss = jest.fn();

  return {
    toast: toastMock,
    Toaster: (props) => React.createElement(View, { testID: 'sonner-toaster', ...props }),
  };
});

// Mock @shopify/react-native-skia
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Canvas: (props) => React.createElement(View, { testID: 'skia-canvas', ...props }),
    Circle: () => null,
    Rect: () => null,
    Group: ({ children }) => children,
    Paint: () => null,
    vec: (x, y) => ({ x, y }),
    useFont: () => null,
    Skia: {
      Paint: () => ({}),
      Color: () => ({}),
    },
  };
});
