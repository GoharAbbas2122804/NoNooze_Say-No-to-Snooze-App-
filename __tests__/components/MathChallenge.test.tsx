import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { MathChallenge } from '../../src/components/challenges/MathChallenge';
import { Step } from '../../src/domain/types';

describe('MathChallenge Component', () => {
  const step: Step = {
    methodId: 'math',
    target: 2,
    options: { difficulty: 'easy' },
  };

  const mockProblem = {
    question: '7 + 5',
    answer: 12,
  };

  it('renders question and answer placeholder', async () => {
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <MathChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
        initialProblem={mockProblem}
      />
    );

    expect(screen.getByText('7 + 5')).toBeTruthy();
    expect(screen.getByTestId('answer-display').props.children).toBe('?');
  });

  it('allows typing answer and backspacing', async () => {
    const user = userEvent.setup();
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <MathChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
        initialProblem={mockProblem}
      />
    );

    await user.press(screen.getByTestId('keypad-1'));
    await user.press(screen.getByTestId('keypad-2'));
    expect(screen.getByTestId('answer-display').props.children).toBe('12');

    await user.press(screen.getByTestId('keypad-backspace'));
    expect(screen.getByTestId('answer-display').props.children).toBe('1');
  });

  it('submits correct answer and calls onProgress', async () => {
    const user = userEvent.setup();
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <MathChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
        initialProblem={mockProblem}
      />
    );

    // Enter '12' and submit
    await user.press(screen.getByTestId('keypad-1'));
    await user.press(screen.getByTestId('keypad-2'));
    await user.press(screen.getByTestId('keypad-submit'));

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled(); // target is 2
  });

  it('submits correct answer on 1-problem step and calls onComplete', async () => {
    const user = userEvent.setup();
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    const singleStep: Step = { methodId: 'math', target: 1 };

    await render(
      <MathChallenge
        step={singleStep}
        onProgress={onProgress}
        onComplete={onComplete}
        initialProblem={mockProblem}
      />
    );

    await user.press(screen.getByTestId('keypad-1'));
    await user.press(screen.getByTestId('keypad-2'));
    await user.press(screen.getByTestId('keypad-submit'));

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
