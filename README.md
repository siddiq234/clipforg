# ✂ ClipForge

An Opus Clip-style web app: paste a YouTube link, get back vertical 9:16 clips of the best moments — auto-transcribed, smart-scored, face-tracked, with karaoke captions burned in.

## How it works

1. **Paste** a YouTube URL on the home page and hit **Clip it**.
2. The backend **downloads** the video (yt-dlp), **transcribes** it (faster-whisper, word-level timestamps), and **scores** candidate 25–55s moments with heuristics — hooks, questions, numbers, emotion words, early-video bonus — picking the top clips with a virality score.
3. Each clip is **rendered vertical (1080×1920)**: face detection keeps the speaker centered, and word-by-word karaoke captions are burned in, Opus-style.
4. **Preview** clips in the gallery, read the transcript, and **download** the MP4s.

## Quick start (Docker — recommended)

```bash
cd clipforge
docker compose up --build
```

Open http://localhost:8000. First run downloads the Whisper `small` model (~460 MB) — transcription of a 10-min video takes a few minutes on CPU.

## Local dev

**Backend** (Python 3.11, needs system `ffmpeg`):
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

**Frontend** (Node 20):
```bash
cd frontend
npm install
npm run dev        # talks to the backend via /api proxy
```

## Deploy it for real

The app needs a server (video processing can't run in a browser). Easiest options:

- **Railway / Render / Fly.io** — connect the repo, it uses the `Dockerfile` automatically. Give it at least 2 GB RAM (Whisper + ffmpeg). Expect the first transcription to be slow on shared CPUs.
- **Any VPS** (Hetzner, DigitalOcean…) — `docker compose up -d --build`, put Caddy/Nginx in front for HTTPS.

## Honest limitations

- **YouTube fights downloaders.** yt-dlp breaks or gets rate-limited periodically — if downloads start failing, bump the `yt-dlp` pin in `backend/requirements.txt` and rebuild.
- **"AI picks" are heuristic**, not a giant LLM: hook-phrase/energy scoring over the transcript. Great for talking-head / podcast / commentary videos; weaker for music or vlogs with little speech.
- **CPU is slow.** A 10-minute video ≈ several minutes to transcribe + render per clip. A GPU box makes it fly.
- **No auth.** Don't expose it to the public internet without adding a login — it's built for personal use.
- **Copyright:** only clip videos you own or have rights to reuse.
"# clipforg" 
