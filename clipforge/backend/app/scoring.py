"""Clip candidate generation + heuristic "virality" scoring.

Pipeline:
  1. Rebuild sentences from word-level timestamps (words carry the timing,
     punctuation marks the sentence boundary).
  2. Build candidate windows 25–55s long, aligned to sentence boundaries.
  3. Score each window with content heuristics (hooks, questions, numbers,
     emotion, exclamations, caps, early-video bonus).
  4. Greedily pick the top `max_clips`, penalizing heavy overlap so the
     winners are diverse moments, then normalize the best to a 0–100 score.
"""

from __future__ import annotations

import re

MIN_CLIP_SEC = 25.0
MAX_CLIP_SEC = 55.0
FIRST_QUARTER_CUTOFF = 0.25  # bonus for clips starting in the first 25%
OVERLAP_TOLERANCE = 0.30  # max overlap / shorter-duration when diversifying
TITLE_LIMIT = 60

HOOK_PHRASES = [
    "the secret", "nobody tells you", "nobody talks about", "no one tells you",
    "stop doing", "biggest mistake", "mistake", "how to", "why you",
    "the truth about", "here's why", "heres why", "the reason",
    "what if", "imagine if", "listen", "watch this", "secret to",
    "never do", "always do", "nobody knows", "the key is",
]

EMOTION_WORDS = [
    "amazing", "insane", "crazy", "love", "hate", "incredible",
    "shocking", "unbelievable", "epic", "terrible", "worst", "best",
    "mind-blowing", "mind blowing", "genius", "stupid", "ridiculous",
    "wild", "brilliant", "disaster",
]

_NUMBER_RE = re.compile(r"\d[\d,]*")
_SENT_END_RE = re.compile(r"[.!?…][\"'”’)]?\s*$")


def _word_re(word: str) -> re.Pattern:
    return re.compile(r"\b" + re.escape(word) + r"\b")


def _finish_sentence(words: list[dict]) -> dict:
    # faster-whisper words carry their own leading spaces (" hello"), so join raw.
    text = "".join(w["word"] for w in words).strip()
    return {
        "start": words[0]["start"],
        "end": words[-1]["end"],
        "text": text,
        "words": list(words),
    }


def _to_sentences(segments: list[dict]) -> list[dict]:
    """Flatten word-timed segments into sentence dicts with timing."""
    words: list[dict] = []
    for seg in segments:
        words.extend(seg.get("words") or [])
    sentences, current = [], []
    for w in words:
        current.append(w)
        if _SENT_END_RE.search(w["word"]):
            sentences.append(_finish_sentence(current))
            current = []
    if current:
        sentences.append(_finish_sentence(current))
    return [s for s in sentences if s["text"]]


def _candidate_windows(sentences: list[dict]) -> list[dict]:
    """All 25–55s windows starting/ending on sentence boundaries."""
    windows = []
    n = len(sentences)
    for i in range(n):
        start = sentences[i]["start"]
        for j in range(i, n):
            dur = sentences[j]["end"] - start
            if dur > MAX_CLIP_SEC:
                break
            if dur >= MIN_CLIP_SEC:
                windows.append(
                    {
                        "start": start,
                        "end": sentences[j]["end"],
                        "sentences": sentences[i : j + 1],
                    }
                )
    return windows


def _score_text(text: str, start_sec: float, total_duration: float) -> float:
    """Heuristic virality score for a chunk of transcript text."""
    lowered = text.lower()
    score = 0.0
    for phrase in HOOK_PHRASES:
        score += 8.0 * lowered.count(phrase)
    for emo in EMOTION_WORDS:
        score += 5.0 * len(_word_re(emo).findall(lowered))
    score += 6.0 * text.count("?")  # questions spark curiosity
    score += 4.0 * min(3, len(_NUMBER_RE.findall(text)))  # stats feel concrete
    score += 4.0 * text.count("!")
    alpha = sum(c.isalpha() for c in text)
    if alpha and sum(c.isupper() for c in text) / alpha > 0.35:
        score += 5.0  # emphatic delivery
    if total_duration > 0 and start_sec < FIRST_QUARTER_CUTOFF * total_duration:
        score += 10.0  # openings usually hold the hook
    return score


def _overlap(a_start: float, a_end: float, b_start: float, b_end: float) -> float:
    return max(0.0, min(a_end, b_end) - max(a_start, b_start))


def _make_title(sentences: list[dict], limit: int = TITLE_LIMIT) -> str:
    """Punchy title from the clip's most hook-like sentence (~60 chars)."""
    scored = [(_score_text(s["text"], 0, 0), s["text"]) for s in sentences]
    best = max(scored, key=lambda t: (t[0], -len(t[1])))[1]
    best = re.sub(r"\s+", " ", best).strip()
    if len(best) <= limit:
        return best
    cut = best.rfind(" ", 0, limit - 1)
    head = best[:cut] if cut > 20 else best[: limit - 1]
    return head.rstrip() + "…"


def pick_clips(
    segments: list[dict], total_duration: float, max_clips: int = 5
) -> list[dict]:
    """Pick the best clip windows.

    Returns dicts with: start_sec, end_sec, duration_sec, transcript, score
    (0–100 int, best normalized to 100), title, words (for captions).
    """
    sentences = _to_sentences(segments)
    if not sentences:
        raise ValueError("No speech detected in the video; cannot build clips.")

    windows = _candidate_windows(sentences)
    if not windows:
        # Video shorter than MIN_CLIP_SEC: fall back to the whole transcript.
        windows = [
            {
                "start": sentences[0]["start"],
                "end": sentences[-1]["end"],
                "sentences": sentences,
            }
        ]

    for w in windows:
        w["text"] = " ".join(s["text"] for s in w["sentences"])
        w["raw"] = _score_text(w["text"], w["start"], total_duration)

    windows.sort(key=lambda w: w["raw"], reverse=True)
    denom = windows[0]["raw"] if windows[0]["raw"] > 0 else 1.0

    picked: list[dict] = []
    for w in windows:
        if len(picked) >= max_clips:
            break
        dur = w["end"] - w["start"]
        diverse = True
        for p in picked:
            ov = _overlap(w["start"], w["end"], p["start_sec"], p["end_sec"])
            if ov / min(dur, p["duration_sec"]) > OVERLAP_TOLERANCE:
                diverse = False  # too similar to an already-picked moment
                break
        if not diverse:
            continue
        picked.append(
            {
                "start_sec": round(w["start"], 2),
                "end_sec": round(w["end"], 2),
                "duration_sec": round(dur, 2),
                "transcript": w["text"],
                "score": int(round(100.0 * w["raw"] / denom)),
                "title": _make_title(w["sentences"]),
                "words": [wd for s in w["sentences"] for wd in s["words"]],
            }
        )

    picked.sort(key=lambda c: c["start_sec"])  # chronological for a nicer UX
    return picked
