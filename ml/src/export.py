"""
ml/src/export.py

TFLite export and parity verification:
- Float16 and Int8 quantization
- Parity comparison against Keras source model
- File size auditing (< 400 KB requirement)
"""

import os
from pathlib import Path
from typing import Dict, Any, Generator, Callable, Optional
import numpy as np
import tensorflow as tf

def export_to_tflite(
    model: tf.keras.Model,
    output_path: Path,
    quantization: str = "float16",
    rep_dataset_gen: Optional[Callable[[], Generator]] = None
) -> Dict[str, Any]:
    """
    Exports a Keras model to TensorFlow Lite with optional quantization.
    quantization options: 'none', 'float16', 'int8'
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)

    if quantization == "float16":
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
    elif quantization == "int8":
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        if rep_dataset_gen is None:
            # Fallback synthetic representative data generator for calibration
            def default_rep_gen():
                for _ in range(100):
                    yield [np.random.uniform(0.0, 1.0, (1, 48, 48, 1)).astype(np.float32)]
            converter.representative_dataset = default_rep_gen
        else:
            converter.representative_dataset = rep_dataset_gen

    tflite_model = converter.convert()

    with open(output_path, "wb") as f:
        f.write(tflite_model)

    size_bytes = len(tflite_model)
    size_kb = size_bytes / 1024.0

    return {
        "output_path": str(output_path),
        "size_bytes": size_bytes,
        "size_kb": size_kb,
        "quantization": quantization,
    }

def verify_tflite_parity(
    keras_model: tf.keras.Model,
    tflite_path: Path,
    test_inputs: np.ndarray,
    max_diff_thresh: float = 0.05
) -> Dict[str, Any]:
    """
    Runs identical test inputs through Keras and TFLite models
    to assert parity within a strict numeric tolerance (< 0.05 max absolute diff).
    """
    # Keras inference
    keras_preds = keras_model.predict(test_inputs, verbose=0).flatten()

    # TFLite inference
    interpreter = tf.lite.Interpreter(model_path=str(tflite_path))
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    tflite_preds = []
    for i in range(len(test_inputs)):
        sample = np.expand_dims(test_inputs[i], axis=0).astype(np.float32)
        interpreter.set_tensor(input_details[0]["index"], sample)
        interpreter.invoke()
        out = interpreter.get_tensor(output_details[0]["index"]).flatten()[0]
        tflite_preds.append(out)

    tflite_preds = np.array(tflite_preds)
    abs_diffs = np.abs(keras_preds - tflite_preds)
    max_diff = float(np.max(abs_diffs))
    mean_diff = float(np.mean(abs_diffs))

    return {
        "max_abs_diff": max_diff,
        "mean_abs_diff": mean_diff,
        "is_parity_ok": max_diff <= max_diff_thresh,
        "samples_evaluated": len(test_inputs),
    }
