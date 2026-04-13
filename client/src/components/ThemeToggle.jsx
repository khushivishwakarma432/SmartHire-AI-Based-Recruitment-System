function ThemeToggle({ isDark, onToggle, className = '' }) {
  const nextModeLabel = isDark ? 'Light Mode' : 'Dark Mode';
  const nextModeIcon = isDark ? '☀' : '☾';

  return (
    <button
      className={`inline-flex h-10 max-w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold leading-none backdrop-blur transition-colors duration-200 hover:-translate-y-0.5 ${
        isDark
          ? 'border-emerald-400/20 bg-white/[0.04] text-white hover:border-teal-400/40 hover:bg-teal-400/10'
          : 'border-slate-200 bg-white text-slate-700 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-emerald-300 hover:bg-emerald-50'
      } ${className}`.trim()}
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-[18px] w-[18px] items-center justify-center text-[15px] leading-none ${
          isDark ? 'text-amber-200' : 'text-slate-600'
        }`}
      >
        {nextModeIcon}
      </span>
      <span className="truncate">{nextModeLabel}</span>
    </button>
  );
}

export default ThemeToggle;
