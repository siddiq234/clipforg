"""Speech-to-text with faster-whisper, keeping word-level timestamps.

The word timings drive both clip scoring (sentence reconstruction) and the
karaoke-style burned captions, so they are the heart of the pipeline.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

_MODEL = None  # lazily loaded, then reused across jobs in this process


def _get_model():
    global _MODEL
    if _MODEL is None:
        from faster_whisper import WhisperModel

        # "small" + int8 on CPU is the sweet spot for a small VPS box:
        # good enough word timings for captions without a GPU.
        # Downloads (~460 MB) automatically on first use.
        _MODEL = WhisperModel("small", device="cpu", compute_type="int8")
    return _MODEL


def _extract_wav(video_path: Path, wav_path: Path) -> None:
    # Decode to 16 kHz mono PCM first: whisper wants raw audio and this
    # sidesteps any container quirks in the downloaded mp4.
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(video_path),
            "-ac", "1", "-ar", "16000",
            "-c:a", "pcm_s16le", str(wav_path),
        ],
        check=True,
    )


def transcribe(video_path: Path) -> list[dict]:
    """Transcribe *video_path*.

    Returns a list of segments:
        {"start": float, "end": float, "text": str,
         "words": [{"start": float, "end": float, "word": str}]}
    """
    wav_path = video_path.with_suffix(".wav")
    _extract_wav(video_path, wav_path)
    try:
        model = _get_model()
        segments_iter, _info = model.transcribe(
            str(wav_path), word_timestamps=True, vad_filter=True
        )
        segments = []
        for seg in segments_iter:
            words = [
                {"start": float(w.start), "end": float(w.end), "word": w.word}
                for w in (seg.words or [])
            ]
            segments.append(
                {
                    "start": float(seg.start),
                    "end": float(seg.end),
                    "text": seg.text.strip(),
                    "words": words,
                }
            )
        return segments
    finally:
        wav_path.unlink(missing_ok=True)
