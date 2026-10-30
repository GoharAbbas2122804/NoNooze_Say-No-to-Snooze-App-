import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { FaceChallenge } from '../../src/components/challenges/FaceChallenge';
import { FakeWakeCheckEngine } from '../../src/wake/fake/FakeWakeCheckEngine';
import { Step } from '../../src/domain/types';
import { DefaultWakeCheckEngine } from '../../src/wake/engine';

describe('FaceChallenge Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const step: Step = {
    methodId: 'face',
    target: 5,
  };

  it('renders hero wake-check HUD elements', async () => {
    const engine = new FakeWakeCheckEngine('happy-path');
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <FaceChallenge
        step={step}
        engine={engine}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );

    expect(screen.getByTestId('face-challenge-container')).toBeTruthy();
    expect(screen.getByTestId('live-wake-check-screen')).toBeTruthy();
    expect(screen.getByTestId('viewfinder-card')).toBeTruthy();
    expect(screen.getByText('Show your')).toBeTruthy();
    expect(screen.getByText('eyes')).toBeTruthy();
    expect(screen.getByText('Eyes open')).toBeTruthy();
    expect(screen.getByText('Alertness (estimate)')).toBeTruthy();
  });

  it('keeps the eye verification open for at least five seconds', async () => {
    const engine = new DefaultWakeCheckEngine();
    await render(
      <FaceChallenge
        step={{ methodId: 'face', target: 1 }}
        engine={engine}
        onProgress={() => {}}
        onComplete={() => {}}
      />
    );

    expect(engine.getState().checks.eyesOpen.targetMs).toBe(5000);
  });

  it('progresses to success and calls onComplete on happy path', async () => {
    const engine = new FakeWakeCheckEngine('happy-path');
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <FaceChallenge
        step={step}
        engine={engine}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );

    // Fast forward through verification, challenge, and success
    await act(async () => {
      jest.advanceTimersByTime(8000);
    });

    expect(screen.getByTestId('wake-success-view')).toBeTruthy();
    expect(screen.getByText('Awake.')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(onComplete).toHaveBeenCalled();
  });
});
