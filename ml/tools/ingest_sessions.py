#!/usr/bin/env python3
"""
ingest_sessions.py

Ingests JSONL session exports produced by src/wake/dev/collector.ts
and compiles them into standardized train/eval datasets.
"""

import json
import base64
import os
import argparse
from pathlib import Path
import numpy as np
from PIL import Image
import io

def parse_session_file(file_path: Path):
    """
    Parses a single JSONL session file.
    Returns:
        header: dict
        frames: list of dict
        footer: dict or None
    """
    header = None
    footer = None
    frames = []

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            rtype = record.get("type")
            if rtype == "session_header":
                header = record
            elif rtype == "session_footer":
                footer = record
            elif rtype == "frame":
                frames.append(record)

    return header, frames, footer

def ingest_directory(input_dir: Path, output_dir: Path):
    """
    Ingests all .jsonl files in input_dir and saves extracted crops and metadata.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    crops_dir = output_dir / "crops"
    crops_dir.mkdir(exist_ok=True)

    records = []
    crops_saved = 0

    for jsonl_file in input_dir.glob("*.jsonl"):
        header, frames, _ = parse_session_file(jsonl_file)
        if not header:
            continue

        subject_id = header.get("subjectId", "unknown")
        posture = header.get("posture", "unknown")
        eyes_label = header.get("eyes", "mixed")
        lighting = header.get("lighting", "ok")
        glasses = header.get("glasses", "no")

        for i, frame in enumerate(frames):
            crop_b64 = frame.get("cropBase64")
            crop_path = None

            if crop_b64:
                try:
                    img_bytes = base64.b64decode(crop_b64)
                    img = Image.open(io.BytesIO(img_bytes)).convert("L") # 48x48 grayscale
                    img = img.resize((48, 48))
                    filename = f"{subject_id}_{jsonl_file.stem}_f{i:05d}.png"
                    save_path = crops_dir / filename
                    img.save(save_path)
                    crop_path = str(save_path.relative_to(output_dir))
                    crops_saved += 1
                except Exception as e:
                    print(f"Warning: Failed to decode crop in {jsonl_file}: {e}")

            signals = frame.get("signals", {})
            records.append({
                "subject_id": subject_id,
                "posture": posture,
                "eyes": eyes_label,
                "lighting": lighting,
                "glasses": glasses,
                "t": frame.get("t", 0),
                "crop_path": crop_path,
                "eyes_open_fused": signals.get("eyesOpen", 0.0),
                "yaw": signals.get("yaw", 0.0),
                "pitch": signals.get("pitch", 0.0),
                "upright": signals.get("upright", 1.0),
            })

    # Save manifest
    manifest_path = output_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"Ingested {len(records)} frame records ({crops_saved} image crops saved) into {output_dir}")
    return records

def main():
    parser = argparse.ArgumentParser(description="Ingest collected wake check sessions.")
    parser.add_argument("--input", type=str, required=True, help="Input directory containing .jsonl sessions")
    parser.add_argument("--output", type=str, required=True, help="Output directory for processed dataset")
    args = parser.parse_args()

    ingest_directory(Path(args.input), Path(args.output))

if __name__ == "__main__":
    main()
