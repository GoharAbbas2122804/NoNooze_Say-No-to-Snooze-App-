import { Alarm } from '../../domain/types';

export interface PermissionStatus {
  exactAlarms: boolean;
  notifications: boolean;
  fullScreenIntent: boolean;
  batteryOptimizationIgnored: boolean;
}

export interface AlarmScheduler {
  schedule(alarm: Alarm): Promise<void>;
  cancel(alarmId: string): Promise<void>;
  rescheduleAll(alarms: Alarm[]): Promise<void>;
  getPermissionStatus(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
  openExactAlarmSettings(): Promise<void>;
  openBatteryOptimizationSettings(): Promise<void>;
  stopRinging(): Promise<void>;
}
