import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { WakeCameraPreview } from '../../src/wake/WakeCameraPreview';
import { DefaultWakeCheckEngine } from '../../src/wake/engine';
import { WakeVision } from '../../modules/wake-vision';
import { useFrameOutput } from 'react-native-vision-camera';

describe('WakeCameraPreview', () => {
  it('reports frame processing errors to the engine without losing its receiver', async () => {
    const engine = new DefaultWakeCheckEngine();
    await engine.start({
      holdMs: 5000,
      sensitivity: 'standard',
      liveness: false,
      livenessTimeoutMs: 5000,
      fillLight: false,
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await render(<WakeCameraPreview engine={engine} />);
    const frameOutput = screen.getByTestId('vision-camera').props.outputs[0];

    frameOutput.onFrame({
      timestamp: 1_000_000_000,
      pixelFormat: 'rgb-rgb-8-bit',
      getPixelBuffer() {
        throw new Error('pixel buffer unavailable');
      },
      dispose: jest.fn(),
    });

    expect(engine.getState().phase).toBe('fallback');
    expect(engine.getState().failureReason).toBe('model-error');
    expect(warn).toHaveBeenCalledWith(
      'Wake camera frame processing failed:',
      'pixel buffer unavailable'
    );
    warn.mockRestore();
  });

  it('does not open the camera when the native models did not initialize', async () => {
    const engine = new DefaultWakeCheckEngine();
    const isAvailable = jest.spyOn(WakeVision, 'isAvailable').mockReturnValue(false);
    const getInitializationError = jest.spyOn(WakeVision, 'getInitializationError')
      .mockReturnValue('Eye model initialization failed: missing tensor asset');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await render(<WakeCameraPreview engine={engine} />);

    await waitFor(() => {
      expect(engine.getState().failureReason).toBe('model-error');
    });
    expect(screen.queryByTestId('vision-camera')).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      'Wake vision model initialization failed:',
      'Eye model initialization failed: missing tensor asset'
    );

    isAvailable.mockRestore();
    getInitializationError.mockRestore();
    warn.mockRestore();
  });

  it('keeps the native frame callback stable across preview renders', async () => {
    const engine = new DefaultWakeCheckEngine();
    const frameOutputMock = useFrameOutput as jest.Mock;
    frameOutputMock.mockClear();
    const { rerender } = await render(<WakeCameraPreview engine={engine} style={{ height: 100 }} />);
    const firstCallback = frameOutputMock.mock.calls.at(-1)?.[0].onFrame;

    await rerender(<WakeCameraPreview engine={engine} style={{ height: 101 }} />);
    const secondCallback = frameOutputMock.mock.calls.at(-1)?.[0].onFrame;

    expect(secondCallback).toBe(firstCallback);
  });
});
