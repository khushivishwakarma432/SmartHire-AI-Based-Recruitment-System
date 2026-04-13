import { Link, Outlet } from 'react-router-dom';

import ProductFooter from '../components/ProductFooter';
import ThemeToggle from '../components/ThemeToggle';
import HelpAssistant from '../components/HelpAssistant';
import { useTheme } from '../utils/theme';

function AuthLayout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <main className="app-page">
      <div className="app-container">
        <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
          <div className="glass-panel grid w-full max-w-[1180px] overflow-hidden lg:grid-cols-[1fr_0.92fr]">
            <section
              className={`px-7 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 ${
                isDark
                  ? 'bg-[linear-gradient(160deg,#0f172a_0%,#111c31_55%,#0f766e_100%)] text-white'
                  : 'bg-[linear-gradient(160deg,#f8fafc_0%,#eff6ff_52%,#d1fae5_100%)] text-slate-950'
              }`}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <Link
                  to="/"
                  className={`text-[0.72rem] font-semibold uppercase tracking-[0.3em] ${
                    isDark ? 'text-emerald-200' : 'text-emerald-700'
                  }`}
                >
                  SmartHire
                </Link>
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} className="justify-self-end px-3" />
              </div>

              <h1 className={`mt-6 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Review candidates faster and decide with more clarity.
              </h1>
              <p className={`mt-5 max-w-lg text-sm leading-7 sm:text-base ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                Keep jobs, resumes, scores, recruiter notes, and interviews together so hiring stays easier to manage.
              </p>

              <div className="mt-8 space-y-2.5">
                <div className={`rounded-2xl border px-4 py-3.5 backdrop-blur ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/75'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>Jobs and candidates</p>
                  <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>Keep the role, the resume, and the recruiter notes together.</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3.5 backdrop-blur ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/75'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>Candidate match</p>
                  <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>See which candidates match your job and where the gaps still are.</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3.5 backdrop-blur ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/75'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>Recruiter decisions</p>
                  <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>Score candidates, leave notes, and move to interviews faster.</p>
                </div>
              </div>
            </section>

            <section
              className={`px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 ${
                isDark
                  ? 'bg-[linear-gradient(180deg,#0f172a_0%,#111c31_100%)]'
                  : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]'
              }`}
            >
              <Outlet />
            </section>
          </div>
        </div>
      </div>

      <ProductFooter />
      <HelpAssistant />
    </main>
  );
}

export default AuthLayout;
