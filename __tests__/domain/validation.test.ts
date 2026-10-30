import { validateAlarm } from '../../src/domain/validation';
import { Alarm, Step } from '../../src/domain/types';

describe('validateAlarm', () => {
  const validMathStep: Step = {
    methodId: 'math',
    target: 3,
  };

  const validAlarm: Alarm = {
    id: 'test-alarm-1',
    time: '07:30',
    days: [1, 2, 3, 4, 5],
    label: 'Morning Workout',
    enabled: true,
    sound: 'default',
    steps: [validMathStep],
  };

  it('validates a correct alarm with 1 math step', () => {
    const result = validateAlarm(validAlarm);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an alarm with empty steps array', () => {
    const result = validateAlarm({ ...validAlarm, steps: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Alarm must have at least one dismissal step.');
  });

  it('validates math target range: rejects target < 1', () => {
    const result = validateAlarm({
      ...validAlarm,
      steps: [{ methodId: 'math', target: 0 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Math challenge target must be between 1 and 10 problems.');
  });

  it('validates math target range: rejects target > 10', () => {
    const result = validateAlarm({
      ...validAlarm,
      steps: [{ methodId: 'math', target: 11 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Math challenge target must be between 1 and 10 problems.');
  });

  it('validates pushups/situps target range: rejects target < 5 or > 50', () => {
    const lowResult = validateAlarm({
      ...validAlarm,
      steps: [{ methodId: 'pushups', target: 4 }],
    });
    expect(lowResult.valid).toBe(false);
    expect(lowResult.errors).toContain('Pushups target must be between 5 and 50 reps.');

    const highResult = validateAlarm({
      ...validAlarm,
      steps: [{ methodId: 'situps', target: 51 }],
    });
    expect(highResult.valid).toBe(false);
    expect(highResult.errors).toContain('Situps target must be between 5 and 50 reps.');
  });

  it('validates face check target: must be between 1 and 10 seconds', () => {
    const lowResult = validateAlarm({
      ...validAlarm,
      steps: [{ methodId: 'face', target: 0 }],
    });
    expect(lowResult.valid).toBe(false);
    expect(lowResult.errors).toContain('Face/wake-state check target must be between 1 and 10 seconds.');

    const highResult = validateAlarm({
      ...validAlarm,
      steps: [{ methodId: 'face', target: 11 }],
    });
    expect(highResult.valid).toBe(false);
    expect(highResult.errors).toContain('Face/wake-state check target must be between 1 and 10 seconds.');

    expect(validateAlarm({ ...validAlarm, steps: [{ methodId: 'face', target: 1 }] }).valid).toBe(true);
    expect(validateAlarm({ ...validAlarm, steps: [{ methodId: 'face', target: 5 }] }).valid).toBe(true);
  });

  it('rejects invalid time formats', () => {
    const invalidTimes = ['7:30', '24:00', '12:60', 'abc', ''];
    for (const time of invalidTimes) {
      const result = validateAlarm({ ...validAlarm, time });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Alarm time must be in HH:mm 24-hour format.');
    }
  });

  it('accepts valid time format at boundaries (00:00 and 23:59)', () => {
    expect(validateAlarm({ ...validAlarm, time: '00:00' }).valid).toBe(true);
    expect(validateAlarm({ ...validAlarm, time: '23:59' }).valid).toBe(true);
  });
});
