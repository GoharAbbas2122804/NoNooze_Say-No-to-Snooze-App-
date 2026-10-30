export interface ModelDescriptor {
  id: string;
  name: string;
  version: string;
  sha256: string;
  path: string;
  inputShape: [number, number, number]; // e.g. [48, 48, 1]
  quantization: 'float16' | 'int8' | 'float32';
}

export const MODEL_REGISTRY: Record<string, ModelDescriptor> = {
  eye_cnn_v1: {
    id: 'eye_cnn_v1',
    name: 'NoNooze Eye State CNN',
    version: '1.0.0',
    sha256: '9e032dd1d0ff1a075b803983f4cc8fc8062b9734a8baa0bd423b2278665fad64',
    path: 'assets/models/eye_cnn_v1.tflite',
    inputShape: [48, 48, 1],
    quantization: 'float16',
  },
  upright_mlp_scaffold: {
    id: 'upright_mlp_scaffold',
    name: 'Upright Posture Scaffold (Week 3)',
    version: '0.1.0',
    sha256: 'pending_week3',
    path: 'assets/models/upright_mlp_scaffold.tflite',
    inputShape: [1, 33, 3],
    quantization: 'float32',
  },
};

export function getRegisteredModel(id: string): ModelDescriptor | undefined {
  return MODEL_REGISTRY[id];
}
