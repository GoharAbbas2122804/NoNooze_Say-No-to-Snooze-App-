/**
 * useAlarmTheme — returns 'dark' when:
 *   a) system is dark, OR
 *   b) local time is 21:00–07:00 AND darkAtNight setting is on.
 * Inject getNow for testing.
 */
import { useColorScheme } from 'react-native';
import { useAlarmStore } from '../../store/alarm-store';

type AlarmThemeMode = 'dark' | 'light';

interface UseAlarmThemeOptions {
  getNow?: () => Date;
}

export function useAlarmTheme(opts?: UseAlarmThemeOptions): AlarmThemeMode {
  const scheme = useColorScheme();
  const darkAtNight = useAlarmStore.getState().darkAtNight ?? true;

  if (scheme === 'dark') return 'dark';

  if (darkAtNight) {
    const now = opts?.getNow ? opts.getNow() : new Date();
    const h = now.getHours();
    if (h >= 21 || h < 7) return 'dark';
  }

  return 'light';
}
