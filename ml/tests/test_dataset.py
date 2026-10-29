import pytest
from ml.src.dataset import (
    EyeSample,
    split_by_subject,
    verify_no_subject_leakage,
)

def test_split_by_subject_disjoint_partitions():
    samples = []
    # 5 subjects: s1 to s5
    for s_idx in range(1, 6):
        sub_id = f"s{s_idx}"
        for f_idx in range(4):
            samples.append(EyeSample(
                path=f"dummy/{sub_id}_{f_idx}.png",
                label=f_idx % 2,
                subject_id=sub_id,
                domain="mrl_ir",
                lighting="bright",
                glasses="no"
            ))

    test_subs = {"s4", "s5"}
    train, val, test = split_by_subject(samples, test_subject_ids=test_subs, val_ratio=0.33, seed=1)

    # 1. Test set contains exactly and only test_subs
    assert {s.subject_id for s in test} == test_subs

    # 2. Check disjointness
    train_subs = {s.subject_id for s in train}
    val_subs = {s.subject_id for s in val}

    assert train_subs.isdisjoint(test_subs)
    assert val_subs.isdisjoint(test_subs)
    assert train_subs.isdisjoint(val_subs)

def test_leakage_verifier_raises_on_subject_overlap():
    sample_a = EyeSample("a.png", 1, "subject_alpha", "mrl", "ok", "no")
    sample_b = EyeSample("b.png", 0, "subject_beta", "mrl", "ok", "no")
    sample_leak = EyeSample("c.png", 1, "subject_alpha", "mrl", "ok", "no")

    # Clean splits: must not raise
    verify_no_subject_leakage([sample_a], [sample_b], [])

    # Leaking subject_alpha in both train and test: MUST raise ValueError
    with pytest.raises(ValueError, match="Subject leakage"):
        verify_no_subject_leakage([sample_a], [sample_b], [sample_leak])
