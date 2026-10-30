# Eye model evaluation status

The checked-in model has only been verified as a loadable TFLite artifact. The repository contains synthetic fixtures under `ml/mock_data`, but no licensed MRL/CEW evaluation set, trained Keras checkpoint, or consented phone-camera test set. Accuracy, false-open rate, latency, and Keras-to-TFLite parity are therefore **not verified** and must not be used as production claims.

## Checked-in artifact smoke check

| Property | Observed |
| --- | --- |
| Artifact | `assets/models/eye_cnn_v1.tflite` |
| SHA-256 | `9e032dd1d0ff1a075b803983f4cc8fc8062b9734a8baa0bd423b2278665fad64` |
| Input | `float32`, `[1, 48, 48, 1]` |
| Output | `float32`, `[1, 1]` |
| Runtime check | TensorFlow Lite CPU interpreter allocated tensors and returned finite, bounded probabilities |

For unlabelled blank grayscale inputs, the artifact returned `0.018` for all black, `0.021` for mid-gray, and `0.031` for all white. These are smoke inputs, not eye images; they only show that the model executes. Real open/closed eye discrimination remains unvalidated. The previous accuracy and latency table was removed because the supporting dataset, checkpoint, and reproducible evaluation artifacts are not present in this repository.

The artifact was also run across the repository's 190 synthetic crops (95 open, 95 closed) at a `0.5` threshold. It returned no open predictions: 50% accuracy, 0% open-eye recall, and 0% false-open rate on this synthetic fixture set. This is not a generalization benchmark, but it demonstrates that the current artifact cannot identify open eyes in even the bundled fixtures. The Android app therefore displays its CNN scores for diagnostics while ML Kit eye-open probabilities drive the dismissal hold.

## Required before production evaluation

Use licensed person-disjoint labeled eye crops, including held-out phone RGB data. Record the dataset manifest and subject split, train and retain the Keras checkpoint, run false-open and open-recall metrics at the chosen dismissal threshold, compare the exact Keras checkpoint against the exported TFLite artifact, and measure device latency on supported Android hardware. Keep the alarm closed on camera/model errors and until the live model signals satisfy the configured eye hold and liveness challenge.
