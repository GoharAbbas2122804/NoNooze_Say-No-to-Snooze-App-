"""
ml/src/dataset.py

Dataset loading, subject-level partitioning, and split validation.
Enforces zero subject leakage across train, val, and test partitions.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple, Set, Optional
import numpy as np
import os

@dataclass(frozen=True)
class EyeSample:
    path: str
    label: int # 0=closed, 1=open
    subject_id: str
    domain: str # 'mrl_ir', 'cew_rgb', 'phone_rgb'
    lighting: str # 'dark', 'dim', 'bright', 'unknown'
    glasses: str # 'yes', 'no', 'unknown'

def verify_no_subject_leakage(
    train_samples: List[EyeSample],
    val_samples: List[EyeSample],
    test_samples: List[EyeSample]
) -> None:
    """
    Verifies that no subject identifier appears in more than one partition.
    Raises ValueError on any violation.
    """
    train_subjects = {s.subject_id for s in train_samples if s.subject_id != "unassigned"}
    val_subjects = {s.subject_id for s in val_samples if s.subject_id != "unassigned"}
    test_subjects = {s.subject_id for s in test_samples if s.subject_id != "unassigned"}

    train_val_leak = train_subjects.intersection(val_subjects)
    if train_val_leak:
        raise ValueError(f"Subject leakage between train and val: {train_val_leak}")

    train_test_leak = train_subjects.intersection(test_subjects)
    if train_test_leak:
        raise ValueError(f"Subject leakage between train and test: {train_test_leak}")

    val_test_leak = val_subjects.intersection(test_subjects)
    if val_test_leak:
        raise ValueError(f"Subject leakage between val and test: {val_test_leak}")

def split_by_subject(
    samples: List[EyeSample],
    test_subject_ids: Set[str],
    val_ratio: float = 0.15,
    seed: int = 42
) -> Tuple[List[EyeSample], List[EyeSample], List[EyeSample]]:
    """
    Partitions samples into train, val, and test subsets based on subject IDs.
    """
    test_set = [s for s in samples if s.subject_id in test_subject_ids]
    remaining = [s for s in samples if s.subject_id not in test_subject_ids]

    # Group remaining by subject
    unique_subjects = sorted(list({s.subject_id for s in remaining}))
    rng = np.random.default_rng(seed)
    rng.shuffle(unique_subjects)

    n_val_subs = max(1, int(len(unique_subjects) * val_ratio))
    val_subs = set(unique_subjects[:n_val_subs])
    train_subs = set(unique_subjects[n_val_subs:])

    val_set = [s for s in remaining if s.subject_id in val_subs]
    train_set = [s for s in remaining if s.subject_id in train_subs]

    # Verify invariant
    verify_no_subject_leakage(train_set, val_set, test_set)

    return train_set, val_set, test_set

def load_dataset_from_directory(base_dir: Path) -> List[EyeSample]:
    """
    Loads samples from directory containing mrl/, cew/, or own/ folders.
    """
    samples: List[EyeSample] = []

    # 1. MRL format
    mrl_dir = base_dir / "mrl"
    if mrl_dir.exists():
        for sub_dir in mrl_dir.iterdir():
            if not sub_dir.is_dir():
                continue
            sub_id = sub_dir.name
            for img_path in sub_dir.glob("*.png"):
                parts = img_path.stem.split("_")
                label = int(parts[2]) if len(parts) > 2 and parts[2] in ("0", "1") else 1
                samples.append(EyeSample(
                    path=str(img_path),
                    label=label,
                    subject_id=sub_id,
                    domain="mrl_ir",
                    lighting="controlled",
                    glasses="yes" if "glasses" in img_path.name else "no"
                ))

    # 2. CEW format
    cew_dir = base_dir / "cew"
    if cew_dir.exists():
        open_dir = cew_dir / "openEyes"
        if open_dir.exists():
            for p in open_dir.glob("*.jpg"):
                samples.append(EyeSample(
                    path=str(p),
                    label=1,
                    subject_id=f"cew_{p.stem}",
                    domain="cew_rgb",
                    lighting="wild",
                    glasses="unknown"
                ))
        closed_dir = cew_dir / "closedEyes"
        if closed_dir.exists():
            for p in closed_dir.glob("*.jpg"):
                samples.append(EyeSample(
                    path=str(p),
                    label=0,
                    subject_id=f"cew_{p.stem}",
                    domain="cew_rgb",
                    lighting="wild",
                    glasses="unknown"
                ))

    # 3. Own crops format
    own_dir = base_dir / "own" / "crops"
    if own_dir.exists():
        for p in own_dir.glob("*.png"):
            parts = p.stem.split("_")
            sub_id = parts[0] if len(parts) > 0 else "phone_user"
            label = int(parts[-1]) if len(parts) > 1 and parts[-1] in ("0", "1") else 1
            samples.append(EyeSample(
                path=str(p),
                label=label,
                subject_id=sub_id,
                domain="phone_rgb",
                lighting="morning",
                glasses="no"
            ))

    return samples
