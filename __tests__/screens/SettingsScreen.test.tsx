import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import SettingsScreen from '../../src/app/permissions';
import { useAlarmStore } from '../../src/store/alarm-store';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

// Mock alarm scheduler
jest.mock('../../src/services/alarm-scheduler', () => ({
  getAlarmScheduler: () => ({
    getPermissionStatus: jest.fn().mockResolvedValue({
      notifications: true,
      exactAlarms: true,
      fullScreenIntent: true,
      batteryOptimizationIgnored: true,
    }),
    requestPermissions: jest.fn().mockResolvedValue(true),
    openExactAlarmSettings: jest.fn().mockResolvedValue(true),
    openBatteryOptimizationSettings: jest.fn().mockResolvedValue(true),
  }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    useAlarmStore.setState({ timeFormat: '12h' });
    jest.clearAllMocks();
  });

  it('renders settings title and time format options', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('TIME & CLOCK DISPLAY')).toBeTruthy();
    expect(screen.getByTestId('time-format-12h-btn')).toBeTruthy();
    expect(screen.getByTestId('time-format-24h-btn')).toBeTruthy();
  });

  it('toggles time format from 12h to 24h and back', async () => {
    const user = userEvent.setup();
    await render(<SettingsScreen />);

    expect(useAlarmStore.getState().timeFormat).toBe('12h');

    await user.press(screen.getByTestId('time-format-24h-btn'));
    expect(useAlarmStore.getState().timeFormat).toBe('24h');

    await user.press(screen.getByTestId('time-format-12h-btn'));
    expect(useAlarmStore.getState().timeFormat).toBe('12h');
  });

  it('adjusts volume up and down properly', async () => {
    const user = userEvent.setup();
    useAlarmStore.setState({ alarmVolume: 80 });

    await render(<SettingsScreen />);

    expect(screen.getByTestId('volume-display-text')).toBeTruthy();
    expect(screen.getByText('80%')).toBeTruthy();

    await user.press(screen.getByTestId('volume-up-btn'));
    expect(useAlarmStore.getState().alarmVolume).toBe(90);

    await user.press(screen.getByTestId('volume-down-btn'));
    expect(useAlarmStore.getState().alarmVolume).toBe(80);

    await user.press(screen.getByTestId('volume-preset-50'));
    expect(useAlarmStore.getState().alarmVolume).toBe(50);
  });

  it('renders theme mode buttons and allows selection', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByTestId('theme-mode-system-btn')).toBeTruthy();
    expect(screen.getByTestId('theme-mode-light-btn')).toBeTruthy();
    expect(screen.getByTestId('theme-mode-dark-btn')).toBeTruthy();
  });
});
