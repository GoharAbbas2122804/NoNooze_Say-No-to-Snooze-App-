import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import ChallengesTabScreen from '../../src/app/challenges';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

describe('ChallengesTabScreen', () => {
  it('renders challenge hub title, tabs and CTA', async () => {
    await render(<ChallengesTabScreen />);

    expect(screen.getByText('AI Challenge')).toBeTruthy();
    expect(screen.getByText('Hub')).toBeTruthy();
    expect(screen.getByText(/Zero-Snooze Deep Learning Protocol/)).toBeTruthy();
    expect(screen.getByTestId('challenge-tab-face')).toBeTruthy();
    expect(screen.getByTestId('challenge-tab-environment')).toBeTruthy();
    expect(screen.getByTestId('challenge-tab-math')).toBeTruthy();
    expect(screen.getByTestId('challenge-tab-pushups')).toBeTruthy();
    expect(screen.getByTestId('create-alarm-cta')).toBeTruthy();
  });

  it('switches between challenge tabs when pressed', async () => {
    const user = userEvent.setup();
    await render(<ChallengesTabScreen />);

    // Default is Face AI
    expect(screen.getByText('Face Wake Check')).toBeTruthy();

    // Switch to Environment tab
    await user.press(screen.getByTestId('challenge-tab-environment'));
    expect(screen.getByText('Environment Light Tracking')).toBeTruthy();

    // Switch to Math tab
    await user.press(screen.getByTestId('challenge-tab-math'));
    expect(screen.getByText('Math Problems')).toBeTruthy();
  });
});
