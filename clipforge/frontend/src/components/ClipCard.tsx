import type { Clip } from "../types";
import { formatTime } from "../api";
import ScoreRing from "./ScoreRing";

interface ClipCardProps {
  clip: Clip;
  onSelect: (clip: Clip) => void;
}

/** 9:16 clip card for the results grid. */
export default function ClipCard({ clip, onSelect }: ClipCardProps) {
  return (
    <button
      onClick={() => onSelect(clip)}
      className="group glass overflow-hidden rounded-2xl text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-fuchsia-400/40 hover:shadow-[0_20px_50px_-12px_rgba(217,70,239,0.45)]"
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-[#14141f]">
        {clip.thumbnail_url ? (
          <img
            src={clip.thumbnail_url}
            alt={clip.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-violet-900/50 to-fuchsia-900/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

        {/* score ring */}
        <div className="absolute right-2.5 top-2.5">
          <ScoreRing score={clip.score} size={46} strokeWidth={4.5} />
        </div>

        {/* duration badge */}
        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur tabular-nums">
          {formatTime(clip.duration_sec)}
        </span>

        {/* hover play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-bold leading-snug text-white">
          {clip.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/50">
          {clip.transcript || "Transcript coming right up…"}
        </p>
        <p className="mt-2 text-[11px] font-medium text-white/35 tabular-nums">
          {formatTime(clip.start_sec)} → {formatTime(clip.end_sec)}
        </p>
      </div>
    </button>
  );
}
