import { getNextTriggerDate } from '../../src/domain/next-trigger';
import { Alarm } from '../../src/domain/types';

describe('getNextTriggerDate', () => {
  const baseAlarm: Alarm = {
    id: 'test-1',
    time: '07:30',
    days: [],
    label: 'Test Alarm',
    enabled: true,
    sound: 'default',
    steps: [{ methodId: 'math', target: 3 }],
  };

  describe('One-time alarms (days is empty)', () => {
    it('schedules for today if target time is in the future', () => {
      // 06:00 on Wednesday, Oct 28, 2026
      const now = new Date(2026, 9, 28, 6, 0, 0);
      const alarm = { ...baseAlarm, time: '07:30', days: [] };

      const trigger = getNextTriggerDate(alarm, now);
      expect(trigger.getFullYear()).toBe(2026);
      expect(trigger.getMonth()).toBe(9);
      expect(trigger.getDate()).toBe(28);
      expect(trigger.getHours()).toBe(7);
      expect(trigger.getMinutes()).toBe(30);
      expect(trigger.getSeconds()).toBe(0);
    });

    it('schedules for tomorrow if target time is in the past today', () => {
      // 08:00 on Wednesday, Oct 28, 2026
      const now = new Date(2026, 9, 28, 8, 0, 0);
      const alarm = { ...baseAlarm, time: '07:30', days: [] };

      const trigger = getNextTriggerDate(alarm, now);
      expect(trigger.getFullYear()).toBe(2026);
      expect(trigger.getMonth()).toBe(9);
      expect(trigger.getDate()).toBe(29);
      expect(trigger.getHours()).toBe(7);
      expect(trigger.getMinutes()).toBe(30);
    });

    it('schedules for tomorrow if target time is exact same minute', () => {
      const now = new Date(2026, 9, 28, 7, 30, 15);
      const alarm = { ...baseAlarm, time: '07:30', days: [] };

      const trigger = getNextTriggerDate(alarm, now);
      expect(trigger.getDate()).toBe(29);
      expect(trigger.getHours()).toBe(7);
      expect(trigger.getMinutes()).toBe(30);
    });
  });

  describe('Repeating alarms', () => {
    it('schedules for today if today is enabled and time is in the future', () => {
      // Oct 28, 2026 is a Wednesday (day index 3)
      const now = new Date(2026, 9, 28, 6, 0, 0);
      expect(now.getDay()).toBe(3);

      const alarm = { ...baseAlarm, time: '07:30', days: [1, 3, 5] }; // Mon, Wed, Fri
      const trigger = getNextTriggerDate(alarm, now);

      expect(trigger.getDate()).toBe(28);
      expect(trigger.getDay()).toBe(3);
      expect(trigger.getHours()).toBe(7);
      expect(trigger.getMinutes()).toBe(30);
    });

    it('schedules for next enabled day if time has already passed today', () => {
      // 10:00 on Wednesday Oct 28, 2026 (day 3)
      const now = new Date(2026, 9, 28, 10, 0, 0);
      const alarm = { ...baseAlarm, time: '07:30', days: [1, 3, 5] }; // Mon, Wed, Fri

      const trigger = getNextTriggerDate(alarm, now);
      // Next is Friday (day 5), Oct 30
      expect(trigger.getDate()).toBe(30);
      expect(trigger.getDay()).toBe(5);
      expect(trigger.getHours()).toBe(7);
      expect(trigger.getMinutes()).toBe(30);
    });

    it('wraps around to next week across Saturday to Monday', () => {
      // Saturday Oct 31, 2026 (day 6) at 12:00
      const now = new Date(2026, 9, 31, 12, 0, 0);
      expect(now.getDay()).toBe(6);

      const alarm = { ...baseAlarm, time: '07:00', days: [1, 2] }; // Mon, Tue
      const trigger = getNextTriggerDate(alarm, now);

      // Next is Monday Nov 2, 2026 (day 1)
      expect(trigger.getFullYear()).toBe(2026);
      expect(trigger.getMonth()).toBe(10); // Nov
      expect(trigger.getDate()).toBe(2);
      expect(trigger.getDay()).toBe(1);
    });

    it('handles midnight edge case: 23:59 now and alarm at 00:01', () => {
      const now = new Date(2026, 9, 28, 23, 59, 0);
      const alarm = { ...baseAlarm, time: '00:01', days: [] };

      const trigger = getNextTriggerDate(alarm, now);
      expect(trigger.getDate()).toBe(29);
      expect(trigger.getHours()).toBe(0);
      expect(trigger.getMinutes()).toBe(1);
    });
  });
});
