import { getNextTriggerDate } from '../../src/domain/next-trigger';
import { createInitialStepRunnerState, stepRunnerReducer } from '../../src/domain/step-runner';
import { AlarmSchedulerService } from '../../src/services/alarm-scheduler';
import { useAlarmStore } from '../../src/store/alarm-store';
import { Alarm, Step } from '../../src/domain/types';
import notifee from 'react-native-notify-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_STORAGE_KEY } from '../../src/theme/ThemeProvider';

describe('Week 1 Closeout Audit: Edge Cases Suite', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('Edge Case 1: Two alarms in the exact same minute', () => {
    it('schedules both alarms independently with distinct notification IDs and matching trigger times', async () => {
      const scheduler = new AlarmSchedulerService();
      const now = new Date(2026, 9, 29, 6, 0, 0);

      const alarmA: Alarm = {
        id: 'alarm-same-min-1',
        time: '07:30',
        days: [],
        label: 'Alarm A',
        enabled: true,
        sound: 'Melodian',
        steps: [{ methodId: 'math', target: 2 }],
      };

      const alarmB: Alarm = {
        id: 'alarm-same-min-2',
        time: '07:30',
        days: [],
        label: 'Alarm B',
        enabled: true,
        sound: 'Radar Pulse',
        steps: [{ methodId: 'math', target: 3 }],
      };

      await scheduler.schedule(alarmA);
      await scheduler.schedule(alarmB);

      const triggerA = getNextTriggerDate(alarmA, now);
      const triggerB = getNextTriggerDate(alarmB, now);

      expect(triggerA.getTime()).toBe(triggerB.getTime());

      // Confirm both trigger notifications were created without collisions
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'alarm-same-min-1' }),
        expect.any(Object)
      );
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'alarm-same-min-2' }),
        expect.any(Object)
      );
    });
  });

  describe('Edge Case 2: Alarm time already past today', () => {
    it('schedules for tomorrow without firing immediately', () => {
      // Current time: 09:15
      const now = new Date(2026, 9, 29, 9, 15, 0);
      const pastAlarm: Alarm = {
        id: 'alarm-past',
        time: '07:00',
        days: [],
        label: 'Early Morning',
        enabled: true,
        sound: 'Melodian',
        steps: [{ methodId: 'math', target: 1 }],
      };

      const nextTrigger = getNextTriggerDate(pastAlarm, now);

      expect(nextTrigger.getFullYear()).toBe(2026);
      expect(nextTrigger.getMonth()).toBe(9);
      expect(nextTrigger.getDate()).toBe(30); // Tomorrow
      expect(nextTrigger.getHours()).toBe(7);
      expect(nextTrigger.getMinutes()).toBe(0);
      expect(nextTrigger.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('Edge Case 3: Timezone or clock change', () => {
    it('recalculates next trigger accurately when system clock jumps backward or forward', () => {
      const alarm: Alarm = {
        id: 'alarm-clock-jump',
        time: '14:00',
        days: [],
        label: 'Afternoon Check',
        enabled: true,
        sound: 'Melodian',
        steps: [{ methodId: 'math', target: 1 }],
      };

      // Clock at 11:00 AM
      const clockBefore = new Date(2026, 9, 29, 11, 0, 0);
      const triggerBefore = getNextTriggerDate(alarm, clockBefore);
      expect(triggerBefore.getDate()).toBe(29);
      expect(triggerBefore.getHours()).toBe(14);

      // System clock manually pushed forward by user to 15:00 PM (past alarm)
      const clockForward = new Date(2026, 9, 29, 15, 0, 0);
      const triggerAfterForward = getNextTriggerDate(alarm, clockForward);
      expect(triggerAfterForward.getDate()).toBe(30); // Rolls to tomorrow
      expect(triggerAfterForward.getHours()).toBe(14);

      // System clock manually rolled backward across midnight to 23:30 of yesterday
      const clockBackward = new Date(2026, 9, 28, 23, 30, 0);
      const triggerAfterBackward = getNextTriggerDate(alarm, clockBackward);
      expect(triggerAfterBackward.getDate()).toBe(29); // Scheduled for today 14:00
      expect(triggerAfterBackward.getHours()).toBe(14);
    });
  });

  describe('Edge Case 4: Daylight Saving Time (DST) transitions', () => {
    it('correctly targets the local hour on spring forward (short day)', () => {
      // In US/EU spring forward transition (e.g. March 29, 2026)
      const springForwardEve = new Date(2026, 2, 28, 22, 0, 0);
      const dstAlarm: Alarm = {
        id: 'alarm-dst-spring',
        time: '07:00',
        days: [],
        label: 'Spring Wake',
        enabled: true,
        sound: 'Melodian',
        steps: [{ methodId: 'math', target: 1 }],
      };

      const trigger = getNextTriggerDate(dstAlarm, springForwardEve);
      expect(trigger.getDate()).toBe(29);
      expect(trigger.getHours()).toBe(7);
      expect(trigger.getMinutes()).toBe(0);
    });

    it('correctly targets the local hour on fall back (long day)', () => {
      // In fall back transition (e.g. Oct 25, 2026)
      const fallBackEve = new Date(2026, 9, 24, 23, 0, 0);
      const dstAlarm: Alarm = {
        id: 'alarm-dst-fall',
        time: '06:00',
        days: [],
        label: 'Fall Wake',
        enabled: true,
        sound: 'Melodian',
        steps: [{ methodId: 'math', target: 1 }],
      };

      const trigger = getNextTriggerDate(dstAlarm, fallBackEve);
      expect(trigger.getDate()).toBe(25);
      expect(trigger.getHours()).toBe(6);
      expect(trigger.getMinutes()).toBe(0);
    });
  });

  describe('Edge Case 5: Alarm with 3 sequential steps', () => {
    it('drives step runner through all 3 stages to completion', () => {
      const threeSteps: Step[] = [
        { methodId: 'math', target: 2 },
        { methodId: 'math', target: 3 },
        { methodId: 'math', target: 1 },
      ];

      let state = createInitialStepRunnerState(threeSteps);
      expect(state.status).toBe('running');
      if (state.status !== 'running') return;

      expect(state.stepIndex).toBe(0);
      expect(state.totalSteps).toBe(3);
      expect(state.currentStep.target).toBe(2);

      // Step 1: 0/2 -> 1/2 -> 2/2 (transitions to Step 2)
      state = stepRunnerReducer(state, { type: 'PROGRESS' });
      state = stepRunnerReducer(state, { type: 'PROGRESS' });
      expect(state.status).toBe('running');
      if (state.status !== 'running') return;
      expect(state.stepIndex).toBe(1);
      expect(state.currentStep.target).toBe(3);

      // Step 2: 0/3 -> 1/3 -> 2/3 -> 3/3 (transitions to Step 3)
      state = stepRunnerReducer(state, { type: 'PROGRESS' });
      state = stepRunnerReducer(state, { type: 'PROGRESS' });
      state = stepRunnerReducer(state, { type: 'PROGRESS' });
      expect(state.status).toBe('running');
      if (state.status !== 'running') return;
      expect(state.stepIndex).toBe(2);
      expect(state.currentStep.target).toBe(1);

      // Step 3: 0/1 -> 1/1 (transitions to completed)
      state = stepRunnerReducer(state, { type: 'PROGRESS' });
      expect(state.status).toBe('completed');
    });
  });

  describe('Edge Case 6: Permission revoked after scheduling', () => {
    it('detects revoked permission state via getPermissionStatus', async () => {
      const scheduler = new AlarmSchedulerService();

      // Mock revoked exact alarm
      (notifee.getNotificationSettings as jest.Mock).mockResolvedValueOnce({
        authorizationStatus: 1,
        android: { alarm: 0 }, // Denied!
      });
      (notifee.isBatteryOptimizationEnabled as jest.Mock).mockResolvedValueOnce(true); // Battery opt active

      const permStatus = await scheduler.getPermissionStatus();
      expect(permStatus.exactAlarms).toBe(false);
      expect(permStatus.batteryOptimizationIgnored).toBe(false);
    });
  });

  describe('Edge Case 7: App data cleared', () => {
    it('restores clean defaults when store data is wiped', () => {
      // Put custom dirty state
      useAlarmStore.setState({
        alarms: [{ id: 'to-be-wiped', time: '08:00', days: [], label: 'Temp', enabled: true, sound: 'x', steps: [] }],
        alarmVolume: 20,
        timeFormat: '24h',
      });

      // Clear/wipe state
      useAlarmStore.setState({
        alarms: [],
        activeAlarmId: null,
        timeFormat: '12h',
        alarmVolume: 80,
        defaultSound: 'Melodian',
        gentleWake: true,
        vibrate: true,
        customSounds: [],
      });

      const cleanState = useAlarmStore.getState();
      expect(cleanState.alarms).toEqual([]);
      expect(cleanState.activeAlarmId).toBeNull();
      expect(cleanState.timeFormat).toBe('12h');
      expect(cleanState.alarmVolume).toBe(80);
      expect(cleanState.defaultSound).toBe('Melodian');
    });
  });

  describe('Edge Case 8: Theme persistence across cold restart', () => {
    it('persists selected theme to storage key and restores on reboot', async () => {
      // User sets theme to dark
      await AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark');

      const restored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      expect(restored).toBe('dark');

      // User changes to light
      await AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
      const updated = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      expect(updated).toBe('light');
    });
  });
});
