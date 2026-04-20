function ThemeToggle({ isDark, onToggle, className = '' }) {
  const nextModeLabel = isDark ? 'Light Mode' : 'Dark Mode';
  const nextModeBadge = isDark ? 'Sun' : 'Moon';

  return (
    <button
      className={`inline-flex h-10 max-w-full min-w-0 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold leading-none backdrop-blur transition-colors duration-200 hover:-translate-y-0.5 max-sm:w-10 max-sm:px-0 ${
        isDark
          ? 'border-emerald-400/20 bg-white/[0.04] text-white hover:border-teal-400/40 hover:bg-teal-400/10'
          : 'border-slate-300 bg-white text-slate-800 shadow-[0_14px_36px_-24px_rgba(15,23,42,0.18)] hover:border-cyan-300 hover:bg-slate-50'
      } ${className}`.trim()}
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        aria-hidden="true"
        className={`inline-flex min-w-[18px] items-center justify-center text-[11px] font-semibold leading-none ${
          isDark ? 'text-amber-200' : 'text-slate-700'
        }`}
      >
        {nextModeBadge}
      </span>
      <span className="truncate max-sm:hidden">{nextModeLabel}</span>
    </button>
  );
}

export default ThemeToggle;
