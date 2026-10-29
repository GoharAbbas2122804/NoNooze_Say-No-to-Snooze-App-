"""
ml/src/models.py

Model topologies for ocular openness detection:
- M0: Heuristic baselines (ML Kit & EAR rule)
- M1: From-scratch custom CNN (<100k parameters, target production model)
- M2: MobileNetV2-0.35 Transfer baseline
- M3: Depthwise-Separable lightweight variant
"""

import tensorflow as tf
from tensorflow.keras import layers, models

def build_m1_eye_cnn(input_shape=(48, 48, 1)) -> tf.keras.Model:
    """
    Builds our custom 4-block CNN trained from scratch.
    Target: < 100k parameters, < 400 KB TFLite, <= 5 ms edge inference.
    """
    inputs = layers.Input(shape=input_shape, name="eye_input")

    # Block 1 (48x48 -> 24x24)
    x = layers.Conv2D(16, (3, 3), padding="same", use_bias=False, name="conv1")(inputs)
    x = layers.BatchNormalization(name="bn1")(x)
    x = layers.ReLU(name="relu1")(x)
    x = layers.MaxPooling2D((2, 2), name="pool1")(x)

    # Block 2 (24x24 -> 12x12)
    x = layers.Conv2D(32, (3, 3), padding="same", use_bias=False, name="conv2")(x)
    x = layers.BatchNormalization(name="bn2")(x)
    x = layers.ReLU(name="relu2")(x)
    x = layers.MaxPooling2D((2, 2), name="pool2")(x)

    # Block 3 (12x12 -> 6x6)
    x = layers.Conv2D(64, (3, 3), padding="same", use_bias=False, name="conv3")(x)
    x = layers.BatchNormalization(name="bn3")(x)
    x = layers.ReLU(name="relu3")(x)
    x = layers.MaxPooling2D((2, 2), name="pool3")(x)

    # Block 4 (6x6 -> 6x6)
    x = layers.Conv2D(64, (3, 3), padding="same", use_bias=False, name="conv4")(x)
    x = layers.BatchNormalization(name="bn4")(x)
    x = layers.ReLU(name="relu4")(x)

    # Global Average Pooling & Classification Head
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.Dropout(0.2, name="dropout")(x)
    outputs = layers.Dense(1, activation="sigmoid", name="eye_state")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="NoNooze_Eye_CNN_M1")
    return model

def build_m2_mobilenet(input_shape=(48, 48, 1)) -> tf.keras.Model:
    """
    Reference MobileNetV2 with alpha=0.35.
    Expands 1-channel to 3-channel for standard backbone compatibility.
    """
    inputs = layers.Input(shape=input_shape, name="input_1ch")
    x = layers.Concatenate(axis=-1)([inputs, inputs, inputs]) # 1ch -> 3ch

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(48, 48, 3),
        alpha=0.35,
        include_top=False,
        weights=None
    )
    x = base_model(x)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(1, activation="sigmoid", name="mobilenet_output")(x)

    return tf.keras.Model(inputs=inputs, outputs=outputs, name="MobileNetV2_035_M2")

def build_m3_separable(input_shape=(48, 48, 1)) -> tf.keras.Model:
    """
    Depthwise-Separable variant of M1 for ultra-low power devices.
    """
    inputs = layers.Input(shape=input_shape, name="sep_input")

    x = layers.Conv2D(16, (3, 3), padding="same", use_bias=False)(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D((2, 2))(x)

    # Separable Block 1
    x = layers.SeparableConv2D(32, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D((2, 2))(x)

    # Separable Block 2
    x = layers.SeparableConv2D(64, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D((2, 2))(x)

    x = layers.GlobalAveragePooling2D()(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)

    return tf.keras.Model(inputs=inputs, outputs=outputs, name="Separable_CNN_M3")

def evaluate_m0_baseline(ear_values: list[float], threshold: float = 0.22) -> list[int]:
    """
    Evaluates rule-based Eye Aspect Ratio (EAR) baseline.
    Returns 1 if EAR >= threshold (open), else 0 (closed).
    """
    return [1 if v >= threshold else 0 for v in ear_values]
