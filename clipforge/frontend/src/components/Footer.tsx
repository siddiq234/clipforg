import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#0a0a0f]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={26} />
          <span className="text-sm font-bold text-white">
            Clip<span className="text-gradient">Forge</span>
          </span>
          <span className="text-xs text-white/40">— turn long videos into viral clips</span>
        </div>
        <p className="text-xs text-white/35">
          Paste a YouTube link. We find the moments worth sharing.
        </p>
      </div>
    </footer>
  );
}
