import json
import base64
import tempfile
from pathlib import Path
import numpy as np
from PIL import Image
import io
import pytest

from ml.tools.ingest_sessions import parse_session_file, ingest_directory

def test_parse_and_ingest_sessions(tmp_path: Path):
    # Create mock session JSONL
    session_file = tmp_path / "test_session.jsonl"
    img = Image.new("L", (48, 48), color=128)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    crop_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    lines = [
        json.dumps({
            "type": "session_header",
            "subjectId": "tester_99",
            "posture": "sitting",
            "eyes": "open",
            "lighting": "bright",
            "glasses": "no",
        }),
        json.dumps({
            "type": "frame",
            "t": 1000,
            "cropBase64": crop_b64,
            "signals": {"eyesOpen": 0.85, "yaw": 5.0, "pitch": -2.0, "upright": 1.0},
        }),
        json.dumps({
            "type": "session_footer",
            "totalFrames": 1,
        }),
    ]

    session_file.write_text("\n".join(lines), encoding="utf-8")

    # Ingest
    out_dir = tmp_path / "processed"
    records = ingest_directory(tmp_path, out_dir)

    assert len(records) == 1
    rec = records[0]
    assert rec["subject_id"] == "tester_99"
    assert rec["posture"] == "sitting"
    assert rec["eyes_open_fused"] == 0.85
    assert rec["crop_path"] is not None

    saved_crop = out_dir / rec["crop_path"]
    assert saved_crop.exists()
    crop_img = Image.open(saved_crop)
    assert crop_img.size == (48, 48)
