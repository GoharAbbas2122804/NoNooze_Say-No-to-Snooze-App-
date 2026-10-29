#!/usr/bin/env python3
"""
generate_mock_dataset.py

Generates synthetic 48x48 eye datasets formatted as MRL, CEW, and own RGB crops
for local pipeline verification and CI tests.
"""

import os
from pathlib import Path
import numpy as np
from PIL import Image

def generate_mock_datasets(base_dir: Path):
    """
    Creates synthetic MRL (IR), CEW (RGB face eye crops), and own collector datasets.
    """
    np.random.seed(42)

    # 1. MRL Eye format: directories per subject (e.g. s0001, s0002, ...)
    # Filename format: s0001_00001_0_0_0_0_0_01.png where index 4 is eye state (0=closed, 1=open)
    mrl_dir = base_dir / "mrl"
    mrl_dir.mkdir(parents=True, exist_ok=True)
    mrl_subjects = [f"s{i:04d}" for i in range(1, 11)]

    for sub in mrl_subjects:
        sub_dir = mrl_dir / sub
        sub_dir.mkdir(exist_ok=True)
        for i in range(10): # 10 frames per subject (5 open, 5 closed)
            is_open = 1 if i % 2 == 0 else 0
            fname = f"{sub}_{i:05d}_{is_open}_0_0_0_0_01.png"
            # Grayscale 48x48: open eyes have higher central brightness
            arr = np.random.randint(40, 100, (48, 48), dtype=np.uint8)
            if is_open:
                arr[18:30, 18:30] = np.random.randint(180, 240, (12, 12), dtype=np.uint8)
            Image.fromarray(arr).save(sub_dir / fname)

    # 2. CEW format: folders 'openEyes' and 'closedEyes'
    cew_dir = base_dir / "cew"
    (cew_dir / "openEyes").mkdir(parents=True, exist_ok=True)
    (cew_dir / "closedEyes").mkdir(parents=True, exist_ok=True)

    for i in range(20):
        # Open
        open_arr = np.random.randint(50, 120, (48, 48), dtype=np.uint8)
        open_arr[18:30, 18:30] = np.random.randint(190, 255, (12, 12), dtype=np.uint8)
        Image.fromarray(open_arr).save(cew_dir / "openEyes" / f"cew_open_{i:04d}.jpg")

        # Closed
        closed_arr = np.random.randint(40, 90, (48, 48), dtype=np.uint8)
        Image.fromarray(closed_arr).save(cew_dir / "closedEyes" / f"cew_closed_{i:04d}.jpg")

    # 3. Own RGB crops: JSONL session plus crops
    own_dir = base_dir / "own"
    crops_dir = own_dir / "crops"
    crops_dir.mkdir(parents=True, exist_ok=True)

    own_subjects = [f"phone_user_{i:02d}" for i in range(1, 6)]
    for sub in own_subjects:
        for i in range(10):
            is_open = 1 if i % 2 == 0 else 0
            fname = f"{sub}_crop_{i:04d}_{is_open}.png"
            arr = np.random.randint(45, 110, (48, 48), dtype=np.uint8)
            if is_open:
                arr[20:28, 20:28] = np.random.randint(200, 250, (8, 8), dtype=np.uint8)
            Image.fromarray(arr).save(crops_dir / fname)

    print(f"Generated mock datasets in {base_dir}")

if __name__ == "__main__":
    generate_mock_datasets(Path("ml/mock_data"))
