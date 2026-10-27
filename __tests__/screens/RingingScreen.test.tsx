import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import RingingScreen from '../../src/app/ringing';
import { useAlarmStore } from '../../src/store/alarm-store';
import { BackHandler } from 'react-native';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

// Mock expo-keep-awake
jest.mock('expo-keep-awake', () => ({
  useKeepAwake: jest.fn(),
}));

describe('RingingScreen', () => {
  const mockAlarm = {
    id: 'ringing-alarm-1',
    time: '06:30',
    days: [1, 2, 3],
    label: 'Morning Run',
    enabled: true,
    sound: 'default',
    steps: [{ methodId: 'math' as const, target: 1 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAlarmStore.setState({
      alarms: [mockAlarm],
      activeAlarmId: 'ringing-alarm-1',
    });
  });

  it('registers hardware back button blocker', async () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
    await render(<RingingScreen />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function)
    );
  });

  it('renders alarm time, label, and step counter', async () => {
    await render(<RingingScreen />);

    expect(screen.getByText('06:30')).toBeTruthy();
    expect(screen.getByText('Morning Run')).toBeTruthy();
    expect(screen.getByText('Step 1 of 1')).toBeTruthy();
    expect(screen.getByText(/No snooze allowed/)).toBeTruthy();
  });
});
