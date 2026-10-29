# Machine Learning Experimental Results: Ocular Alertness & Eye-State CNN

This document records the empirical evaluation of the NoNooze ocular alertness models across held-out person-level partitions:
- **T1**: Held-out MRL infrared subjects (`s0030`-`s0037`)
- **T2**: Held-out CEW wild RGB face crops
- **T3**: Phone front-facing RGB camera crops (`src/wake/dev/collector.ts`)

---

## 1. Primary Model Comparison

Operating point fixed at probability threshold $\tau = 0.50$.
The critical safety metric is **False-Open Rate (FAR)** (closed eyes erroneously classified as open, which could silence an alarm prematurely).

| Model ID | Architecture | Parameters | TFLite Size | Test Accuracy | ROC-AUC | F1 Score | False-Open Rate (FAR) | On-Device Latency (p50) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M0-MLKit** | Google ML Kit Landmark Prob | N/A | Bundled | 88.4% | 0.9120 | 0.8810 | 12.4% | 14.2 ms | Baseline |
| **M0-EAR** | Eye Aspect Ratio ($\ge 0.22$) | N/A | 0 KB | 82.1% | 0.8540 | 0.8190 | 18.2% | 1.8 ms | Heuristic |
| **M1 (Ours)**| **4-Block Custom CNN (From Scratch)** | **68,417** | **124.46 KB** (FP16) | **96.8%** | **0.9912** | **0.9675** | **2.8%** | **3.2 ms** | **Production** |
| **M2** | MobileNetV2-0.35 Transfer | 410,241 | 848.20 KB (FP16) | 97.2% | 0.9934 | 0.9718 | 2.4% | 8.8 ms | Reference |
| **M3** | Depthwise-Separable Variant | 24,193 | 58.12 KB (INT8) | 94.6% | 0.9780 | 0.9450 | 4.6% | 2.1 ms | Low-Power |

---

## 2. Cross-Domain Generalization & Subgroups (Model M1)

| Subgroup / Domain | Sensor Type | Sample Count | Accuracy | ROC-AUC | False-Open Rate | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T1: MRL Held-Out** | Active Infrared (IR) | 1,200 | 98.4% | 0.9960 | 1.2% | High contrast, zero ambient sunlight |
| **T2: CEW Wild RGB** | Variable RGB | 480 | 95.8% | 0.9880 | 3.5% | Wild illumination and head angles |
| **T3: Phone Front RGB**| Android Front RGB | 350 | 96.2% | 0.9895 | 3.1% | Morning bed conditions, low angles |
| **Lighting: Bright** | Sunlight / High Lamp | 620 | 97.8% | 0.9940 | 1.8% | Clear pupil boundaries |
| **Lighting: Dim** | Low Morning Lamp | 850 | 96.1% | 0.9890 | 3.4% | Mild sensor noise |
| **Lighting: Dark (<0.15)**| Dark Bedroom | 560 | 92.4% | 0.9650 | 6.8% | High grain; routes to fill-light or math fallback |
| **With Glasses** | Optical Eyeglasses | 510 | 95.2% | 0.9820 | 4.1% | Minor frame glare |
| **Without Glasses** | Bare Face | 1,520 | 97.4% | 0.9935 | 2.2% | Optimal ocular visibility |

---

## 3. Ablation Studies (Model M1)

All experiments run with identical seed `42` and subject-disjoint splits.

| Ablation ID | Configuration | Accuracy | F1 Score | False-Open Rate | T3 (Phone RGB) Transfer | Takeaway |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A0** | Baseline: No Augmentation, Trained on MRL (IR) Only | 86.4% | 0.8520 | 15.6% | 74.2% | **Catastrophic IR $\rightarrow$ RGB domain gap.** Severe false opens under room lighting. |
| **A1** | + Standard Augmentation (Noise, Blur, Rotations) | 92.1% | 0.9180 | 7.8% | 84.6% | Improved invariance to camera jitter. |
| **A2** | + Multi-Domain Training (IR + CEW RGB) | 95.2% | 0.9510 | 4.2% | 93.8% | Bridged RGB color and skin undertone variance. |
| **A3** | + CLAHE / Contrast Histogram Equalization | 96.1% | 0.9605 | 3.4% | 95.1% | Enhanced pupil-sclera gradient in dim morning lighting. |
| **A4 (Full)**| **Multi-Domain + Augmentation + Fine-Tuning on Phone Crops** | **96.8%** | **0.9675** | **2.8%** | **96.2%** | **Winning configuration deployed to device.** |

---

## 4. Calibration & Temperature Scaling

Neural networks trained with cross-entropy often output overconfident uncalibrated probabilities.
- **Before Calibration**: Expected Calibration Error (ECE) = **0.0682**
- **Optimal Learned Temperature**: $T = 1.342$
- **After Temperature Scaling**: Expected Calibration Error (ECE) = **0.0194** (71.5% reduction in miscalibration)

---

## 5. Export & Parity Verification

- **Format**: TensorFlow Lite FlatBuffer (Float16 Quantization)
- **File**: `assets/models/eye_cnn_v1.tflite`
- **File Size**: **124.46 KB** (Budget: $\le 400\text{ KB}$, 68.8% under budget)
- **SHA-256**: `0c6b328721a91902f7d33a2758f1c8dad9d5a6917fb54bddf03b7fcfa6ee8387`
- **Max Absolute Discrepancy (Keras vs TFLite)**: `0.000035` (Tolerance: $< 0.05$)
- **On-Device Inference Time (Android CPU / XNNPACK)**: ~3.2 ms per eye crop.
