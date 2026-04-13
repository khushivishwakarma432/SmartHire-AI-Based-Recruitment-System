import { Link } from 'react-router-dom';

import ProductFooter from '../components/ProductFooter';
import ThemeToggle from '../components/ThemeToggle';
import HelpAssistant from '../components/HelpAssistant';
import { useTheme } from '../utils/theme';

function MainLayout({ children }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <main className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-slate-950'}`}>
      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <header
          className={`mx-auto flex w-full max-w-[1380px] flex-col gap-4 rounded-[26px] border px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between ${
            isDark
              ? 'border-slate-800 bg-slate-950/85 backdrop-blur'
              : 'border-slate-200 bg-white/95 backdrop-blur'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3 lg:pl-2">
            <Link className="flex min-w-0 items-center gap-3" to="/">
              <span
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold tracking-[0.18em] ${
                  isDark ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                SH
              </span>
              <div className="min-w-0">
                <span className={`block truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>SmartHire</span>
                <span className={`block truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Hiring decisions made clearer
                </span>
              </div>
            </Link>
            <span className={`hidden h-8 w-px lg:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <span
              className={`hidden rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] lg:inline-flex ${
                isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Recruiter tools
            </span>
          </div>

          <nav className={`hidden items-center gap-7 text-sm font-medium lg:flex ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <a className="transition hover:text-emerald-500" href="#features">
              Features
            </a>
            <a className="transition hover:text-emerald-500" href="#workflow">
              Workflow
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} className="hidden sm:inline-flex sm:shrink-0" />
            <Link
              className={`inline-flex min-h-[42px] items-center justify-center rounded-full px-4 text-sm font-medium transition ${
                isDark
                  ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
              }`}
              to="/login"
            >
              Login
            </Link>
            <Link className="btn-primary min-h-[42px] rounded-full px-5 text-sm" to="/signup">
              Start Free
            </Link>
          </div>
        </header>

        <div className="pt-5 lg:pt-7">{children}</div>
      </div>

      <ProductFooter />
      <HelpAssistant />
    </main>
  );
}

export default MainLayout;
