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
    useReducedMotion: () => false,
    interpolateColor: (val, input, output) => output?.[0] || '#000000',
    withTiming: (toValue) => toValue,
    withSequence: (...args) => args[args.length - 1],
    withSpring: (toValue) => toValue,
    withRepeat: (anim) => anim,
    Easing: {
      in: (fn) => fn,
      out: (fn) => fn,
      inOut: (fn) => fn,
      sin: (t) => t,
      quad: (t) => t,
      cubic: (t) => t,
      linear: (t) => t,
      poly: () => (t) => t,
      elastic: () => (t) => t,
      back: () => (t) => t,
      exp: (t) => t,
      bezier: () => (t) => t,
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

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        name: 'custom_alarm_beat.mp3',
        uri: 'file:///mock/storage/custom_alarm_beat.mp3',
        size: 24500,
        mimeType: 'audio/mpeg',
      },
    ],
  }),
}));

// Mock expo-audio
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    setVolume: jest.fn(),
    remove: jest.fn(),
  })),
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    setVolume: jest.fn(),
  })),
  useAudioPlayerStatus: jest.fn(() => ({
    playing: false,
    currentTime: 0,
    duration: 30,
  })),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));
