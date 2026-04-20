import { Link } from 'react-router-dom';

import ProductFooter from '../components/ProductFooter';
import HelpAssistant from '../components/HelpAssistant';

function MainLayout({ children }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
          <div className="absolute left-[6%] top-0 h-56 w-56 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="absolute right-[10%] top-12 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <header className="mx-auto flex w-full max-w-[1380px] flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur-xl sm:px-6 md:gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 lg:pl-2">
            <Link className="flex min-w-0 items-center gap-3" to="/">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/12 text-sm font-semibold tracking-[0.18em] text-cyan-200">
                SH
              </span>
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">SmartHire</span>
                <span className="block truncate text-xs text-slate-400">AI candidate intelligence</span>
              </div>
            </Link>
            <span className="hidden h-8 w-px bg-slate-800 lg:block" />
            <span className="hidden rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300 lg:inline-flex">
              Premium homepage
            </span>
          </div>

          <nav className="hidden flex-wrap items-center gap-5 text-sm font-medium text-slate-300 lg:flex">
            <a className="transition hover:text-cyan-400" href="#workflow">
              How It Works
            </a>
            <a className="transition hover:text-cyan-400" href="#features">
              Features
            </a>
            <a className="transition hover:text-cyan-400" href="#dashboard-preview">
              Dashboard
            </a>
          </nav>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3 lg:ml-auto lg:w-auto lg:flex-nowrap">
            <Link
              className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-full px-4 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:flex-none"
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
      <HelpAssistant />
    </main>
  );
}

export default MainLayout;
