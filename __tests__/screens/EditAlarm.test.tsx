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

  it('adjusts hours and minutes using stepper buttons', async () => {
    const user = userEvent.setup();
    await render(<EditAlarmScreen />);

    // Initial is 07:00
    expect(screen.getByTestId('hours-display').props.children).toBe('07');

    await user.press(screen.getByTestId('hour-up'));
    expect(screen.getByTestId('hours-display').props.children).toBe('08');

    await user.press(screen.getByTestId('minute-up'));
    expect(screen.getByTestId('minutes-display').props.children).toBe('05');
  });

  it('saves new alarm to store and navigates back', async () => {
    const user = userEvent.setup();
    const { router } = require('expo-router');

    await render(<EditAlarmScreen />);

    await user.type(screen.getByTestId('alarm-label-input'), 'Morning Alarm');
    await user.press(screen.getByTestId('save-alarm-button'));

    const { alarms } = useAlarmStore.getState();
    expect(alarms).toHaveLength(1);
    expect(alarms[0].label).toBe('Morning Alarm');
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
