interface LogoProps {
  size?: number;
  className?: string;
}

/** ClipForge mark: gradient rounded square with a scissors glyph (pure SVG). */
export default function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cf-logo-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#cf-logo-g)" />
      <path d="M10 23.5 L22 11.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 8.5 L22 20.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      <circle cx="8.2" cy="24.4" r="2.7" stroke="#fff" strokeWidth="2.3" />
      <circle cx="8.2" cy="7.6" r="2.7" stroke="#fff" strokeWidth="2.3" opacity="0.55" />
    </svg>
  );
}
