# NoNooze Eye-State CNN & Alertness Machine Learning Pipeline

This module hosts the training, evaluation, and edge deployment pipeline for the NoNooze ocular alertness engine. It targets high-accuracy, low-latency (<5ms on device, <100k parameters) eye-state verification for smart alarms.

---

## 1. Datasets & Domain Gap

### Datasets
1. **MRL Eye Dataset**:
   - **Size**: ~84,898 eye images across 37 human subjects.
   - **Sensor**: Infrared (IR) camera under controlled lighting.
   - **License**: Academic research use only (University of Split, Faculty of Electrical Engineering, Mechanical Engineering and Naval Architecture).
   - **Characteristics**: High contrast iris/pupil in IR, but lacks RGB skin tones and ambient sunlight variance.

2. **Closed Eyes in the Wild (CEW)**:
   - **Size**: ~2,426 face crops (open/closed eyes in unconstrained real-world settings).
   - **Sensor**: Standard RGB in varied wild lighting conditions.
   - **License**: Research use only.
   - **Role**: Bridges the domain gap from IR sensors to RGB front-facing phone cameras.

3. **NoNooze Local RGB Crops (Collector)**:
   - **Source**: Collected locally on Android front cameras via `src/wake/dev/collector.ts` under explicit consent.
   - **Privacy**: Local-only, never uploaded. Exported strictly via user share sheet.
   - **Role**: Gold-standard device test set (T3).

### The Infrared vs. RGB Domain Gap
Training solely on infrared data causes catastrophic false-open errors when deployed on RGB sensors due to specular reflections from room lamps, skin undertones, and mobile screen glare. To eliminate this gap:
- Training leverages multi-domain augmentation (low-light simulation, CLAHE, random grayscale).
- Cross-domain evaluation tests model generalization on real RGB phone crops.

---

## 2. Partitioning Strategy: Person-Level Splits

Many frames within a session are near-duplicates. Splitting randomly by image leaks subject features (skin tone, eye shape, glasses) between train and test sets, inflating accuracy.

**Strict Invariant:** Zero subject overlap across splits.
- **Train / Validation**: Subjects `s0001` through `s0029` (MRL) + 80% CEW.
- **Test T1 (MRL Held-out)**: Subjects `s0030` through `s0037` (unseen IR subjects).
- **Test T2 (CEW RGB)**: Held-out CEW wild RGB images.
- **Test T3 (Device RGB)**: Phone front-camera crops from different sessions/days.

A pytest test (`ml/tests/test_dataset.py`) automatically fails the build if any subject identifier appears in more than one partition.

---

## 3. Model Architectures

| Model | Architecture | Parameters | Target TFLite Size | Expected Latency | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M0** | ML Kit Prob + EAR Rule | N/A | N/A | 12-18 ms | Heuristic baseline |
| **M1** | 4-Block Conv2D + BN + GAP (From Scratch) | ~68,400 | ~140 KB (FP16) / ~75 KB (INT8) | ~3.2 ms | **Production Model** |
| **M2** | MobileNetV2-0.35 Transfer | ~410,000 | ~850 KB (FP16) | ~8.5 ms | Transfer baseline |
| **M3** | Depthwise-Separable Conv Variant | ~24,100 | ~60 KB (INT8) | ~2.1 ms | Ultra-low power |

### M1 Topology
- Input: `48 x 48 x 1` (Grayscale normalized to [0, 1])
- Block 1: Conv2D(16, 3x3) + BatchNorm + ReLU + MaxPool(2x2)
- Block 2: Conv2D(32, 3x3) + BatchNorm + ReLU + MaxPool(2x2)
- Block 3: Conv2D(64, 3x3) + BatchNorm + ReLU + MaxPool(2x2)
- Block 4: Conv2D(64, 3x3) + BatchNorm + ReLU
- Head: GlobalAveragePooling2D + Dropout(0.2) + Dense(1, activation='sigmoid')

---

## 4. Colab Training Workflow

The pipeline runs on Colab free GPU (T4 runtime):
1. Open `ml/01_eda.ipynb` to inspect dataset distributions and sensor modalities.
2. Run `ml/02_train_eye_cnn.ipynb` to train M1 and M2, evaluate ablations, and export `eye_cnn_v1.tflite`.
3. Run `ml/03_eval_on_device.ipynb` to compare on-device latency logs with validation curves.
4. `ml/04_upright_mlp_scaffold.ipynb` provides the Week 3 pose and posture model scaffold.
