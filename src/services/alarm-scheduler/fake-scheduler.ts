import { AlarmScheduler, PermissionStatus } from './types';
import { Alarm } from '../../domain/types';

export class FakeAlarmScheduler implements AlarmScheduler {
  scheduledAlarms: Map<string, Alarm> = new Map();
  isRinging = false;
  permissions: PermissionStatus = {
    exactAlarms: true,
    notifications: true,
    fullScreenIntent: true,
    batteryOptimizationIgnored: true,
  };

  async schedule(alarm: Alarm): Promise<void> {
    if (alarm.enabled) {
      this.scheduledAlarms.set(alarm.id, alarm);
    } else {
      this.scheduledAlarms.delete(alarm.id);
    }
  }

  async cancel(alarmId: string): Promise<void> {
    this.scheduledAlarms.delete(alarmId);
  }

  async rescheduleAll(alarms: Alarm[]): Promise<void> {
    this.scheduledAlarms.clear();
    for (const alarm of alarms) {
      if (alarm.enabled) {
        this.scheduledAlarms.set(alarm.id, alarm);
      }
    }
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    return { ...this.permissions };
  }

  async requestPermissions(): Promise<PermissionStatus> {
    return { ...this.permissions };
  }

  async openExactAlarmSettings(): Promise<void> {}

  async openBatteryOptimizationSettings(): Promise<void> {}

  scheduledWatchdogs: Set<string> = new Set();

  async stopRinging(alarmId?: string): Promise<void> {
    this.isRinging = false;
    if (alarmId) {
      this.scheduledWatchdogs.delete(alarmId);
    }
  }

  async scheduleWatchdog(alarmId: string): Promise<void> {
    this.scheduledWatchdogs.add(alarmId);
  }
}
