import { AlarmSchedulerService } from '../../src/services/alarm-scheduler';
import notifee from 'react-native-notify-kit';
import { Alarm } from '../../src/domain/types';

describe('AlarmSchedulerService (with notify-kit mock)', () => {
  let service: AlarmSchedulerService;

  const testAlarm: Alarm = {
    id: 'alarm-prod-1',
    time: '06:45',
    days: [1, 2, 3, 4, 5],
    label: 'Morning Run',
    enabled: true,
    sound: 'default',
    steps: [{ methodId: 'math', target: 3 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlarmSchedulerService();
  });

  it('creates channel and schedules trigger notification for enabled alarm', async () => {
    await service.schedule(testAlarm);

    expect(notifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'nonooze_alarms',
        sound: 'default',
        vibration: true,
      })
    );

    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'alarm-prod-1',
        title: expect.stringContaining('Morning Run'),
        android: expect.objectContaining({
          category: 'alarm',
          fullScreenAction: expect.any(Object),
          asForegroundService: true,
        }),
      }),
      expect.objectContaining({
        alarmManager: { allowWhileIdle: true },
      })
    );
  });

  it('cancels alarm notification on cancel', async () => {
    await service.cancel('alarm-prod-1');

    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('alarm-prod-1');
    expect(notifee.cancelNotification).toHaveBeenCalledWith('alarm-prod-1');
  });

  it('stops foreground service on stopRinging', async () => {
    await service.stopRinging();
    expect(notifee.stopForegroundService).toHaveBeenCalled();
  });
});
