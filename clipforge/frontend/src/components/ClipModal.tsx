import { useEffect } from "react";
import type { Clip } from "../types";
import { formatTime } from "../api";
import ScoreRing from "./ScoreRing";

interface ClipModalProps {
  clip: Clip;
  onClose: () => void;
}

/** Full-clip modal: 9:16 preview, score, timestamps, transcript, download. */
export default function ClipModal({ clip, onClose }: ClipModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={clip.title}
    >
      <div
        className="glass animate-pop-in relative grid w-full max-w-4xl gap-6 rounded-3xl p-5 sm:p-7 md:grid-cols-[280px_1fr]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur transition hover:bg-black/80 hover:text-white"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* 9:16 preview */}
        <div className="mx-auto w-full max-w-[280px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-black shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            <video
              src={clip.preview_url}
              poster={clip.thumbnail_url || undefined}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* details */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start justify-between gap-4 pr-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300/80">
                Clip preview
              </p>
              <h3 className="mt-1.5 text-xl font-extrabold leading-tight text-white">
                {clip.title}
              </h3>
            </div>
            <ScoreRing score={clip.score} size={60} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/8 px-3 py-1.5 text-white/70 tabular-nums">
              {formatTime(clip.start_sec)} → {formatTime(clip.end_sec)}
            </span>
            <span className="rounded-full bg-white/8 px-3 py-1.5 text-white/70 tabular-nums">
              {formatTime(clip.duration_sec)} long
            </span>
            <span className="rounded-full bg-gradient-to-r from-violet-500/25 to-fuchsia-500/25 px-3 py-1.5 text-fuchsia-200">
              Score {Math.round(clip.score)}/100
            </span>
          </div>

          <div className="mt-5 min-h-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Transcript
            </p>
            <div className="mt-2 max-h-44 overflow-y-auto rounded-xl bg-black/30 p-4 text-sm leading-relaxed text-white/75">
              {clip.transcript || "No transcript available for this clip."}
            </div>
          </div>

          <a
            href={clip.download_url}
            download
            className="btn-primary mt-6 flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download clip
          </a>
          <p className="mt-2.5 text-center text-xs text-white/35">
            Ready to post — 9:16 vertical, captioned, made for Shorts &amp; Reels.
          </p>
        </div>
      </div>
    </div>
  );
}
