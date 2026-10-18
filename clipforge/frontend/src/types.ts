/**
 * ClipForge API contract — mirrors the backend exactly.
 * A separate agent builds the backend; these types must stay in sync.
 */

/** Job lifecycle states returned by the backend. */
export type JobStatus =
  | "queued"
  | "downloading"
  | "transcribing"
  | "analyzing"
  | "rendering"
  | "done"
  | "error";

/** A single generated short-form clip. */
export interface Clip {
  id: string;
  title: string;
  /** Virality score, 0–100. */
  score: number;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  transcript: string;
  preview_url: string;
  download_url: string;
  thumbnail_url: string;
}

/** Full job record returned by GET /api/jobs/{job_id}. */
export interface Job {
  job_id: string;
  status: JobStatus;
  /** 0–100 integer. */
  progress: number;
  stage: string;
  video_title: string;
  video_duration_sec: number;
  error: string | null;
  clips: Clip[];
}

/** POST /api/jobs request body. */
export interface CreateJobRequest {
  youtube_url: string;
  /** Optional; backend defaults to 5. */
  max_clips?: number;
}

/** POST /api/jobs response body. */
export interface CreateJobResponse {
  job_id: string;
  status: "queued";
}
