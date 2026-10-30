import { Alarm, ValidationResult, Step } from './types';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validateStep(step: Step): string | null {
  switch (step.methodId) {
    case 'math':
      if (step.target < 1 || step.target > 10) {
        return 'Math challenge target must be between 1 and 10 problems.';
      }
      break;
    case 'pushups':
      if (step.target < 5 || step.target > 50) {
        return 'Pushups target must be between 5 and 50 reps.';
      }
      break;
    case 'situps':
      if (step.target < 5 || step.target > 50) {
        return 'Situps target must be between 5 and 50 reps.';
      }
      break;
    case 'face':
      if (step.target < 1 || step.target > 10) {
        return 'Face/wake-state check target must be between 1 and 10 seconds.';
      }
      break;
    case 'environment':
      if (step.target < 1 || step.target > 10) {
        return 'Environment scan target must be between 1 and 10.';
      }
      break;
    default:
      return `Unknown challenge method: ${step.methodId}`;
  }
  return null;
}

export function validateAlarm(alarm: Partial<Alarm>): ValidationResult {
  const errors: string[] = [];

  if (!alarm.time || !TIME_REGEX.test(alarm.time)) {
    errors.push('Alarm time must be in HH:mm 24-hour format.');
  }

  if (!alarm.steps || alarm.steps.length === 0) {
    errors.push('Alarm must have at least one dismissal step.');
  } else {
    for (const step of alarm.steps) {
      const stepError = validateStep(step);
      if (stepError) {
        errors.push(stepError);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
