export const EAR_MIN_NORM = 0.16;
export const EAR_MAX_NORM = 0.32;

export interface EyeSignalSources {
  mlkitProb?: number;
  earValue?: number;
  cnnProb?: number;
}

export interface FusionWeights {
  mlkit: number;
  ear: number;
  cnn: number;
}

export const DEFAULT_FUSION_WEIGHTS: FusionWeights = {
  mlkit: 0.35,
  ear: 0.25,
  cnn: 0.40,
};

export interface FusionResult {
  eyesOpen: number; // 0..1 fused score
  source: Record<string, number>; // per-source scores
}

export function normalizeEar(earValue?: number): number {
  if (earValue === undefined || isNaN(earValue)) return 0;
  if (earValue <= EAR_MIN_NORM) return 0.0;
  if (earValue >= EAR_MAX_NORM) return 1.0;
  return (earValue - EAR_MIN_NORM) / (EAR_MAX_NORM - EAR_MIN_NORM);
}

export function fuseEyeSignals(
  sources: EyeSignalSources,
  weights: Partial<FusionWeights> = {}
): FusionResult {
  const baseWeights = { ...DEFAULT_FUSION_WEIGHTS, ...weights };

  const normEar = normalizeEar(sources.earValue);
  const mlkit = sources.mlkitProb !== undefined && !isNaN(sources.mlkitProb) ? Math.min(1.0, Math.max(0.0, sources.mlkitProb)) : undefined;
  const cnn = sources.cnnProb !== undefined && !isNaN(sources.cnnProb) ? Math.min(1.0, Math.max(0.0, sources.cnnProb)) : undefined;

  let totalWeight = 0;
  let weightedSum = 0;

  if (mlkit !== undefined) {
    weightedSum += mlkit * baseWeights.mlkit;
    totalWeight += baseWeights.mlkit;
  }

  if (sources.earValue !== undefined && !isNaN(sources.earValue)) {
    weightedSum += normEar * baseWeights.ear;
    totalWeight += baseWeights.ear;
  }

  if (cnn !== undefined) {
    weightedSum += cnn * baseWeights.cnn;
    totalWeight += baseWeights.cnn;
  }

  const fused = totalWeight > 0 ? weightedSum / totalWeight : 0.0;
  const clampedFused = Math.min(1.0, Math.max(0.0, fused));

  return {
    eyesOpen: clampedFused,
    source: {
      mlkit: mlkit ?? 0,
      ear: normEar,
      cnn: cnn ?? 0,
      fused: clampedFused,
    },
  };
}
