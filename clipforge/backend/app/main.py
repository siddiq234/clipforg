"""ClipForge backend — FastAPI app.

Routes:
  POST /api/jobs            create a clipping job (runs in background)
  GET  /api/jobs/{job_id}   poll job status / progress / clips
  GET  /api/health          liveness check

Static:
  /outputs/...             rendered clip mp4s + thumbnails (data/jobs/...)
  /                        built frontend (../frontend/dist) with SPA fallback,
                           mounted only if the dist folder exists.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from . import db, models
from .pipeline import JOBS_DIR, run_job

BASE_DIR = Path(__file__).resolve().parents[1]  # ~/workspace/clipforge/backend
FRONTEND_DIST = BASE_DIR.parents[0] / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="ClipForge", version="0.1.0", lifespan=lifespan)


def _is_youtube_url(url: str) -> bool:
    lowered = url.strip().lower()
    return "youtube.com" in lowered or "youtu.be" in lowered


@app.post("/api/jobs", response_model=models.JobCreated)
def create_job(payload: models.JobCreate, background_tasks: BackgroundTasks):
    if not _is_youtube_url(payload.youtube_url):
        raise HTTPException(status_code=400, detail="Only YouTube URLs are supported.")
    job_id = uuid4().hex[:12]
    db.create_job(job_id)
    background_tasks.add_task(run_job, job_id, payload.youtube_url, payload.max_clips)
    return models.JobCreated(job_id=job_id)


@app.get("/api/jobs/{job_id}", response_model=models.JobStatus)
def get_job(job_id: str):
    job = db.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    return models.JobStatus(**job)


@app.get("/api/health", response_model=models.Health)
def health():
    return models.Health()


# Rendered clips + thumbnails, e.g. /outputs/<job_id>/clip01.mp4
app.mount("/outputs", StaticFiles(directory=str(JOBS_DIR)), name="outputs")


class _SPAStaticFiles(StaticFiles):
    """StaticFiles with an index.html fallback for SPA client-side routes."""

    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except HTTPException as exc:
            if exc.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


try:
    if FRONTEND_DIST.is_dir() and (FRONTEND_DIST / "index.html").is_file():
        # Mounted LAST so /api/* and /outputs/* keep routing priority.
        app.mount(
            "/", _SPAStaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend"
        )
except Exception as exc:  # API-only mode when no frontend is built yet
    print(f"[clipforge] frontend not mounted ({exc}); running API-only")
