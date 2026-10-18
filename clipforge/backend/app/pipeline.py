"""Job pipeline: download → transcribe → score → render, with DB progress.

Runs as a FastAPI BackgroundTask (see app.main). Every stage updates the
job row so the frontend can poll GET /api/jobs/{job_id} for live progress.
Any exception flips the job to status="error" with the message attached.
"""

from __future__ import annotations

from pathlib import Path

from . import db, download, render, scoring, transcribe

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
JOBS_DIR = DATA_DIR / "jobs"


def run_job(job_id: str, youtube_url: str, max_clips: int = 5) -> None:
    job_dir = JOBS_DIR / job_id
    try:
        db.update_job(
            job_id, status="downloading", progress=5, stage="Downloading video…"
        )
        title, duration = download.download_video(youtube_url, job_dir / "source.mp4")

        db.update_job(
            job_id,
            status="transcribing",
            progress=20,
            stage="Transcribing audio…",
            video_title=title,
            video_duration_sec=duration,
        )
        segments = transcribe.transcribe(job_dir / "source.mp4")

        db.update_job(
            job_id, status="analyzing", progress=45, stage="Finding the best moments…"
        )
        clips = scoring.pick_clips(segments, duration, max_clips=max_clips)

        db.update_job(
            job_id, status="rendering", progress=60, stage="Rendering vertical clips…"
        )
        finished = []
        total = len(clips)
        for i, clip in enumerate(clips):
            clip_id = render.render_clip(job_dir, clip, i)
            finished.append(
                {
                    "id": clip_id,
                    "title": clip["title"],
                    "score": clip["score"],
                    "start_sec": clip["start_sec"],
                    "end_sec": clip["end_sec"],
                    "duration_sec": clip["duration_sec"],
                    "transcript": clip["transcript"],
                    # preview and download point at the same mp4; the frontend
                    # uses <video> for preview and <a download> for download.
                    "preview_url": f"/outputs/{job_id}/{clip_id}.mp4",
                    "download_url": f"/outputs/{job_id}/{clip_id}.mp4",
                    "thumbnail_url": f"/outputs/{job_id}/{clip_id}.jpg",
                }
            )
            pct = 60 + int(35 * (i + 1) / max(total, 1))
            db.update_job(
                job_id, progress=pct, stage=f"Rendering clip {i + 1} of {total}…"
            )

        db.update_job(
            job_id, status="done", progress=100, stage="Done", clips=finished, error=None
        )
    except Exception as exc:  # surface any failure on the job record
        db.update_job(
            job_id,
            status="error",
            stage="Failed",
            error=f"{type(exc).__name__}: {exc}"[:1000],
        )
