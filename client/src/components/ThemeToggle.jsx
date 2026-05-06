const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <circle cx="12" cy="12" r="4.25" />
    <path
      d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <path
      d="M20.04 14.12A8.5 8.5 0 1 1 9.88 3.96a6.9 6.9 0 0 0 10.16 10.16Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function ThemeToggle({ isDark, onToggle, className = '' }) {
  const nextModeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      onClick={onToggle}
      aria-label={nextModeLabel}
      aria-pressed={isDark}
      title={nextModeLabel}
    >
      <span
        aria-hidden="true"
        className={`theme-toggle-thumb ${isDark ? 'theme-toggle-thumb-dark' : 'theme-toggle-thumb-light'}`}
      />
      <span className={`theme-toggle-slot ${!isDark ? 'theme-toggle-slot-active' : ''}`}>
        <SunIcon />
      </span>
      <span className={`theme-toggle-slot ${isDark ? 'theme-toggle-slot-active' : ''}`}>
        <MoonIcon />
      </span>
    </button>
  );
}

export default ThemeToggle;
