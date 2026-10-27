module.exports = {
  createChannel: jest.fn().mockResolvedValue('alarm_channel'),
  createTriggerNotification: jest.fn().mockResolvedValue('notification_id'),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
  cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
  getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
  getNotificationSettings: jest.fn().mockResolvedValue({
    authorizationStatus: 1,
    android: {
      alarm: 1,
    },
  }),
  requestPermission: jest.fn().mockResolvedValue({
    authorizationStatus: 1,
  }),
  openAlarmPermissionSettings: jest.fn().mockResolvedValue(undefined),
  openBatteryOptimizationSettings: jest.fn().mockResolvedValue(undefined),
  isBatteryOptimizationEnabled: jest.fn().mockResolvedValue(false),
  stopForegroundService: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
  },
  AndroidCategory: {
    ALARM: 'alarm',
  },
  TriggerType: {
    TIMESTAMP: 0,
  },
  TimeUnit: {
    MINUTES: 'MINUTES',
  },
  default: {
    createChannel: jest.fn().mockResolvedValue('alarm_channel'),
    createTriggerNotification: jest.fn().mockResolvedValue('notification_id'),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
    getNotificationSettings: jest.fn().mockResolvedValue({
      authorizationStatus: 1,
      android: { alarm: 1 },
    }),
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    openAlarmPermissionSettings: jest.fn().mockResolvedValue(undefined),
    openBatteryOptimizationSettings: jest.fn().mockResolvedValue(undefined),
    isBatteryOptimizationEnabled: jest.fn().mockResolvedValue(false),
    stopForegroundService: jest.fn().mockResolvedValue(undefined),
    AndroidImportance: { HIGH: 4, DEFAULT: 3 },
    AndroidCategory: { ALARM: 'alarm' },
    TriggerType: { TIMESTAMP: 0 },
  },
};
