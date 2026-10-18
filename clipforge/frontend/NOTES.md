# ClipForge — Frontend

Vite + React + TypeScript + Tailwind CSS (v4) frontend for ClipForge,
an Opus Clip-style web app that turns long YouTube videos into viral clips.

## Prerequisites

- Node.js 18+ (tested on Node 24)
- The ClipForge backend running on **http://localhost:8000**
  (a separate agent builds it; see the API contract in `src/types.ts`)

## Dev steps

```bash
cd ~/workspace/clipforge/frontend

# 1. Install dependencies (first time only)
npm install

# 2. Start the dev server (default: http://localhost:5173)
npm run dev
```

The dev server proxies `/api` and `/outputs` to `http://localhost:8000`
(see `vite.config.ts`), so the frontend works against the local backend
with no CORS setup. In production the API is same-origin.

## Other commands

```bash
npm run build    # type-check + production build → dist/
npm run preview  # serve the production build locally
```

## Project layout

```
src/
  main.tsx               # entry point
  App.tsx                # screen state machine (home → job → results) + 2s polling
  api.ts                 # fetch client for the API contract + YouTube URL validation
  types.ts               # shared types matching the backend contract exactly
  index.css              # Tailwind v4 theme, animations, glass/gradient helpers
  components/
    Logo.tsx             # SVG logo mark (scissors glyph)
    Header.tsx           # sticky glass header
    Footer.tsx
    Hero.tsx             # home: headline, URL input + paste + "Clip it ✂", features
    JobView.tsx          # animated stage stepper + shimmer progress bar + error state
    ScoreRing.tsx        # color-coded virality score ring (SVG)
    ClipCard.tsx         # 9:16 clip card
    ResultsGrid.tsx      # responsive results grid
    ClipModal.tsx        # preview modal: 9:16 video, transcript, download button
```

## API contract (must match the backend)

- `POST /api/jobs` — body `{youtube_url, max_clips? = 5}` → `{job_id, status: "queued"}`
- `GET /api/jobs/{job_id}` → `{job_id, status, progress, stage, video_title,
  video_duration_sec, error, clips[]}`
- `status`: `queued | downloading | transcribing | analyzing | rendering | done | error`
- `Clip`: `{id, title, score, start_sec, end_sec, duration_sec, transcript,
  preview_url, download_url, thumbnail_url}`
