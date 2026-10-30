import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ViewfinderCard } from '../../src/wake/components/ViewfinderCard';
import { DefaultWakeCheckEngine } from '../../src/wake/engine';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

it('shows the live face lock and per-eye prediction from camera signals', async () => {
  const engine = new DefaultWakeCheckEngine();
  await engine.start({ holdMs: 5000, sensitivity: 'standard', liveness: false, livenessTimeoutMs: 5000, fillLight: false });
  engine.feedFrame({
    t: 100,
    faceFound: true,
    leftEyeOpen: 0.88,
    rightEyeOpen: 0.2,
    eyesOpen: 0.2,
    yaw: 3,
    pitch: 1,
    roll: 0,
    upright: 1,
    brightness: 0.5,
    faceBox: { x: 0.2, y: 0.15, w: 0.6, h: 0.7 },
    latencyMs: 14,
    source: { mlkit: 0.6, cnn: 0.48, fused: 0.2 },
  });

  await render(
    <ThemeProvider>
      <ViewfinderCard engine={engine} state={engine.getState()} />
    </ThemeProvider>
  );

  expect(screen.getByTestId('live-detection-status').props.accessibilityLabel).toContain('Face detected');
  expect(screen.getByTestId('live-eye-prediction').props.children).toContain('CLOSED');
  expect(screen.getByText('ML 60% · CNN 48%')).toBeTruthy();
});
