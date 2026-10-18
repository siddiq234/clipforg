import Logo from "./Logo";

interface HeaderProps {
  onHome: () => void;
  showNewClip: boolean;
}

/** Sticky glass header with the ClipForge wordmark. */
export default function Header({ onHome, showNewClip }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-[#0a0a0f]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={onHome}
          className="group flex items-center gap-2.5"
          aria-label="ClipForge home"
        >
          <Logo size={34} className="transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105" />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Clip<span className="text-gradient">Forge</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/60 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            AI clipping engine online
          </span>
          {showNewClip && (
            <button
              onClick={onHome}
              className="btn-primary rounded-full px-4 py-1.5 text-sm font-semibold text-white"
            >
              New clip
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
