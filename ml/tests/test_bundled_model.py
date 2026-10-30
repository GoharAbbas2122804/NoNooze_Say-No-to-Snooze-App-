import hashlib
from pathlib import Path

import numpy as np
import tensorflow as tf


ROOT = Path(__file__).resolve().parents[2]
MODEL = ROOT / "assets/models/eye_cnn_v1.tflite"
ANDROID_MODEL = ROOT / "modules/wake-vision/android/src/main/assets/eye_cnn_v1.tflite"


def test_bundled_tflite_model_loads_with_expected_contract():
    model_hash = hashlib.sha256(MODEL.read_bytes()).hexdigest()
    assert model_hash == hashlib.sha256(ANDROID_MODEL.read_bytes()).hexdigest()
    registry = (ROOT / "src/wake/modelRegistry.ts").read_text()
    assert model_hash in registry
    interpreter = tf.lite.Interpreter(model_path=str(MODEL))
    interpreter.allocate_tensors()
    input_detail = interpreter.get_input_details()[0]
    output_detail = interpreter.get_output_details()[0]

    assert list(input_detail["shape"]) == [1, 48, 48, 1]
    assert input_detail["dtype"] == np.float32
    assert list(output_detail["shape"]) == [1, 1]
    assert output_detail["dtype"] == np.float32

    interpreter.set_tensor(input_detail["index"], np.zeros((1, 48, 48, 1), dtype=np.float32))
    interpreter.invoke()
    prediction = interpreter.get_tensor(output_detail["index"])
    assert np.isfinite(prediction).all()
    assert np.all((prediction >= 0) & (prediction <= 1))
