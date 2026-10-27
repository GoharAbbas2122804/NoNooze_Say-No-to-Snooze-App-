import { Alarm, DayOfWeek } from './types';

/**
 * Calculates the exact next Date when the given alarm should trigger.
 * Handles one-time alarms, repeating alarms, week boundary wrap-around, and midnight rollover.
 */
export function getNextTriggerDate(alarm: Alarm, now: Date = new Date()): Date {
  const [hoursStr, minutesStr] = alarm.time.split(':');
  const targetHours = parseInt(hoursStr, 10);
  const targetMinutes = parseInt(minutesStr, 10);

  const candidate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    targetHours,
    targetMinutes,
    0,
    0
  );

  // One-time alarm
  if (!alarm.days || alarm.days.length === 0) {
    if (candidate.getTime() > now.getTime()) {
      return candidate;
    }
    candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  // Repeating alarm
  const enabledDays = new Set<number>(alarm.days);

  for (let offset = 0; offset <= 7; offset++) {
    const currentDayOfWeek = ((now.getDay() + offset) % 7) as DayOfWeek;

    if (enabledDays.has(currentDayOfWeek)) {
      const scheduledDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset,
        targetHours,
        targetMinutes,
        0,
        0
      );

      if (scheduledDate.getTime() > now.getTime()) {
        return scheduledDate;
      }
    }
  }

  // Fallback to next week
  candidate.setDate(candidate.getDate() + 7);
  return candidate;
}
