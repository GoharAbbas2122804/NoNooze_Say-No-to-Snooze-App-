import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { PushupsChallenge } from '../../src/components/challenges/PushupsChallenge';
import { Step } from '../../src/domain/types';

describe('PushupsChallenge Component', () => {
  const step: Step = {
    methodId: 'pushups',
    target: 5,
  };

  it('renders reps counter and target', async () => {
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <PushupsChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Pushup / Motion Reps')).toBeTruthy();
    expect(screen.getByText('OF 5 REPS')).toBeTruthy();
    expect(screen.getByTestId('pushup-rep-btn')).toBeTruthy();
  });

  it('increments completed reps on rep log press', async () => {
    const user = userEvent.setup();
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <PushupsChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );

    expect(screen.getByTestId('pushups-count-text').props.children).toBe(0);

    await user.press(screen.getByTestId('pushup-rep-btn'));
    expect(screen.getByTestId('pushups-count-text').props.children).toBe(1);
    expect(onProgress).toHaveBeenCalledTimes(1);
  });
});
