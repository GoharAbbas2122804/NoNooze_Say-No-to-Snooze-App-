import { useAlarmStore } from '../../src/store/alarm-store';
import { Step } from '../../src/domain/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Alarm Store (Zustand)', () => {
  const mathStep: Step = {
    methodId: 'math',
    target: 3,
  };

  beforeEach(() => {
    useAlarmStore.setState({ alarms: [], activeAlarmId: null });
  });

  it('starts with empty alarms list', () => {
    const { alarms } = useAlarmStore.getState();
    expect(alarms).toEqual([]);
  });

  it('adds a valid alarm successfully and generates unique id', () => {
    const result = useAlarmStore.getState().addAlarm({
      time: '08:00',
      days: [1, 2, 3],
      label: 'Gym Time',
      enabled: true,
      sound: 'default',
      steps: [mathStep],
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();

    const { alarms } = useAlarmStore.getState();
    expect(alarms).toHaveLength(1);
    expect(alarms[0].label).toBe('Gym Time');
    expect(alarms[0].id).toBe(result.id);
  });

  it('rejects adding an invalid alarm and returns errors', () => {
    const result = useAlarmStore.getState().addAlarm({
      time: 'invalid-time',
      days: [],
      label: 'Bad Alarm',
      enabled: true,
      sound: 'default',
      steps: [],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);

    const { alarms } = useAlarmStore.getState();
    expect(alarms).toHaveLength(0);
  });

  it('updates an existing alarm', () => {
    const addResult = useAlarmStore.getState().addAlarm({
      time: '07:00',
      days: [],
      label: 'Wake Up',
      enabled: true,
      sound: 'default',
      steps: [mathStep],
    });

    const alarmId = addResult.id!;
    const updateResult = useAlarmStore.getState().updateAlarm(alarmId, {
      time: '07:30',
      label: 'Wake Up Later',
    });

    expect(updateResult.success).toBe(true);
    const updated = useAlarmStore.getState().getAlarmById(alarmId);
    expect(updated?.time).toBe('07:30');
    expect(updated?.label).toBe('Wake Up Later');
  });

  it('toggles an alarm enabled state', () => {
    const addResult = useAlarmStore.getState().addAlarm({
      time: '07:00',
      days: [],
      label: 'Wake Up',
      enabled: true,
      sound: 'default',
      steps: [mathStep],
    });

    const alarmId = addResult.id!;
    useAlarmStore.getState().toggleAlarm(alarmId);
    expect(useAlarmStore.getState().getAlarmById(alarmId)?.enabled).toBe(false);

    useAlarmStore.getState().toggleAlarm(alarmId);
    expect(useAlarmStore.getState().getAlarmById(alarmId)?.enabled).toBe(true);
  });

  it('deletes an alarm by id', () => {
    const addResult = useAlarmStore.getState().addAlarm({
      time: '07:00',
      days: [],
      label: 'Wake Up',
      enabled: true,
      sound: 'default',
      steps: [mathStep],
    });

    const alarmId = addResult.id!;
    expect(useAlarmStore.getState().alarms).toHaveLength(1);

    useAlarmStore.getState().deleteAlarm(alarmId);
    expect(useAlarmStore.getState().alarms).toHaveLength(0);
  });

  it('sets and clears activeAlarmId', () => {
    useAlarmStore.getState().setActiveAlarmId('test-123');
    expect(useAlarmStore.getState().activeAlarmId).toBe('test-123');

    useAlarmStore.getState().setActiveAlarmId(null);
    expect(useAlarmStore.getState().activeAlarmId).toBeNull();
  });
});
