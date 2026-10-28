import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { EnvironmentChallenge } from '../../src/components/challenges/EnvironmentChallenge';
import { Step } from '../../src/domain/types';

describe('EnvironmentChallenge Component', () => {
  const step: Step = {
    methodId: 'environment',
    target: 1,
  };

  it('renders environment light challenge title, radar HUD and lux target', async () => {
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <EnvironmentChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Environment Light Tracking')).toBeTruthy();
    expect(screen.getByText(/Move towards morning light/)).toBeTruthy();
    expect(screen.getByTestId('environment-lux-text')).toBeTruthy();
    expect(screen.getByTestId('verify-environment-btn')).toBeTruthy();
  });

  it('initiates light measurement on scan button tap', async () => {
    const user = userEvent.setup();
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <EnvironmentChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );

    await user.press(screen.getByTestId('verify-environment-btn'));

    expect(screen.getByText('Measuring Environment...')).toBeTruthy();
  });
});
