import type { Clip } from "../types";
import ScoreRing from "./ScoreRing";
import ClipCard from "./ClipCard";

interface ResultsGridProps {
  videoTitle: string;
  clips: Clip[];
  onSelect: (clip: Clip) => void;
  onReset: () => void;
}

/** Results: header + responsive grid of clip cards. */
export default function ResultsGrid({ videoTitle, clips, onSelect, onReset }: ResultsGridProps) {
  const sorted = [...clips].sort((a, b) => b.score - a.score);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-28 sm:px-6">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300/80">
            {clips.length} clip{clips.length === 1 ? "" : "s"} ready
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {videoTitle || "Your clips"}
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Ranked by virality score — click any clip to preview and download.
          </p>
        </div>
        <button
          onClick={onReset}
          className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          Clip another video
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="glass mt-10 rounded-3xl p-12 text-center">
          <p className="text-lg font-bold text-white">No clips this time</p>
          <p className="mt-2 text-sm text-white/55">
            The video may be too short or quiet for standout moments. Try a longer video.
          </p>
        </div>
      ) : (
        <div className="stagger mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {sorted.map((clip) => (
            <ClipCard key={clip.id} clip={clip} onSelect={onSelect} />
          ))}
        </div>
      )}

      <div className="mt-12 flex items-center justify-center gap-2 text-xs text-white/35">
        <ScoreRing score={92} size={20} strokeWidth={3} showLabel={false} />
        Scores are AI estimates of shareability — post your favorites and watch what pops.
      </div>
    </section>
  );
}
