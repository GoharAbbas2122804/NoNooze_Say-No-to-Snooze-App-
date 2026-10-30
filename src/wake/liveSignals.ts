import { FrameSignals } from './contract';

export interface FaceAnalysis {
  faceFound: boolean;
  leftEyeOpen?: number | null;
  rightEyeOpen?: number | null;
  leftEyeCnn?: number | null;
  rightEyeCnn?: number | null;
  yaw?: number;
  pitch?: number;
  roll?: number;
  upright?: number;
  brightness: number;
  faceBox?: { x: number; y: number; w: number; h: number };
  latencyMs: number;
}

export function encodeGrayFrame(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)];
    output += b === undefined ? '=' : alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)];
    output += c === undefined ? '=' : alphabet[c & 63];
  }
  return output;
}

export function createLiveFrameSignals(analysis: FaceAnalysis, t: number): FrameSignals {
  const left = clampProbability(analysis.leftEyeOpen);
  const right = clampProbability(analysis.rightEyeOpen);
  const eyesOpen = analysis.faceFound ? Math.min(left, right) : 0;
  const mlkitValues = [analysis.leftEyeOpen, analysis.rightEyeOpen].filter((v): v is number => typeof v === 'number');
  const cnnValues = [analysis.leftEyeCnn, analysis.rightEyeCnn].filter((v): v is number => typeof v === 'number');

  return {
    t,
    faceFound: analysis.faceFound,
    leftEyeOpen: analysis.faceFound ? left : 0,
    rightEyeOpen: analysis.faceFound ? right : 0,
    eyesOpen,
    yaw: analysis.yaw ?? 0,
    pitch: analysis.pitch ?? 0,
    roll: analysis.roll ?? 0,
    upright: analysis.faceFound ? (analysis.upright ?? 0) : 0,
    brightness: analysis.brightness,
    faceBox: analysis.faceBox ?? { x: 0, y: 0, w: 0, h: 0 },
    latencyMs: analysis.latencyMs,
    source: {
      mlkit: mlkitValues.length ? mlkitValues.reduce((sum, value) => sum + value, 0) / mlkitValues.length : 0,
      cnn: cnnValues.length ? cnnValues.reduce((sum, value) => sum + value, 0) / cnnValues.length : 0,
      left,
      right,
      fused: eyesOpen,
    },
  };
}

function clampProbability(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function downsampleRgbToGray(
  pixels: Uint8Array,
  width: number,
  height: number,
  bytesPerRow: number,
  bytesPerPixel: number,
  maxWidth = 320,
  maxHeight = 240
): { pixels: Uint8Array; width: number; height: number } {
  'worklet';
  const scale = Math.max(1, Math.ceil(width / maxWidth), Math.ceil(height / maxHeight));
  const outWidth = Math.ceil(width / scale);
  const outHeight = Math.ceil(height / scale);
  const gray = new Uint8Array(outWidth * outHeight);

  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      const offset = Math.min(y * scale, height - 1) * bytesPerRow + Math.min(x * scale, width - 1) * bytesPerPixel;
      const r = pixels[offset] ?? 0;
      const g = pixels[offset + 1] ?? r;
      const b = pixels[offset + 2] ?? r;
      gray[y * outWidth + x] = Math.round((0.299 * r + 0.587 * g + 0.114 * b));
    }
  }

  return { pixels: gray, width: outWidth, height: outHeight };
}
