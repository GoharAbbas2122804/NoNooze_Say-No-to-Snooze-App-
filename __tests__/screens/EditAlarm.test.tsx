import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import EditAlarmScreen from '../../src/app/edit';
import { useAlarmStore } from '../../src/store/alarm-store';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

describe('EditAlarmScreen', () => {
  beforeEach(() => {
    useAlarmStore.setState({ alarms: [], activeAlarmId: null });
    jest.clearAllMocks();
  });

  it('renders time displays, label input, and save button', async () => {
    await render(<EditAlarmScreen />);

    expect(screen.getByTestId('hours-display')).toBeTruthy();
    expect(screen.getByTestId('minutes-display')).toBeTruthy();
    expect(screen.getByTestId('alarm-label-input')).toBeTruthy();
    expect(screen.getByTestId('save-alarm-button')).toBeTruthy();
  });

  it('renders visible repeat schedule options and presets', async () => {
    const user = userEvent.setup();
    await render(<EditAlarmScreen />);

    expect(screen.getByTestId('repeat-summary-text')).toBeTruthy();
    expect(screen.getByTestId('repeat-preset-once')).toBeTruthy();
    expect(screen.getByTestId('repeat-preset-weekdays')).toBeTruthy();
    expect(screen.getByTestId('repeat-preset-weekends')).toBeTruthy();
    expect(screen.getByTestId('repeat-preset-everyday')).toBeTruthy();

    // Tap weekdays preset
    await user.press(screen.getByTestId('repeat-preset-weekdays'));
    expect(screen.getByText('Weekdays (Mon–Fri)')).toBeTruthy();

    // Toggle Saturday
    await user.press(screen.getByTestId('repeat-day-6'));
    expect(screen.getByTestId('repeat-summary-text')).toBeTruthy();
  });

  it('allows selecting alarm sound from modal', async () => {
    const user = userEvent.setup();
    await render(<EditAlarmScreen />);

    expect(screen.getByTestId('sound-select-btn')).toBeTruthy();

    // Open sound modal
    await user.press(screen.getByTestId('sound-select-btn'));
    expect(screen.getByText('Choose Alarm Sound')).toBeTruthy();
    expect(screen.getByTestId('sound-option-Radiant Radar')).toBeTruthy();

    // Pick Radiant Radar
    await user.press(screen.getByTestId('sound-option-Radiant Radar'));
    expect(screen.getByTestId('selected-sound-name')).toBeTruthy();
  });

  it('saves new alarm to store with label, repeat, and sound', async () => {
    const user = userEvent.setup();
    const { router } = require('expo-router');

    await render(<EditAlarmScreen />);

    await user.type(screen.getByTestId('alarm-label-input'), 'Morning Alarm');
    await user.press(screen.getByTestId('repeat-preset-everyday'));
    await user.press(screen.getByTestId('save-alarm-button'));

    const { alarms } = useAlarmStore.getState();
    expect(alarms).toHaveLength(1);
    expect(alarms[0].label).toBe('Morning Alarm');
    expect(alarms[0].days).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(router.back).toHaveBeenCalled();
  });

  it('allows toggling between AM and PM in 12-hour mode and saves canonical 24h time', async () => {
    const user = userEvent.setup();
    useAlarmStore.setState({ timeFormat: '12h' });

    await render(<EditAlarmScreen />);

    // Period buttons should be visible
    expect(screen.getByTestId('period-am')).toBeTruthy();
    expect(screen.getByTestId('period-pm')).toBeTruthy();

    // Switch to PM (07:00 PM -> 19:00 canonical)
    await user.press(screen.getByTestId('period-pm'));
    await user.press(screen.getByTestId('save-alarm-button'));

    const { alarms } = useAlarmStore.getState();
    expect(alarms).toHaveLength(1);
    expect(alarms[0].time).toBe('19:00');
  });

  it('hides AM/PM selector when 24h format is active', async () => {
    useAlarmStore.setState({ timeFormat: '24h' });

    await render(<EditAlarmScreen />);

    expect(screen.queryByTestId('period-am')).toBeNull();
    expect(screen.queryByTestId('period-pm')).toBeNull();
  });
});
