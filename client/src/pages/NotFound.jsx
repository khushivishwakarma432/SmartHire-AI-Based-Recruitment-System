import { Link } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import { getStoredToken } from '../utils/auth';

function NotFound() {
  const hasSession = Boolean(getStoredToken());
  const primaryLink = hasSession ? '/dashboard' : '/';
  const primaryLabel = hasSession ? 'Back to dashboard' : 'Back to home';

  return (
    <MainLayout>
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-1 py-8">
        <div className="w-full max-w-3xl rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(15,23,42,0.72))] px-6 py-10 text-center shadow-[0_28px_80px_-42px_rgba(0,0,0,0.84)] backdrop-blur lg:px-10 lg:py-12">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-cyan-200/75">
            Error 404
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            This page could not be found
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            The link may be outdated, or the page may have moved. You can return to SmartHire and continue reviewing jobs and candidates.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(16,185,129,0.42)] transition hover:-translate-y-0.5 hover:bg-emerald-400"
              to={primaryLink}
            >
              {primaryLabel}
            </Link>
            {!hasSession ? (
              <Link
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-6 text-sm font-semibold text-white backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
                to="/login"
              >
                Go to login
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

export default NotFound;
