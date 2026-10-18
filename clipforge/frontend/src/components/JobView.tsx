import type { Job, JobStatus } from "../types";
import { formatTime } from "../api";

interface JobViewProps {
  job: Job;
  onReset: () => void;
}

const STEPS = [
  { key: "downloading", label: "Downloading" },
  { key: "transcribing", label: "Transcribing" },
  { key: "analyzing", label: "Finding best moments" },
  { key: "rendering", label: "Rendering" },
] as const;

/** Map backend status → active step index (-1 = queued, 4 = done). */
function stepIndex(status: JobStatus): number {
  switch (status) {
    case "queued":
      return -1;
    case "downloading":
      return 0;
    case "transcribing":
      return 1;
    case "analyzing":
      return 2;
    case "rendering":
      return 3;
    case "done":
      return 4;
    case "error":
      return -2;
  }
}

/** Live job tracker: animated stage stepper + shimmer progress bar. */
export default function JobView({ job, onReset }: JobViewProps) {
  if (job.status === "error") {
    return (
      <section className="mx-auto max-w-2xl px-4 pt-28 sm:px-6">
        <div className="glass animate-pop-in rounded-3xl border-rose-500/30 p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-white">Something went wrong</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
            {job.error ?? "The clipping job failed before any clips were produced."}
          </p>
          <button
            onClick={onReset}
            className="btn-primary mt-7 rounded-full px-7 py-3 text-sm font-bold text-white"
          >
            Try another video
          </button>
        </div>
      </section>
    );
  }

  const active = stepIndex(job.status);

  return (
    <section className="mx-auto max-w-3xl px-4 pt-28 sm:px-6">
      <div className="glass animate-pop-in rounded-3xl p-6 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300/80">
              Clipping in progress
            </p>
            <h2 className="mt-2 truncate text-xl font-extrabold text-white sm:text-2xl">
              {job.video_title || "Fetching video details…"}
            </h2>
            {job.video_duration_sec > 0 && (
              <p className="mt-1 text-sm text-white/50">
                Source length: {formatTime(job.video_duration_sec)}
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3.5 py-1.5 text-sm font-extrabold text-white tabular-nums">
            {Math.round(job.progress)}%
          </span>
        </div>

        {/* progress bar */}
        <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="progress-fill h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(2, Math.min(100, job.progress))}%` }}
          />
        </div>

        {/* stage stepper */}
        <ol className="mt-8 space-y-1">
          {STEPS.map((step, i) => {
            const done = i < active || job.status === "done";
            const current = i === active;
            return (
              <li key={step.key} className="flex items-center gap-4 py-2.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300 ${
                    done
                      ? "border-transparent bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                      : current
                        ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200"
                        : "border-white/10 bg-white/5 text-white/30"
                  }`}
                >
                  {done ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : current ? (
                    <span className="h-4 w-4 rounded-full border-2 border-fuchsia-300/40 border-t-fuchsia-300 animate-spin-slow" />
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      done ? "text-white" : current ? "text-white" : "text-white/35"
                    }`}
                  >
                    {step.label}
                  </p>
                  {current && job.stage && (
                    <p className="mt-0.5 animate-pulse-soft text-xs text-fuchsia-200/70">{job.stage}</p>
                  )}
                </div>
                {current && (
                  <span className="text-xs font-medium uppercase tracking-wider text-fuchsia-300/70">
                    Working…
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-6 text-center text-xs text-white/35">
          This usually takes a couple of minutes — grab a coffee.
        </p>
      </div>
    </section>
  );
}
