import { FakeAlarmScheduler } from '../../src/services/alarm-scheduler/fake-scheduler';
import { Alarm } from '../../src/domain/types';

describe('FakeAlarmScheduler Contract', () => {
  let scheduler: FakeAlarmScheduler;

  const testAlarm: Alarm = {
    id: 'alarm-1',
    time: '07:30',
    days: [1, 2, 3],
    label: 'Test',
    enabled: true,
    sound: 'default',
    steps: [{ methodId: 'math', target: 3 }],
  };

  beforeEach(() => {
    scheduler = new FakeAlarmScheduler();
  });

  it('schedules enabled alarms and cancels them when disabled', async () => {
    await scheduler.schedule(testAlarm);
    expect(scheduler.scheduledAlarms.has('alarm-1')).toBe(true);

    await scheduler.schedule({ ...testAlarm, enabled: false });
    expect(scheduler.scheduledAlarms.has('alarm-1')).toBe(false);
  });

  it('cancels scheduled alarm by id', async () => {
    await scheduler.schedule(testAlarm);
    expect(scheduler.scheduledAlarms.size).toBe(1);

    await scheduler.cancel('alarm-1');
    expect(scheduler.scheduledAlarms.size).toBe(0);
  });

  it('reschedules all alarms', async () => {
    const alarms: Alarm[] = [
      testAlarm,
      { ...testAlarm, id: 'alarm-2', enabled: false },
      { ...testAlarm, id: 'alarm-3', enabled: true },
    ];

    await scheduler.rescheduleAll(alarms);
    expect(scheduler.scheduledAlarms.size).toBe(2);
    expect(scheduler.scheduledAlarms.has('alarm-1')).toBe(true);
    expect(scheduler.scheduledAlarms.has('alarm-2')).toBe(false);
    expect(scheduler.scheduledAlarms.has('alarm-3')).toBe(true);
  });

  it('returns valid permission status', async () => {
    const status = await scheduler.getPermissionStatus();
    expect(status.exactAlarms).toBe(true);
    expect(status.notifications).toBe(true);
    expect(status.fullScreenIntent).toBe(true);
    expect(status.batteryOptimizationIgnored).toBe(true);
  });
});
