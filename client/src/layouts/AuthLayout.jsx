import { Link, Outlet } from 'react-router-dom';

import ProductFooter from '../components/ProductFooter';
import HelpAssistant from '../components/HelpAssistant';

function AuthLayout() {
  return (
    <main className="app-page min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="app-container">
        <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
          <div className="glass-panel grid w-full max-w-[1180px] overflow-hidden lg:grid-cols-[1fr_0.92fr]">
            <section className="order-2 bg-[linear-gradient(160deg,#0f172a_0%,#111c31_55%,#0f766e_100%)] px-5 py-6 text-white sm:px-8 sm:py-8 lg:order-1 lg:px-12 lg:py-12">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <Link to="/" className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  SmartHire
                </Link>
              </div>

              <h1 className="mt-5 max-w-xl text-[2rem] font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Review candidates faster and decide with more clarity.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-200 sm:text-base">
                Keep jobs, resumes, scores, recruiter notes, and interviews together so hiring stays easier to manage.
              </p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">Jobs and candidates</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">Keep the role, the resume, and the recruiter notes together.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">Candidate match</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">See which candidates match your job and where the gaps still are.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">Recruiter decisions</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">Score candidates, leave notes, and move to interviews faster.</p>
                </div>
              </div>
            </section>

            <section className="order-1 bg-[linear-gradient(180deg,#0f172a_0%,#111c31_100%)] px-4 py-5 sm:px-8 sm:py-8 lg:order-2 lg:px-10 lg:py-10">
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
