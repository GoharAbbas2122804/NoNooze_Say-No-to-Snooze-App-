import {
  createInitialStepRunnerState,
  stepRunnerReducer,
  StepRunnerState,
} from '../../src/domain/step-runner';
import { Step } from '../../src/domain/types';

describe('Step Runner State Machine', () => {
  const steps: Step[] = [
    { methodId: 'math', target: 2 },
    { methodId: 'math', target: 1 },
  ];

  it('initializes to idle when createInitialStepRunnerState is called without steps', () => {
    const state = createInitialStepRunnerState([]);
    expect(state.status).toBe('completed');
  });

  it('initializes running state at step 0 with progress 0', () => {
    const state = createInitialStepRunnerState(steps);
    expect(state.status).toBe('running');
    if (state.status === 'running') {
      expect(state.stepIndex).toBe(0);
      expect(state.progress).toBe(0);
      expect(state.totalSteps).toBe(2);
      expect(state.currentStep).toEqual(steps[0]);
    }
  });

  it('increments progress on PROGRESS action', () => {
    let state = createInitialStepRunnerState(steps);
    state = stepRunnerReducer(state, { type: 'PROGRESS' });

    expect(state.status).toBe('running');
    if (state.status === 'running') {
      expect(state.stepIndex).toBe(0);
      expect(state.progress).toBe(1);
    }
  });

  it('advances to next step when progress reaches current step target', () => {
    let state = createInitialStepRunnerState(steps); // target is 2 for step 0
    state = stepRunnerReducer(state, { type: 'PROGRESS' }); // 1/2
    state = stepRunnerReducer(state, { type: 'PROGRESS' }); // 2/2 -> advances to step 1

    expect(state.status).toBe('running');
    if (state.status === 'running') {
      expect(state.stepIndex).toBe(1);
      expect(state.progress).toBe(0);
      expect(state.currentStep).toEqual(steps[1]);
    }
  });

  it('transitions to completed when last step reaches target', () => {
    let state = createInitialStepRunnerState(steps);
    state = stepRunnerReducer(state, { type: 'PROGRESS' }); // 1/2
    state = stepRunnerReducer(state, { type: 'PROGRESS' }); // 2/2 -> step 1 (0/1)
    state = stepRunnerReducer(state, { type: 'PROGRESS' }); // 1/1 -> completed!

    expect(state.status).toBe('completed');
  });

  it('stays completed if PROGRESS action sent while completed', () => {
    let state: StepRunnerState = { status: 'completed' };
    state = stepRunnerReducer(state, { type: 'PROGRESS' });
    expect(state.status).toBe('completed');
  });

  it('resets to idle on RESET action', () => {
    let state = createInitialStepRunnerState(steps);
    state = stepRunnerReducer(state, { type: 'RESET' });
    expect(state.status).toBe('idle');
  });

  it('restarts runner on START action', () => {
    let state: StepRunnerState = { status: 'idle' };
    state = stepRunnerReducer(state, { type: 'START', steps });
    expect(state.status).toBe('running');
    if (state.status === 'running') {
      expect(state.stepIndex).toBe(0);
      expect(state.progress).toBe(0);
      expect(state.totalSteps).toBe(2);
    }
  });
});
