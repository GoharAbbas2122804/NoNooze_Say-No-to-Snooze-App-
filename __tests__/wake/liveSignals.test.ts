import { createLiveFrameSignals, downsampleRgbToGray, encodeGrayFrame } from '../../src/wake/liveSignals';

describe('live camera signals', () => {
  it('requires both detected eyes to be open and retains ML and CNN probabilities', () => {
    const signals = createLiveFrameSignals({
      faceFound: true,
      leftEyeOpen: 0.95,
      rightEyeOpen: 0.1,
      leftEyeCnn: 0.9,
      rightEyeCnn: 0.1,
      brightness: 0.4,
      latencyMs: 12,
      faceBox: { x: 0.2, y: 0.1, w: 0.6, h: 0.7 },
      yaw: 4,
      pitch: -2,
      roll: 1,
      upright: 1,
    }, 200);

    expect(signals.eyesOpen).toBeLessThan(0.2);
    expect(signals.leftEyeOpen).toBeGreaterThan(signals.rightEyeOpen);
    expect(signals.source.mlkit).toBeCloseTo(0.525);
    expect(signals.faceBox.w).toBe(0.6);
  });

  it('does not let the unvalidated CNN veto a positive ML Kit eye signal', () => {
    const signals = createLiveFrameSignals({
      faceFound: true,
      leftEyeOpen: 0.95,
      rightEyeOpen: 0.95,
      leftEyeCnn: 0.02,
      rightEyeCnn: 0.02,
      brightness: 0.6,
      latencyMs: 10,
    }, 250);
    expect(signals.eyesOpen).toBe(0.95);
    expect(signals.source.cnn).toBe(0.02);
  });

  it('reports no face as closed eyes with an empty face box', () => {
    const signals = createLiveFrameSignals({ faceFound: false, brightness: 0.6, latencyMs: 8 }, 100);
    expect(signals.faceFound).toBe(false);
    expect(signals.eyesOpen).toBe(0);
    expect(signals.faceBox).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });

  it('downsamples actual RGB pixels using row stride and luminance', () => {
    const frame = downsampleRgbToGray(new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 10, 20, 30]), 2, 2, 6, 3, 1, 1);
    expect(frame.width).toBe(1);
    expect(frame.height).toBe(1);
    expect(Array.from(frame.pixels)).toEqual([76]);
  });

  it('encodes the sampled camera pixels without changing their byte values', () => {
    const base64 = encodeGrayFrame(new Uint8Array([0, 1, 2, 253, 254, 255]));
    expect(base64).toBe('AAEC/f7/');
  });
});
