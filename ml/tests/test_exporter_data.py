from pathlib import Path

import pytest

from ml.tools.export_production_model import label_for_eye_image


@pytest.mark.parametrize(
    ("path", "expected"),
    [
        ("mrl/s0001/s0001_00001_0_0_0_0_0_01.png", 0),
        ("mrl/s0001/s0001_00002_1_0_0_0_0_01.png", 1),
        ("cew/openEyes/cew_open_001.png", 1),
        ("cew/closedEyes/cew_closed_001.png", 0),
        ("own/crops/phone_user_01_crop_0003_0.png", 0),
        ("own/crops/phone_user_01_crop_0004_1.png", 1),
    ],
)
def test_eye_labels_come_from_dataset_format_not_any_filename_digit(path, expected):
    assert label_for_eye_image(Path(path)) == expected


def test_unknown_label_format_is_rejected():
    with pytest.raises(ValueError, match="Cannot determine eye label"):
        label_for_eye_image(Path("unknown/image_0001.png"))
