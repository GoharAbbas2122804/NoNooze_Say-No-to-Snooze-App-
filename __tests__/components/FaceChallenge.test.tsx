import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { FaceChallenge } from '../../src/components/challenges/FaceChallenge';
import { Step } from '../../src/domain/types';

describe('FaceChallenge Component', () => {
  const step: Step = {
    methodId: 'face',
    target: 1,
  };

  it('renders face challenge instructions and camera HUD', async () => {
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <FaceChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Facial Expression Wake Check')).toBeTruthy();
    expect(screen.getByText(/Hold a wide morning smile/)).toBeTruthy();
    expect(screen.getByTestId('face-confidence-text')).toBeTruthy();
    expect(screen.getByTestId('verify-expression-btn')).toBeTruthy();
  });

  it('starts verification when button pressed and updates confidence', async () => {
    const user = userEvent.setup();
    const onProgress = jest.fn();
    const onComplete = jest.fn();

    await render(
      <FaceChallenge
        step={step}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );

    await user.press(screen.getByTestId('verify-expression-btn'));

    expect(screen.getByText('CONFIDENCE: 92%')).toBeTruthy();
    expect(screen.getByTestId('face-hold-progress-text')).toBeTruthy();
  });
});
