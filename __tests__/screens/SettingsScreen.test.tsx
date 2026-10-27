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
});
