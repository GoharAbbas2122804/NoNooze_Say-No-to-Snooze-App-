import numpy as np
import tensorflow as tf
from ml.src.models import (
    build_m1_eye_cnn,
    build_m2_mobilenet,
    build_m3_separable,
    evaluate_m0_baseline,
)

def test_m1_architecture_constraints():
    model = build_m1_eye_cnn(input_shape=(48, 48, 1))

    # Parameter budget: must be under 100k parameters
    total_params = model.count_params()
    assert total_params < 100_000, f"M1 exceeds 100k parameters: {total_params}"

    # Forward pass on batch of 48x48 images
    dummy_input = np.random.uniform(0.0, 1.0, (4, 48, 48, 1)).astype(np.float32)
    output = model.predict(dummy_input, verbose=0)

    assert output.shape == (4, 1)
    # Output must be in range [0, 1] due to sigmoid activation
    assert np.all(output >= 0.0)
    assert np.all(output <= 1.0)

def test_m2_mobilenet_forward_pass():
    model = build_m2_mobilenet(input_shape=(48, 48, 1))
    dummy_input = np.random.uniform(0.0, 1.0, (2, 48, 48, 1)).astype(np.float32)
    output = model.predict(dummy_input, verbose=0)
    assert output.shape == (2, 1)

def test_m3_separable_forward_pass():
    model = build_m3_separable(input_shape=(48, 48, 1))
    dummy_input = np.random.uniform(0.0, 1.0, (2, 48, 48, 1)).astype(np.float32)
    output = model.predict(dummy_input, verbose=0)
    assert output.shape == (2, 1)

def test_m0_baseline_rule():
    ears = [0.15, 0.20, 0.25, 0.30]
    preds = evaluate_m0_baseline(ears, threshold=0.22)
    assert preds == [0, 0, 1, 1]
