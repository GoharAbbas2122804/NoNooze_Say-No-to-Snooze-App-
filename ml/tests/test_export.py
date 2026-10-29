from pathlib import Path
import numpy as np
from ml.src.models import build_m1_eye_cnn
from ml.src.export import export_to_tflite, verify_tflite_parity

def test_tflite_export_and_parity(tmp_path: Path):
    model = build_m1_eye_cnn(input_shape=(48, 48, 1))

    # Export Float16 TFLite
    export_path = tmp_path / "eye_cnn_test.tflite"
    meta = export_to_tflite(model, export_path, quantization="float16")

    assert export_path.exists()
    # Check file size budget: must be under 400 KB
    assert meta["size_kb"] < 400.0, f"TFLite size {meta['size_kb']} KB exceeds 400 KB limit"

    # Verify numerical parity on random test samples
    test_inputs = np.random.uniform(0.0, 1.0, (10, 48, 48, 1)).astype(np.float32)
    parity = verify_tflite_parity(model, export_path, test_inputs, max_diff_thresh=0.05)

    assert parity["is_parity_ok"] is True, f"Parity diff too high: {parity['max_abs_diff']}"
