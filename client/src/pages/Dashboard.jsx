import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCandidates } from '../api/candidates';
import { getDashboardSummary } from '../api/dashboard';
import { getLatestScores } from '../api/scores';
import AnalyticsOverview from '../components/AnalyticsOverview';
import AppShell from '../components/AppShell';
import { getStoredToken, isUnauthorizedError, removeToken } from '../utils/auth';

const FALLBACK_SUMMARY = {
  totalJobs: 0,
  totalCandidates: 0,
  totalScored: 0,
  averageScore: 0,
  topCandidates: [],
  candidatesPerJob: [],
};

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'ai-scoring', label: 'AI Scoring' },
  { id: 'recruiter-review', label: 'Recruiter Review' },
  { id: 'interviews', label: 'Interviews' },
];

const normalizeStatus = (status = '') => {
  const value = String(status).trim().toLowerCase();
  if (value === 'pending') {
    return 'Pending Review';
  }

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getFitLabel = (score) => {
  if (typeof score !== 'number') {
    return 'Not Scored';
  }

  if (score >= 80) {
    return 'Strong Fit';
  }

  if (score >= 50) {
    return 'Moderate Fit';
  }

  return 'Low Fit';
};

const getFitClassName = (score) => {
  if (typeof score !== 'number') {
    return 'badge-muted';
  }

  if (score >= 80) {
    return 'badge-success';
  }

  if (score >= 50) {
    return 'badge-warning';
  }

  return 'badge-danger';
};

const safeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeSummary = (payload = {}) => ({
  totalJobs: safeNumber(payload.totalJobs),
  totalCandidates: safeNumber(payload.totalCandidates),
  totalScored: safeNumber(payload.totalScored),
  averageScore: safeNumber(payload.averageScore),
  topCandidates: Array.isArray(payload.topCandidates)
    ? payload.topCandidates.map((item) => ({
        candidateId: item.candidateId || item._id || '',
        fullName: item.fullName || 'Unknown Candidate',
        email: item.email || '',
        score: safeNumber(item.score),
        summary: item.summary || 'No AI summary available yet.',
        jobTitle: item.jobTitle || 'Unknown Job',
      }))
    : [],
  candidatesPerJob: Array.isArray(payload.candidatesPerJob)
    ? payload.candidatesPerJob.map((item) => ({
        jobId: item.jobId || item._id || '',
        jobTitle: item.jobTitle || item.title || 'Untitled Job',
        count: safeNumber(item.count ?? item.candidateCount),
      }))
    : [],
});

const getInterviewTimestamp = (candidate) => {
  if (!candidate?.interviewDate) {
    return null;
  }

  const timeValue = candidate.interviewTime ? String(candidate.interviewTime) : '09:00';
  const parsed = new Date(`${candidate.interviewDate}T${timeValue}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const formatInterviewDate = (date, time) => {
  if (!date) {
    return 'Not scheduled';
  }

  const combined = time ? `${date}T${time}` : `${date}T09:00`;
  const parsed = new Date(combined);

  if (Number.isNaN(parsed.getTime())) {
    return time ? `${date} at ${time}` : date;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: time ? 'short' : undefined,
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(FALLBACK_SUMMARY);
  const [candidates, setCandidates] = useState([]);
  const [scoresByCandidate, setScoresByCandidate] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const token = getStoredToken();
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const [summaryResult, candidatesResult, latestScoresResult] = await Promise.allSettled([
          getDashboardSummary(),
          getCandidates(),
          getLatestScores(),
        ]);

        if (!isMounted) {
          return;
        }

        const authFailure = [summaryResult, candidatesResult, latestScoresResult]
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason)
          .find((requestError) => isUnauthorizedError(requestError));

        if (authFailure) {
          removeToken();
          navigate('/login', { replace: true });
          return;
        }

        if (summaryResult.status === 'fulfilled') {
          setSummary(normalizeSummary(summaryResult.value));
        } else {
          setSummary(FALLBACK_SUMMARY);
        }

        const candidatesPayload = candidatesResult.status === 'fulfilled' ? candidatesResult.value : null;
        const latestScoresPayload = latestScoresResult.status === 'fulfilled' ? latestScoresResult.value : null;
        const normalizedCandidates = Array.isArray(candidatesPayload?.candidates)
          ? candidatesPayload.candidates
          : Array.isArray(candidatesPayload)
            ? candidatesPayload
            : [];
        const normalizedScores = Array.isArray(latestScoresPayload?.scores)
          ? latestScoresPayload.scores
          : Array.isArray(latestScoresPayload)
            ? latestScoresPayload
            : [];

        setCandidates(normalizedCandidates);
        setScoresByCandidate(
          normalizedScores.reduce((accumulator, scoreEntry) => {
            const key = scoreEntry?.candidateId?._id || scoreEntry?.candidateId;
            if (key) {
              accumulator[String(key)] = scoreEntry;
            }
            return accumulator;
          }, {}),
        );

        const nextErrors = [summaryResult, candidatesResult, latestScoresResult]
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason?.message)
          .filter(Boolean);

        setError(nextErrors[0] || '');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Jobs',
        value: summary.totalJobs,
        hint: 'Open roles currently tracked',
      },
      {
        label: 'Total Candidates',
        value: summary.totalCandidates,
        hint: 'Candidates added for review',
      },
      {
        label: 'Total Scored',
        value: summary.totalScored,
        hint: 'Candidates scored so far',
      },
      {
        label: 'Average AI Score',
        value: `${Math.round(summary.averageScore)} / 100`,
        hint: 'Average score across reviewed candidates',
      },
    ],
    [summary]
  );

  const topJobs = useMemo(() => {
    return [...summary.candidatesPerJob]
      .sort((first, second) => second.count - first.count)
      .slice(0, 3);
  }, [summary.candidatesPerJob]);

  const topScoredCandidates = useMemo(() => {
    return candidates
      .map((candidate) => {
        const score = scoresByCandidate[candidate._id];
        return {
          ...candidate,
          scoreValue: typeof score?.score === 'number' ? score.score : null,
          scoreSummary: score?.summary || 'AI evaluation is ready to review.',
        };
      })
      .filter((candidate) => typeof candidate.scoreValue === 'number')
      .sort((first, second) => second.scoreValue - first.scoreValue)
      .slice(0, 4);
  }, [candidates, scoresByCandidate]);

  const recruiterReviewStats = useMemo(() => {
    return candidates.reduce(
      (accumulator, candidate) => {
        const normalized = normalizeStatus(candidate.recruiterStatus || 'Pending Review');

        if (normalized === 'Shortlisted') {
          accumulator.shortlisted += 1;
        } else if (normalized === 'Rejected') {
          accumulator.rejected += 1;
        } else {
          accumulator.pendingReview += 1;
        }

        return accumulator;
      },
      {
        shortlisted: 0,
        pendingReview: 0,
        rejected: 0,
      }
    );
  }, [candidates]);

  const interviewOverview = useMemo(() => {
    const scheduledStatuses = new Set(['Scheduled', 'Rescheduled']);

    const scheduledCandidates = candidates.filter((candidate) =>
      scheduledStatuses.has(normalizeStatus(candidate.interviewStatus || ''))
    );

    const upcoming = [...scheduledCandidates]
      .map((candidate) => ({
        ...candidate,
        interviewTimestamp: getInterviewTimestamp(candidate),
      }))
      .filter((candidate) => candidate.interviewTimestamp)
      .sort((first, second) => first.interviewTimestamp - second.interviewTimestamp)
      .slice(0, 4);

    return {
      scheduledCount: scheduledCandidates.length,
      upcoming,
    };
  }, [candidates]);

  const hasSummaryData = summary.totalJobs || summary.totalCandidates || summary.totalScored;

  return (
    <AppShell
      title="Dashboard"
      description="See jobs, candidates, scores, recruiter decisions, and interviews in one view."
    >
      <div className="space-y-6 lg:space-y-7">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    isActive
                      ? 'inline-flex min-h-11 items-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition dark:bg-white dark:text-slate-950'
                      : 'inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  }
                  aria-pressed={isActive}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
            {error}
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <AnalyticsOverview
            summary={summary}
            candidates={candidates}
            scoresByCandidate={scoresByCandidate}
            isLoading={isLoading}
          />
        ) : null}

        {activeTab === 'jobs' ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Jobs</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Jobs overview</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">See which roles are getting the most candidate activity.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/jobs/create" className="btn-primary btn-compact">
                  Create Job
                </Link>
                <Link to="/jobs" className="btn-secondary btn-compact">
                  View Jobs
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active roles</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{summary.totalJobs}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Roles currently open in SmartHire.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/50 md:col-span-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Top job activity</p>
                <div className="mt-4 space-y-3">
                  {topJobs.length ? (
                    topJobs.map((job) => (
                      <div key={job.jobId || job.jobTitle} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{job.jobTitle}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Candidates in this role</p>
                        </div>
                        <span className="badge-muted">{job.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                      {hasSummaryData
                        ? 'Jobs data will appear here as candidates are assigned to roles.'
                        : 'Create your first role to start tracking hiring activity.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'candidates' ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Candidates</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Candidates overview</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Go straight to candidate uploads and reviews.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/candidates/upload" className="btn-primary btn-compact">
                  Upload Candidate
                </Link>
                <Link to="/candidates" className="btn-secondary btn-compact">
                  View Candidates
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Candidate count</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{summary.totalCandidates}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Candidates ready for recruiter review.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Scored candidates</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{summary.totalScored}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Candidates with scores ready to compare.</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'ai-scoring' ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">AI Scoring</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Top scored candidates</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start with the candidates who match the role most closely.</p>
              </div>
              <Link to="/candidates" className="btn-secondary btn-compact">
                Open Candidate List
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {topScoredCandidates.length ? (
                topScoredCandidates.map((candidate) => (
                  <div key={candidate._id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/45">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-950 dark:text-white">{candidate.fullName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {candidate.appliedJob?.title || 'Job not assigned'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge-muted">{candidate.scoreValue}/100</span>
                        <span className={getFitClassName(candidate.scoreValue)}>{getFitLabel(candidate.scoreValue)}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{candidate.scoreSummary}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                  Generate scores to see which candidates match your job best.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'recruiter-review' ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Recruiter Review</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Decision status</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">See how many candidates are shortlisted, pending, or rejected.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="status-card status-card-success">
                <p className="status-card-label">Shortlisted</p>
                <p className="status-card-value">{recruiterReviewStats.shortlisted}</p>
              </div>
              <div className="status-card status-card-pending">
                <p className="status-card-label">Pending Review</p>
                <p className="status-card-value">{recruiterReviewStats.pendingReview}</p>
              </div>
              <div className="status-card status-card-danger">
                <p className="status-card-label">Rejected</p>
                <p className="status-card-value">{recruiterReviewStats.rejected}</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'interviews' ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Interviews</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Upcoming interviews</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep upcoming interviews easy to spot and update.</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                Scheduled count: <span className="font-semibold text-slate-950 dark:text-white">{interviewOverview.scheduledCount}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {interviewOverview.upcoming.length ? (
                interviewOverview.upcoming.map((candidate) => (
                  <div key={candidate._id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/45">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950 dark:text-white">{candidate.fullName}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{candidate.appliedJob?.title || 'Job not assigned'}</p>
                      </div>
                      <span className="badge-muted">{normalizeStatus(candidate.interviewStatus || 'Scheduled')}</span>
                    </div>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatInterviewDate(candidate.interviewDate, candidate.interviewTime)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {candidate.interviewMode || 'Interview mode not set'}
                    </p>
                    <p className="mt-3 break-words text-sm text-slate-500 dark:text-slate-400">
                      {candidate.interviewLocation || 'Location or link not added yet'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400 md:col-span-2 2xl:col-span-4">
                  Schedule interviews from the candidates page to see them here.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
};

export default Dashboard;
