import { useState } from "react";
import type { FormEvent } from "react";
import { isYouTubeUrl } from "../api";
import ScoreRing from "./ScoreRing";

interface HeroProps {
  onSubmit: (url: string) => void;
  submitting: boolean;
  submitError: string | null;
}

const FEATURES = ["Auto captions", "Smart reframing", "Virality score"];

/** Landing hero: headline, URL input, feature bullets, floating mock clip visual. */
export default function Hero({ onSubmit, submitting, submitError }: HeroProps) {
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);

  const valid = isYouTubeUrl(url);
  const showError = touched && url.trim().length > 0 && !valid;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid && !submitting) onSubmit(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setTouched(true);
      }
    } catch {
      /* clipboard unavailable — user can paste manually */
    }
  };

  return (
    <section className="relative overflow-hidden pt-16">
      {/* ambient gradient orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[140px]" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-[120px]" />
        <div className="absolute top-64 -right-24 h-72 w-72 rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-fuchsia-200">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse-soft" />
            AI-powered clipping
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Turn long videos
            <br />
            into <span className="text-gradient">viral clips</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
            Paste a YouTube link and ClipForge finds the moments worth sharing —
            scored, captioned, and reframed for Shorts, Reels, and TikTok. No
            editing skills required.
          </p>

          <form onSubmit={handleSubmit} className="mt-8" noValidate>
            <div className="glass flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-black/30 px-4 py-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/40" aria-hidden="true">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a YouTube link…"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full bg-transparent text-sm text-white placeholder-white/35 outline-none sm:text-base"
                  aria-label="YouTube video URL"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    className="text-white/40 transition hover:text-white"
                    aria-label="Clear URL"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handlePaste}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Paste
              </button>
              <button
                type="submit"
                disabled={submitting || !valid}
                className="btn-primary rounded-xl px-6 py-3 text-sm font-bold text-white sm:text-base"
              >
                {submitting ? "Starting…" : "Clip it ✂"}
              </button>
            </div>
            {showError && (
              <p className="mt-2.5 animate-fade-in text-sm text-rose-400">
                That doesn't look like a YouTube link — try a youtube.com or youtu.be URL.
              </p>
            )}
            {submitError && (
              <p className="mt-2.5 animate-fade-in text-sm text-rose-400">{submitError}</p>
            )}
          </form>

          <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm font-medium text-white/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* floating mock clip visual */}
        <div className="relative mx-auto hidden w-full max-w-[300px] lg:block" aria-hidden="true">
          <div className="glass animate-float relative aspect-[9/16] overflow-hidden rounded-3xl p-4 shadow-[0_30px_80px_-20px_rgba(139,92,246,0.45)]">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-900/60 via-[#14141f] to-fuchsia-900/40" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-violet-500/30 to-transparent" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 backdrop-blur">
                  0:42
                </span>
                <ScoreRing score={94} size={52} />
              </div>
              <div>
                <div className="mb-2 flex justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
                <p className="text-center text-sm font-bold text-white">
                  "The moment everything clicked"
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 w-3/4 mx-auto rounded bg-white/25" />
                  <div className="h-1.5 w-1/2 mx-auto rounded bg-fuchsia-400/60" />
                  <div className="h-1.5 w-2/3 mx-auto rounded bg-white/15" />
                </div>
              </div>
            </div>
          </div>
          <div className="glass animate-float absolute -left-16 top-16 rounded-2xl px-4 py-3" style={{ animationDelay: "1.2s" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Virality</p>
            <p className="text-lg font-extrabold text-gradient">94 / 100</p>
          </div>
          <div className="glass animate-float absolute -right-12 bottom-24 rounded-2xl px-4 py-3" style={{ animationDelay: "2.1s" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Captions</p>
            <p className="text-sm font-bold text-white">Auto-generated ✓</p>
          </div>
        </div>
      </div>
    </section>
  );
}
