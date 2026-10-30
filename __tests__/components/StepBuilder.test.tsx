import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { StepBuilder } from '../../src/components/alarm/StepBuilder';
import { Step } from '../../src/domain/types';

jest.mock('../../src/components/alarm/BlinkingEyesMiniIllustration', () => ({
  BlinkingEyesMiniIllustration: () => null,
}));

describe('StepBuilder Component', () => {
  const steps: Step[] = [
    { methodId: 'math', target: 3 },
  ];

  it('renders existing steps with targets', async () => {
    const onChange = jest.fn();
    await render(<StepBuilder steps={steps} onChange={onChange} />);

    expect(screen.getByText('Math Problems')).toBeTruthy();
    expect(screen.getByTestId('target-value-0').props.children).toBe(3);
  });

  it('increments step target within bounds', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<StepBuilder steps={steps} onChange={onChange} />);

    await user.press(screen.getByTestId('step-inc-0'));
    expect(onChange).toHaveBeenCalledWith([{ methodId: 'math', target: 4 }]);
  });

  it('decrements step target within bounds', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<StepBuilder steps={steps} onChange={onChange} />);

    await user.press(screen.getByTestId('step-dec-0'));
    expect(onChange).toHaveBeenCalledWith([{ methodId: 'math', target: 2 }]);
  });

  it('opens challenge picker modal on add step press', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<StepBuilder steps={steps} onChange={onChange} />);

    await user.press(screen.getByTestId('add-step-button'));
    expect(screen.getByText('Choose Challenge')).toBeTruthy();
    expect(screen.getByText('Pushups')).toBeTruthy();
    expect(screen.getAllByText('Coming Soon').length).toBeGreaterThan(0);
  });

  it('appends a selected challenge without replacing the existing sequence', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<StepBuilder steps={steps} onChange={onChange} />);

    await user.press(screen.getByTestId('add-step-button'));
    await user.press(screen.getByTestId('method-option-face'));

    expect(onChange).toHaveBeenCalledWith([
      { methodId: 'math', target: 3 },
      { methodId: 'face', target: 5 },
    ]);
  });

  it('reorders challenges in the sequence', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const sequence: Step[] = [
      { methodId: 'math', target: 3 },
      { methodId: 'face', target: 5 },
    ];
    await render(<StepBuilder steps={sequence} onChange={onChange} />);

    await user.press(screen.getByTestId('move-up-1'));

    expect(onChange).toHaveBeenCalledWith([
      { methodId: 'face', target: 5 },
      { methodId: 'math', target: 3 },
    ]);
  });
});
