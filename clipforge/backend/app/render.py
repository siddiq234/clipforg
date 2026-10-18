"""Vertical 1080x1920 clip rendering.

For each clip:
  1. Detect faces on a few sampled frames (OpenCV Haar cascade) and average
     the face-center x positions ("smoothed"); fall back to frame center.
  2. Scale the source to *cover* 1080x1920, then crop a 1080-wide window
     centered on the (scaled) face x.
  3. Burn karaoke word-by-word captions from an ASS file via libass
     (`subtitles` filter): bold text, lower-third, the not-yet-spoken words
     highlighted yellow with a {\\k} sweep turning them white as spoken.
  4. Extract a middle-frame 540x960 thumbnail.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import cv2
import numpy as np

TARGET_W, TARGET_H = 1080, 1920
THUMB_W, THUMB_H = 540, 960

_cascade = None  # lazily loaded Haar cascade, reused across clips


def _face_cascade() -> cv2.CascadeClassifier:
    global _cascade
    if _cascade is None:
        path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _cascade = cv2.CascadeClassifier(path)
    return _cascade


def _source_size(video_path: Path) -> tuple[int, int]:
    cap = cv2.VideoCapture(str(video_path))
    try:
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    finally:
        cap.release()
    if not w or not h:
        raise RuntimeError(f"Could not read dimensions of {video_path}")
    return w, h


def detect_face_center_x(
    video_path: Path, start_sec: float, end_sec: float, src_w: int
) -> float:
    """Average face-center x across sampled frames; frame center if none found."""
    cascade = _face_cascade()
    cap = cv2.VideoCapture(str(video_path))
    centers: list[float] = []
    try:
        for frac in (0.15, 0.35, 0.55, 0.75, 0.9):
            t = start_sec + frac * (end_sec - start_sec)
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000.0)
            ok, frame = cap.read()
            if not ok or frame is None:
                continue
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Half-res detection is ~4x faster and plenty for a crop anchor.
            small = cv2.resize(gray, (gray.shape[1] // 2, gray.shape[0] // 2))
            faces = cascade.detectMultiScale(
                small, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
            )
            if len(faces):
                x, _y, w, _h = max(faces, key=lambda f: f[2] * f[3])
                centers.append((x + w / 2.0) * 2.0)  # back to full-res coords
    finally:
        cap.release()
    if not centers:
        return src_w / 2.0
    return float(np.mean(centers))  # averaging smooths jitter between samples


def _ass_timestamp(sec: float) -> str:
    sec = max(0.0, sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    cs = int(round((sec - int(sec)) * 100))
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


# Karaoke note: with {\k}, upcoming text renders in SecondaryColour and the
# PrimaryColour sweeps across as each word is spoken. Yellow secondary + white
# primary therefore reads as "the active word is highlighted yellow".
_ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Karaoke,DejaVu Sans,64,&H00FFFFFF,&H0000FFFF,&H90000000,&H00000000,-1,0,0,0,100,100,0.5,0,1,4,1,2,60,60,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def _chunk_words(
    words: list[dict], max_words: int = 8, max_sec: float = 4.0
) -> list[list[dict]]:
    chunks, current = [], []
    for w in words:
        current.append(w)
        if len(current) >= max_words or (
            current[-1]["end"] - current[0]["start"] >= max_sec
        ):
            chunks.append(current)
            current = []
    if current:
        chunks.append(current)
    return chunks


def write_ass(words: list[dict], clip_start: float, ass_path: Path) -> None:
    """Write a karaoke ASS file; absolute word times are shifted to clip time."""
    rel = []
    for w in words:
        text = w["word"].strip()
        if not text:
            continue
        rel.append(
            {
                "start": w["start"] - clip_start,
                "end": w["end"] - clip_start,
                "word": text,
            }
        )
    rel = [w for w in rel if w["end"] > 0]

    lines = [_ASS_HEADER]
    for chunk in _chunk_words(rel):
        body = "".join(
            "{\\k%d}%s "
            % (max(1, int(round((w["end"] - w["start"]) * 100))), w["word"])
            for w in chunk
        ).rstrip()
        lines.append(
            "Dialogue: 0,%s,%s,Karaoke,,0,0,0,,%s"
            % (
                _ass_timestamp(chunk[0]["start"]),
                _ass_timestamp(chunk[-1]["end"]),
                body,
            )
        )
    ass_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _escape_subs_path(path: str) -> str:
    # The subtitles filter splits its argument on ':' — escape those, plus
    # backslashes and single quotes, then wrap in single quotes.
    return path.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")


def render_clip(job_dir: Path, clip: dict, clip_index: int) -> str:
    """Render one scored clip to vertical mp4 + jpg thumbnail.

    *clip* comes from scoring.pick_clips (needs start_sec, end_sec, words).
    Writes <clip_id>.mp4 and <clip_id>.jpg into *job_dir*; returns clip_id.
    """
    clip_id = f"clip{clip_index + 1:02d}"
    source = job_dir / "source.mp4"
    out_mp4 = job_dir / f"{clip_id}.mp4"
    out_jpg = job_dir / f"{clip_id}.jpg"
    ass_path = job_dir / f"{clip_id}.ass"

    src_w, src_h = _source_size(source)
    scale = max(TARGET_W / src_w, TARGET_H / src_h)  # "cover" the 9:16 frame
    scaled_w, scaled_h = int(src_w * scale), int(src_h * scale)

    face_x = detect_face_center_x(
        source, clip["start_sec"], clip["end_sec"], src_w
    )
    crop_x = int(min(max(face_x * scale - TARGET_W / 2, 0), max(scaled_w - TARGET_W, 0)))
    crop_y = int(max((scaled_h - TARGET_H) / 2, 0))

    write_ass(clip["words"], clip["start_sec"], ass_path)

    duration = clip["end_sec"] - clip["start_sec"]
    vf = (
        f"scale={scaled_w}:{scaled_h},"
        f"crop={TARGET_W}:{TARGET_H}:{crop_x}:{crop_y},"
        f"subtitles='{_escape_subs_path(str(ass_path))}'"
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error",
            "-ss", f"{clip['start_sec']:.2f}",
            "-t", f"{duration:.2f}",
            "-i", str(source),
            "-vf", vf,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            str(out_mp4),
        ],
        check=True,
    )

    # Middle-frame thumbnail for the clip card.
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error",
            "-ss", f"{duration / 2:.2f}",
            "-i", str(out_mp4),
            "-frames:v", "1",
            "-vf", f"scale={THUMB_W}:{THUMB_H}",
            str(out_jpg),
        ],
        check=True,
    )
    ass_path.unlink(missing_ok=True)
    return clip_id
