import { requireNativeModule } from 'expo-modules-core';

export interface CropResult {
  probability: number;
  latencyMs: number;
  error?: string;
}

export interface WakeVisionInterface {
  isAvailable(): boolean;
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
    // Fallback in simulation / testing environments
    return {
      probability: 0.88,
      latencyMs: 3,
    };
  },
};
