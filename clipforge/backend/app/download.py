"""YouTube download via yt-dlp (best mp4 at 720p or below)."""

from __future__ import annotations

from pathlib import Path

from yt_dlp import YoutubeDL


def download_video(youtube_url: str, dest: Path) -> tuple[str, float]:
    """Download *youtube_url* to *dest* (must end in .mp4).

    Returns (video_title, duration_seconds).
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    stem = dest.with_suffix("")  # yt-dlp fills in the real extension
    opts = {
        # Best video <=720p (mp4 preferred) + best audio, merged to mp4.
        "format": (
            "bv*[height<=720][ext=mp4]+ba[ext=m4a]"
            "/b[height<=720][ext=mp4]"
            "/bv*[height<=720]+ba/b[height<=720]/best"
        ),
        "merge_output_format": "mp4",
        "outtmpl": str(stem) + ".%(ext)s",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }
    with YoutubeDL(opts) as ydl:
        info = ydl.extract_info(youtube_url, download=True)

    title = info.get("title") or "Untitled video"
    duration = float(info.get("duration") or 0.0)

    # The merge step should land exactly on dest; rename as a fallback.
    if not dest.exists():
        alt = next(stem.parent.glob(stem.name + ".*"), None)
        if alt is None:
            raise RuntimeError(f"yt-dlp finished but {dest} was not created")
        alt.rename(dest)
    return title, duration
