import { Link } from 'react-router-dom';

import ProductFooter from '../components/ProductFooter';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../utils/theme';

function MainLayout({ children }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <main
      className={`min-h-screen overflow-hidden transition-colors duration-200 ${
        isDark
          ? 'bg-[#030712] text-white'
          : 'bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_18%,#f8fafc_52%,#f1f5f9_100%)] text-slate-950'
      }`}
    >
      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
          <div className={`absolute left-[6%] top-0 h-56 w-56 rounded-full blur-3xl ${isDark ? 'bg-cyan-400/12' : 'bg-sky-400/18'}`} />
          <div className={`absolute right-[10%] top-12 h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-indigo-300/22'}`} />
        </div>

        <header
          className={`mx-auto flex w-full max-w-[1380px] flex-col gap-4 rounded-[28px] border px-4 py-4 backdrop-blur-xl sm:px-6 md:gap-5 lg:flex-row lg:items-center lg:justify-between ${
            isDark
              ? 'border-white/10 bg-slate-950/70'
              : 'border-white/70 bg-white/88 shadow-[0_24px_54px_-32px_rgba(15,23,42,0.22)]'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3 lg:pl-2">
            <Link className="flex min-w-0 items-center gap-3" to="/">
              <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold tracking-[0.18em] ${isDark ? 'bg-cyan-400/12 text-cyan-200' : 'bg-cyan-500/12 text-cyan-700'}`}>
                SH
              </span>
              <div className="min-w-0">
                <span className={`block truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>SmartHire</span>
                <span className={`block truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>AI candidate intelligence</span>
              </div>
            </Link>
            <span className={`hidden h-8 w-px lg:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <span className={`hidden rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] lg:inline-flex ${isDark ? 'bg-white/[0.04] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              Premium homepage
            </span>
          </div>

          <nav className={`hidden flex-wrap items-center gap-5 text-sm font-medium lg:flex ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <a className={`transition ${isDark ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`} href="#workflow">
              How It Works
            </a>
            <a className={`transition ${isDark ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`} href="#features">
              Features
            </a>
            <a className={`transition ${isDark ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`} href="#dashboard-preview">
              Dashboard
            </a>
          </nav>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3 lg:ml-auto lg:w-auto lg:flex-nowrap">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Link
              className={`inline-flex min-h-[42px] flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition sm:flex-none ${isDark ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'}`}
              to="/login"
            >
              Login
            </Link>
            <Link
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-cyan-400/40 bg-[linear-gradient(135deg,#06b6d4_0%,#2563eb_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_-24px_rgba(37,99,235,0.75)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_54px_-24px_rgba(37,99,235,0.9)] sm:flex-none"
              to="/signup"
            >
              Start Free
            </Link>
          </div>
        </header>

        <div className="pt-5 lg:pt-7">{children}</div>
      </div>

      <ProductFooter />
    </main>
  );
}

export default MainLayout;
