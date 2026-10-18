"""Pydantic models for the ClipForge API contract (shared with the frontend)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    youtube_url: str
    max_clips: int = Field(default=5, ge=1, le=10)


class JobCreated(BaseModel):
    job_id: str
    status: str = "queued"


class Clip(BaseModel):
    id: str
    title: str
    score: int
    start_sec: float
    end_sec: float
    duration_sec: float
    transcript: str
    preview_url: str
    download_url: str
    thumbnail_url: str


class JobStatus(BaseModel):
    job_id: str
    status: str  # queued|downloading|transcribing|analyzing|rendering|done|error
    progress: int  # 0-100
    stage: str
    video_title: str | None = None
    video_duration_sec: float | None = None
    error: str | None = None
    clips: list[Clip] = []


class Health(BaseModel):
    ok: bool = True
