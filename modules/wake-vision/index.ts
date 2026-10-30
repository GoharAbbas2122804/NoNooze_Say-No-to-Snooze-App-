import { requireNativeModule } from 'expo-modules-core';
import type { FaceAnalysis } from '../../src/wake/liveSignals';

export interface CropResult {
  probability: number;
  latencyMs: number;
  error?: string;
}

export interface WakeVisionInterface {
  isAvailable(): boolean;
  analyzeGrayFrame(base64Data: string, width: number, height: number, orientation: string): Promise<FaceAnalysis>;
  cropAndClassify(
    base64Data: string,
    normX: number,
    normY: number,
    normW: number,
    normH: number
  ): Promise<CropResult>;
}

let nativeModule: WakeVisionInterface | null = null;
try {
  nativeModule = requireNativeModule<WakeVisionInterface>('WakeVision');
} catch {
  nativeModule = null;
}

export const WakeVision: WakeVisionInterface = {
  isAvailable(): boolean {
    return nativeModule ? nativeModule.isAvailable() : false;
  },
  async analyzeGrayFrame(base64Data, width, height, orientation) {
    if (!nativeModule || !nativeModule.isAvailable()) {
      throw new Error('Native face and eye models are unavailable');
    }
    return nativeModule.analyzeGrayFrame(base64Data, width, height, orientation);
  },
  async cropAndClassify(
    base64Data: string,
    normX: number,
    normY: number,
    normW: number,
    normH: number
  ): Promise<CropResult> {
    if (nativeModule) {
      return nativeModule.cropAndClassify(base64Data, normX, normY, normW, normH);
    }
    throw new Error('Native eye model is unavailable');
  },
};
