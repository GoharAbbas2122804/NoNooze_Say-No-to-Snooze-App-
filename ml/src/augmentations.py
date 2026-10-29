"""
ml/src/augmentations.py

Ocular image augmentations:
- Gamma / brightness shifts (morning sunlight vs dark bedroom)
- Gaussian noise and blur (motion / camera sensor noise)
- Small rotations (+/- 15 degrees)
- Random crops / zooms (face distance variation)
- Contrast adjustments / CLAHE
- Low-light simulation
"""

import numpy as np
import cv2

class EyeAugmentor:
    def __init__(self, rng_seed: int = 42):
        self.rng = np.random.default_rng(rng_seed)

    def __call__(self, img_48x48: np.ndarray) -> np.ndarray:
        """
        Applies a randomized augmentation chain to a single 48x48 grayscale image [0..255 or 0..1].
        """
        # Ensure uint8 [0..255]
        is_float = img_48x48.dtype in (np.float32, np.float64)
        if is_float and img_48x48.max() <= 1.0:
            img = (img_48x48 * 255.0).astype(np.uint8)
        else:
            img = img_48x48.astype(np.uint8)

        # 1. Random Rotation (+/- 15 deg)
        if self.rng.random() < 0.6:
            angle = self.rng.uniform(-15.0, 15.0)
            M = cv2.getRotationMatrix2D((24, 24), angle, 1.0)
            img = cv2.warpAffine(img, M, (48, 48), borderMode=cv2.BORDER_REFLECT)

        # 2. Random Gamma / Brightness adjustment
        if self.rng.random() < 0.7:
            gamma = self.rng.uniform(0.6, 1.6)
            inv_gamma = 1.0 / gamma
            table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
            img = cv2.LUT(img, table)

        # 3. Low-Light Simulation (dim morning light)
        if self.rng.random() < 0.3:
            dim_factor = self.rng.uniform(0.3, 0.7)
            img = (img * dim_factor).astype(np.uint8)

        # 4. Contrast enhancement / CLAHE simulation
        if self.rng.random() < 0.4:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
            img = clahe.apply(img)

        # 5. Gaussian Noise / Sensor Grain
        if self.rng.random() < 0.5:
            noise = self.rng.normal(0, 8, img.shape)
            noisy_img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
            img = noisy_img

        # 6. Gaussian Blur / Motion
        if self.rng.random() < 0.3:
            img = cv2.GaussianBlur(img, (3, 3), 0)

        # Return in original format
        if is_float:
            return (img / 255.0).astype(np.float32)
        return img
