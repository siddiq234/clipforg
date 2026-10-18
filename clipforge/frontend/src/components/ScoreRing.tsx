interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

/** Circular virality-score indicator, color-coded by band. */
export default function ScoreRing({
  score,
  size = 56,
  strokeWidth = 5,
  showLabel = true,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80
      ? "#34d399" // emerald — banger
      : clamped >= 60
        ? "#a78bfa" // violet — strong
        : clamped >= 40
          ? "#fbbf24" // amber — decent
          : "#f87171"; // red — weak

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Virality score ${clamped} out of 100`}
      title={`Virality score: ${clamped}/100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(0,0,0,0.45)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-extrabold text-white"
          style={{ fontSize: size * 0.3 }}
        >
          {clamped}
        </span>
      )}
    </div>
  );
}
