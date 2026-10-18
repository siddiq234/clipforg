# ClipForge backend — local run notes

## Prereqs

- **Python 3.11**
- **System ffmpeg with libass** (needed for the `subtitles` filter that burns
  karaoke captions) **plus a caption font**. The backend never installs ffmpeg
  itself — install it with your OS package manager:
  - Ubuntu/Debian: `sudo apt install ffmpeg fonts-dejavu`
  - macOS: `brew install ffmpeg` (ships usable fontconfig defaults)

## Setup

```bash
cd ~/workspace/clipforge/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## First run

- The faster-whisper `"small"` model (~460 MB) downloads automatically on the
  first transcription and is cached under `~/.cache/huggingface` afterwards.
- OpenCV's Haar face cascade ships inside `opencv-python-headless` — no extra
  download needed.

## Run the API

```bash
# from ~/workspace/clipforge/backend, venv active
uvicorn app.main:app --port 8000
```

- Health check: http://localhost:8000/api/health → `{"ok": true}`
- Create a job: `POST http://localhost:8000/api/jobs`
  `{"youtube_url": "https://www.youtube.com/watch?v=…", "max_clips": 5}`
- Poll it: `GET http://localhost:8000/api/jobs/<job_id>`
- Clips land at `http://localhost:8000/outputs/<job_id>/clip01.mp4`
  (thumbnails at `…/clip01.jpg`).

If `../frontend/dist` exists it is served at `/` with an `index.html`
fallback for SPA routes; otherwise the backend runs in API-only mode.

## Layout

| Path | What |
|---|---|
| `app/main.py` | FastAPI app, routes, static mounts |
| `app/pipeline.py` | Background job orchestration + progress updates |
| `app/download.py` | yt-dlp download (best mp4 ≤ 720p) |
| `app/transcribe.py` | faster-whisper transcription, word timestamps |
| `app/scoring.py` | Candidate windows + virality-score heuristics |
| `app/render.py` | Face-centered 1080×1920 render, karaoke captions, thumbnails |
| `app/db.py` | SQLite job store |
| `app/models.py` | Pydantic API contract |
| `data/clipforge.db` | Job store (auto-created) |
| `data/jobs/<job_id>/` | `source.mp4`, rendered clips, temp `.ass`/`.wav` |

## Notes / gotchas

- Long videos take a while: download + whisper-`small` on CPU + one ffmpeg
  pass per clip. Progress is visible via the job's `progress`/`stage` fields.
- `yt-dlp` needs to stay reasonably fresh for YouTube; bump the pin in
  `requirements.txt` if downloads start failing with extractor errors.
- Karaoke caption colors: upcoming words render yellow, turning white as they
  are spoken (ASS `{\k}` sweep, burned with libass).
