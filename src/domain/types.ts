export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

export type MethodId = 'math' | 'pushups' | 'situps' | 'face';

export type Step = {
  methodId: MethodId;
  target: number;
  options?: Record<string, unknown>;
};

export type Alarm = {
  id: string;
  time: string; // 'HH:mm' 24-hour format
  days: DayOfWeek[]; // Empty array = one-time alarm
  label: string;
  enabled: boolean;
  sound: string;
  steps: Step[];
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};
