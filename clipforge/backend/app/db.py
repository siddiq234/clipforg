"""SQLite persistence for ClipForge jobs.

Tiny dependency-free store. Every function opens its own short-lived
connection, so it is safe to call from FastAPI background-task threads.
Database file: <backend>/data/clipforge.db (auto-created on first use).
"""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "clipforge.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    job_id             TEXT PRIMARY KEY,
    status             TEXT NOT NULL DEFAULT 'queued',
    progress           INTEGER NOT NULL DEFAULT 0,
    stage              TEXT NOT NULL DEFAULT 'Queued…',
    video_title        TEXT,
    video_duration_sec REAL,
    error              TEXT,
    clips_json         TEXT,
    created_at         REAL NOT NULL,
    updated_at         REAL NOT NULL
);
"""


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(_SCHEMA)


def create_job(job_id: str) -> None:
    now = time.time()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO jobs (job_id, status, progress, stage, created_at, updated_at)"
            " VALUES (?, 'queued', 0, 'Queued…', ?, ?)",
            (job_id, now, now),
        )


def get_job(job_id: str) -> dict | None:
    """Return the job as a dict, or None. `clips` is always a list."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM jobs WHERE job_id = ?", (job_id,)
        ).fetchone()
    if row is None:
        return None
    job = dict(row)
    raw_clips = job.pop("clips_json")
    job["clips"] = json.loads(raw_clips) if raw_clips else []
    return job


def update_job(job_id: str, **fields) -> None:
    """Update arbitrary job columns. Pass clips=<list> to store clip metadata."""
    if "clips" in fields:
        fields["clips_json"] = json.dumps(fields.pop("clips"))
    fields["updated_at"] = time.time()
    assignments = ", ".join(f"{key} = ?" for key in fields)
    with _connect() as conn:
        conn.execute(
            f"UPDATE jobs SET {assignments} WHERE job_id = ?",
            (*fields.values(), job_id),
        )
