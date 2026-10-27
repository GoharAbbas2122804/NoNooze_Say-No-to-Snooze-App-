import { Step } from './types';

export type StepRunnerState =
  | { status: 'idle' }
  | {
      status: 'running';
      stepIndex: number;
      progress: number;
      totalSteps: number;
      currentStep: Step;
      steps: Step[];
    }
  | { status: 'completed' };

export type StepRunnerAction =
  | { type: 'START'; steps: Step[] }
  | { type: 'PROGRESS'; increment?: number }
  | { type: 'RESET' };

export function createInitialStepRunnerState(steps: Step[]): StepRunnerState {
  if (!steps || steps.length === 0) {
    return { status: 'completed' };
  }
  return {
    status: 'running',
    stepIndex: 0,
    progress: 0,
    totalSteps: steps.length,
    currentStep: steps[0],
    steps,
  };
}

export function stepRunnerReducer(
  state: StepRunnerState,
  action: StepRunnerAction
): StepRunnerState {
  switch (action.type) {
    case 'START':
      return createInitialStepRunnerState(action.steps);

    case 'RESET':
      return { status: 'idle' };

    case 'PROGRESS': {
      if (state.status !== 'running') {
        return state;
      }

      const increment = action.increment ?? 1;
      const nextProgress = state.progress + increment;

      if (nextProgress >= state.currentStep.target) {
        const nextStepIndex = state.stepIndex + 1;
        if (nextStepIndex >= state.totalSteps) {
          return { status: 'completed' };
        }

        return {
          ...state,
          stepIndex: nextStepIndex,
          progress: 0,
          currentStep: state.steps[nextStepIndex],
        };
      }

      return {
        ...state,
        progress: nextProgress,
      };
    }

    default:
      return state;
  }
}
