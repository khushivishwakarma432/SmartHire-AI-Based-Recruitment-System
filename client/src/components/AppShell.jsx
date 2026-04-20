import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { removeToken } from '../utils/auth';
import { useEffect, useState } from 'react';
import GlobalSearch from './GlobalSearch';
import HelpAssistant from './HelpAssistant';
import NotificationBell from './NotificationBell';
import ProductFooter from './ProductFooter';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../utils/theme';

const workflowSteps = [
  {
    id: 'create-job',
    label: 'Create Job',
    hint: 'Set the role and required skills.',
    match: (pathname) => pathname.startsWith('/jobs'),
    to: '/jobs',
  },
  {
    id: 'upload-candidates',
    label: 'Upload Candidates',
    hint: 'Add resumes for this role.',
    match: (pathname) => pathname.startsWith('/candidates/upload'),
    to: '/candidates/upload',
  },
  {
    id: 'review-candidates',
    label: 'Review Candidates',
    hint: 'See scores, notes, and resumes.',
    match: (pathname) =>
      pathname === '/candidates' ||
      pathname.startsWith('/candidates/compare') ||
      pathname === '/pipeline',
    to: '/candidates',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    hint: 'Track totals and next actions.',
    match: (pathname) => pathname === '/dashboard',
    to: '/dashboard',
  },
];

const workspaceLinks = [
  { label: 'Dashboard', to: '/dashboard', end: true },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Candidates', to: '/candidates', end: true },
  { label: 'Pipeline', to: '/pipeline' },
  { label: 'Upload Candidate', to: '/candidates/upload' },
  { label: 'Interviews', to: '/interviews' },
  { label: 'Settings', to: '/settings' },
];

function AppShell({ title, description, actions, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeStepIndex = workflowSteps.findIndex((step) => step.match(location.pathname));

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    removeToken();
    navigate('/', { replace: true });
  };

  const workspaceLinkClassName = ({ isActive }) =>
    [
      'inline-flex min-h-[40px] items-center rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition xl:w-full',
      isActive
        ? isDark
          ? 'bg-emerald-500/12 text-emerald-200'
          : 'bg-slate-900 text-white'
        : isDark
          ? 'text-slate-400 hover:bg-white/6 hover:text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ');

  return (
    <main className="app-page">
      <div className="app-container space-y-4 xl:grid xl:grid-cols-[248px_minmax(0,1fr)] xl:items-start xl:gap-4 xl:space-y-0 2xl:grid-cols-[260px_minmax(0,1fr)]">
        <header className={`workflow-header xl:hidden ${isDark ? 'border-[#1E293B] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-start justify-between gap-3">
            <Link className="flex min-w-0 items-center gap-3" to="/dashboard">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold tracking-[0.18em] ${isDark ? 'bg-emerald-500/14 text-emerald-200' : 'bg-slate-950 text-white'}`}>
                SH
              </span>
              <div className="min-w-0">
                <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-slate-500'}`}>
                  SmartHire
                </p>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Jobs, candidates, and decisions</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              <button
                className="btn-secondary btn-compact px-3"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-expanded={isSidebarOpen}
                aria-controls="app-shell-sidebar"
              >
                Menu
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <div className="min-w-0">
              <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.26em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                SmartHire
              </p>
              <h1 className={`mt-2 text-[1.45rem] font-semibold tracking-tight sm:text-[1.7rem] ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h1>
              {description ? <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p> : null}
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex w-full min-w-0 flex-col gap-2">
                <GlobalSearch />
                <NotificationBell />
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
          </div>
        </header>

        {isSidebarOpen ? (
          <button
            className="fixed inset-0 z-[84] bg-slate-950/50 backdrop-blur-[2px] xl:hidden"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <aside
          id="app-shell-sidebar"
          className={`workflow-rail fixed inset-y-0 left-0 z-[85] w-[min(90vw,22rem)] overflow-y-auto rounded-none rounded-r-[28px] transition-transform duration-200 xl:sticky xl:top-6 xl:z-auto xl:min-h-[calc(100vh-3rem)] xl:w-auto xl:rounded-[28px] ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
          } ${isDark ? 'border-[#1E293B] bg-[#0F172A] text-white' : 'border-slate-200 bg-white text-slate-950'}`}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <Link className="flex min-w-0 items-center gap-3" to="/dashboard">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold tracking-[0.18em] ${isDark ? 'bg-emerald-500/14 text-emerald-200' : 'bg-slate-950 text-white'}`}>
                SH
              </span>
              <div className="min-w-0">
                <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-300' : 'text-slate-500'}`}>
                  SmartHire
                </p>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Jobs, candidates, and decisions</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} className="hidden xl:inline-flex" />
              <button
                className="btn-secondary btn-compact px-3 xl:hidden"
                type="button"
                onClick={() => setIsSidebarOpen(false)}
              >
                Close
              </button>
            </div>
          </div>

          <div className={`mt-6 rounded-[22px] border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Hiring Steps
            </p>
            <h2 className={`mt-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>What to do next</h2>
            <div className="mt-4 space-y-3">
              {workflowSteps.map((step, index) => {
                const isActive = index === activeStepIndex;
                const isComplete = activeStepIndex > index;

                return (
                  <Link
                    key={step.id}
                    className={`workflow-step ${
                      isActive
                        ? isDark
                          ? 'workflow-step-active-dark'
                          : 'workflow-step-active-light'
                        : isDark
                          ? 'workflow-step-dark'
                          : 'workflow-step-light'
                    }`}
                    to={step.to}
                  >
                    <span
                      className={`workflow-step-marker ${
                        isActive
                          ? isDark
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-950 text-white'
                          : isComplete
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-200'
                              : 'bg-slate-900/10 text-slate-800'
                            : isDark
                              ? 'bg-white/6 text-slate-400'
                              : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {step.label}
                      </span>
                      <span className={`mt-1 block text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {step.hint}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Main Pages
            </p>
            <nav className="mt-3 flex flex-wrap gap-2 xl:flex-col xl:items-start">
              {workspaceLinks.map((link) => (
                <NavLink key={link.to} className={workspaceLinkClassName} end={link.end} to={link.to}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className={`mt-auto rounded-[22px] border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Session
            </p>
            <p className={`mt-2 text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Signed in workspace</p>
            <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Use the header for page context and keep this space for account-level actions.
            </p>
            <button className="btn-secondary btn-compact mt-4 w-full justify-center" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <header className={`workflow-header hidden xl:block ${isDark ? 'border-[#1E293B] bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.26em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  SmartHire
                </p>
                <h1 className={`mt-2 text-[1.7rem] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h1>
                {description ? <p className={`mt-2 max-w-3xl text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p> : null}
              </div>
              <div className="flex min-w-0 flex-col gap-3 xl:items-end">
                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <GlobalSearch />
                  <NotificationBell />
                </div>
                {actions ? <div className="flex flex-wrap gap-2 xl:justify-end">{actions}</div> : null}
              </div>
            </div>
          </header>

          {children}
        </div>
      </div>

      <ProductFooter />
      <HelpAssistant />
    </main>
  );
}

export default AppShell;
