/**
 * Time format utility for converting between 24-hour canonical time ('HH:mm')
 * and user-facing 12-hour/24-hour presentations with AM/PM.
 */

export type TimeFormat = '12h' | '24h';

export interface TimeParts12 {
  hours: number; // 1 to 12
  minutes: number; // 0 to 59
  ampm: 'AM' | 'PM';
  hoursString: string; // e.g. '07'
  minutesString: string; // e.g. '00'
}

/**
 * Convert 24-hour 'HH:mm' string into 12-hour parts (1-12, 0-59, AM/PM).
 */
export function parseTo12Hour(time24: string): TimeParts12 {
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;

  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hours12 = h % 12;
  if (hours12 === 0) hours12 = 12;

  return {
    hours: hours12,
    minutes: m,
    ampm,
    hoursString: hours12.toString().padStart(2, '0'),
    minutesString: m.toString().padStart(2, '0'),
  };
}

/**
 * Convert 12-hour parts back to canonical 24-hour 'HH:mm' string.
 */
export function formatTo24Hour(
  hours12: number,
  minutes: number,
  ampm: 'AM' | 'PM'
): string {
  let h24 = hours12 % 12;
  if (ampm === 'PM') {
    h24 += 12;
  }
  return `${h24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format a 24-hour 'HH:mm' alarm time for display based on preference.
 */
export function formatDisplayTime(
  time24: string,
  format: TimeFormat
): { time: string; ampm?: string; formatted: string } {
  if (format === '24h') {
    return {
      time: time24,
      formatted: time24,
    };
  }

  const parts = parseTo12Hour(time24);
  const formatted = `${parts.hoursString}:${parts.minutesString} ${parts.ampm}`;
  return {
    time: `${parts.hoursString}:${parts.minutesString}`,
    ampm: parts.ampm,
    formatted,
  };
}
