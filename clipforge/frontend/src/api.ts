import type {
  CreateJobRequest,
  CreateJobResponse,
  Job,
} from "./types";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
      else if (typeof body?.error === "string") detail = body.error;
    } catch {
      /* keep generic message */
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

/** POST /api/jobs — enqueue a new clipping job. */
export async function createJob(
  youtube_url: string,
  max_clips: number = 5,
): Promise<CreateJobResponse> {
  const body: CreateJobRequest = { youtube_url, max_clips };
  const res = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<CreateJobResponse>(res);
}

/** GET /api/jobs/{job_id} — fetch current job state. */
export async function getJob(job_id: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${encodeURIComponent(job_id)}`);
  return handleResponse<Job>(res);
}

/**
 * Loose but useful check that a string looks like a YouTube video URL.
 * Accepts youtube.com/watch, youtu.be, /shorts/, /embed/, /live/, music.youtube.com.
 */
export function isYouTubeUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const pattern =
    /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/(watch\?|shorts\/|embed\/|live\/)|youtu\.be\/)[\w\-?&=%.#/;+~:@!$'()*,\s]*$/i;
  return pattern.test(v);
}

/** Format seconds as m:ss, e.g. 95 -> "1:35". */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest.toString().padStart(2, "0")}`;
}
