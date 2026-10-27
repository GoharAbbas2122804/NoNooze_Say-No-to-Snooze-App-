import notifee, {
  AndroidImportance,
  AndroidCategory,
  TriggerType,
  TimestampTrigger,
} from 'react-native-notify-kit';
import { AlarmScheduler, PermissionStatus } from './types';
import { Alarm } from '../../domain/types';
import { getNextTriggerDate } from '../../domain/next-trigger';
import { APP_NAME } from '../../constants/app';

const ALARM_CHANNEL_ID = 'nonooze_alarms';

export class AlarmSchedulerService implements AlarmScheduler {
  private channelInitialized = false;

  private async ensureChannel(): Promise<string> {
    if (this.channelInitialized) {
      return ALARM_CHANNEL_ID;
    }

    await notifee.createChannel({
      id: ALARM_CHANNEL_ID,
      name: `${APP_NAME} Alarms`,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      bypassDnd: true,
    });

    this.channelInitialized = true;
    return ALARM_CHANNEL_ID;
  }

  async schedule(alarm: Alarm): Promise<void> {
    const channelId = await this.ensureChannel();

    // Cancel previous instance if any
    await this.cancel(alarm.id);

    if (!alarm.enabled) {
      return;
    }

    const triggerDate = getNextTriggerDate(alarm);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    await notifee.createTriggerNotification(
      {
        id: alarm.id,
        title: alarm.label ? `${APP_NAME}: ${alarm.label}` : APP_NAME,
        body: 'Time to wake up! Complete challenges to dismiss.',
        data: {
          alarmId: alarm.id,
        },
        android: {
          channelId,
          category: AndroidCategory.ALARM,
          importance: AndroidImportance.HIGH,
          fullScreenAction: {
            id: 'open_ringing',
            launchActivity: 'default',
          },
          pressAction: {
            id: 'open_ringing',
            launchActivity: 'default',
          },
          asForegroundService: true,
          ongoing: true,
          autoCancel: false,
          color: '#70F464',
        },
      },
      trigger
    );
  }

  async cancel(alarmId: string): Promise<void> {
    try {
      await notifee.cancelTriggerNotification(alarmId);
      await notifee.cancelNotification(alarmId);
      // Cancel watchdog if scheduled
      await notifee.cancelTriggerNotification(`${alarmId}_watchdog`);
      await notifee.cancelNotification(`${alarmId}_watchdog`);
    } catch {
      // Ignore errors when notification does not exist
    }
  }

  async rescheduleAll(alarms: Alarm[]): Promise<void> {
    for (const alarm of alarms) {
      await this.schedule(alarm);
    }
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    const settings = await notifee.getNotificationSettings();
    let isBatteryOptIgnored = true;
    try {
      const isOptEnabled = await notifee.isBatteryOptimizationEnabled();
      isBatteryOptIgnored = !isOptEnabled;
    } catch {
      isBatteryOptIgnored = true;
    }

    return {
      notifications: settings.authorizationStatus === 1,
      exactAlarms: settings.android?.alarm === 1,
      fullScreenIntent: true,
      batteryOptimizationIgnored: isBatteryOptIgnored,
    };
  }

  async requestPermissions(): Promise<PermissionStatus> {
    await notifee.requestPermission();
    return this.getPermissionStatus();
  }

  async openExactAlarmSettings(): Promise<void> {
    await notifee.openAlarmPermissionSettings();
  }

  async openBatteryOptimizationSettings(): Promise<void> {
    await notifee.openBatteryOptimizationSettings();
  }

  async stopRinging(): Promise<void> {
    try {
      await notifee.stopForegroundService();
    } catch {
      // Ignore if not currently in foreground service
    }
  }
}

let schedulerInstance: AlarmScheduler | null = null;

export function getAlarmScheduler(): AlarmScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AlarmSchedulerService();
  }
  return schedulerInstance;
}
