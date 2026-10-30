#!/usr/bin/env python3
"""
export_production_model.py

Trains M1 on available dataset and exports assets/models/eye_cnn_v1.tflite.
Outputs exact file size and sha256 checksum for model registry.
"""

import hashlib
from pathlib import Path
import numpy as np
import tensorflow as tf
from PIL import Image

from ml.src.models import build_m1_eye_cnn
from ml.src.export import export_to_tflite, verify_tflite_parity

def label_for_eye_image(path: Path) -> int:
    """Read eye state from the explicit label field for each supported dataset."""
    if path.parent.name == "openEyes":
        return 1
    if path.parent.name == "closedEyes":
        return 0

    parts = path.stem.split("_")
    if path.parent.name.startswith("s") and len(parts) > 2 and parts[2] in ("0", "1"):
        return int(parts[2])
    if "crop" in parts and parts[-1] in ("0", "1"):
        return int(parts[-1])
    raise ValueError(f"Cannot determine eye label from dataset path: {path}")

def load_train_batch(data_dir: Path, target_samples: int = 120):
    images = []
    labels = []

    for p in sorted(data_dir.glob("**/*")):
        if not p.is_file() or p.suffix.lower() not in (".png", ".jpg", ".jpeg"):
            continue
        try:
            img = Image.open(p).convert("L").resize((48, 48))
            arr = np.array(img, dtype=np.float32) / 255.0
            images.append(np.expand_dims(arr, axis=-1))
            lbl = label_for_eye_image(p)
            labels.append(lbl)
            if len(images) >= target_samples:
                break
        except Exception:
            continue

    if not images:
        raise ValueError(f"No labeled eye images found under {data_dir}")

    X = np.array(images, dtype=np.float32)
    y = np.array(labels, dtype=np.float32).reshape(-1, 1)
    if len(np.unique(y)) != 2:
        raise ValueError(f"Training data under {data_dir} must include both open and closed eyes")
    return X, y

def main():
    np.random.seed(42)
    tf.random.set_seed(42)

    data_dir = Path("ml/data/approved")
    if not data_dir.exists():
        raise FileNotFoundError(
            "Production export requires licensed, labeled data under ml/data/approved; "
            "synthetic fixtures in ml/mock_data cannot produce a production model."
        )
    X, y = load_train_batch(data_dir)

    print(f"Loaded {len(X)} training samples. Building M1 Eye CNN...")
    model = build_m1_eye_cnn()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )

    print("Fitting model (5 epochs)...")
    model.fit(X, y, epochs=5, batch_size=16, verbose=1)

    out_path = Path("assets/models/eye_cnn_v1.tflite")
    print(f"Exporting to {out_path} (Float16 quantization)...")
    res = export_to_tflite(model, out_path, quantization="float16")

    # Verify parity
    test_X = X[:15]
    parity = verify_tflite_parity(model, out_path, test_X)
    print(f"Parity max diff: {parity['max_abs_diff']:.6f} (Passed: {parity['is_parity_ok']})")

    # Compute sha256
    with open(out_path, "rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest()

    print(f"Model exported: {res['size_kb']:.2f} KB | SHA256: {sha}")

if __name__ == "__main__":
    main()
