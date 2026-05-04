import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useNotifications } from './NotificationProvider';

const SUMMARY_SKELETON_COUNT = 7;

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

const normalizeStatus = (status = '') => {
  const value = String(status).trim().toLowerCase();

  if (!value || value === 'pending') {
    return 'Pending Review';
  }

  if (value === 'onhold' || value === 'on-hold') {
    return 'On Hold';
  }

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

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

const formatRelativeTime = (value) => {
  if (!value) {
    return 'Just now';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Just now';
  }

  const diffMs = parsed.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const minutes = Math.round(diffMs / 60000);

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute');
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour');
  }

  const days = Math.round(hours / 24);
  return formatter.format(days, 'day');
};

const ChartBarList = ({ items, emptyMessage, colorClass = 'bg-emerald-500 dark:bg-emerald-400' }) => {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
            <span className="shrink-0 text-slate-500 dark:text-slate-400">{item.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full ${colorClass}`}
              style={{ width: `${maxValue ? Math.max((item.value / maxValue) * 100, 8) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

function AnalyticsOverview({ summary, candidates, scoresByCandidate, isLoading }) {
  const { notifications } = useNotifications();

  const enrichedCandidates = useMemo(
    () =>
      candidates.map((candidate) => {
        const scoreEntry = scoresByCandidate[candidate._id];
        const numericScore = typeof scoreEntry?.score === 'number' ? scoreEntry.score : null;

        return {
          ...candidate,
          scoreValue: numericScore,
          recruiterDecision: normalizeStatus(candidate.recruiterStatus || 'Pending Review'),
          interviewStatus: normalizeStatus(candidate.interviewStatus || ''),
          matchedSkills: Array.isArray(scoreEntry?.matchedSkills) ? scoreEntry.matchedSkills : [],
        };
      }),
    [candidates, scoresByCandidate],
  );

  const recruiterReviewStats = useMemo(
    () =>
      enrichedCandidates.reduce(
        (accumulator, candidate) => {
          if (candidate.recruiterDecision === 'Shortlisted') {
            accumulator.shortlisted += 1;
          } else if (candidate.recruiterDecision === 'Rejected') {
            accumulator.rejected += 1;
          } else if (candidate.recruiterDecision === 'On Hold') {
            accumulator.onHold += 1;
          } else {
            accumulator.pendingReview += 1;
          }

          return accumulator;
        },
        {
          shortlisted: 0,
          pendingReview: 0,
          rejected: 0,
          onHold: 0,
        },
      ),
    [enrichedCandidates],
  );

  const summaryCards = useMemo(
    () => [
      { label: 'Total Jobs', value: summary.totalJobs, hint: 'Roles currently tracked' },
      { label: 'Total Candidates', value: summary.totalCandidates, hint: 'Candidates in review' },
      { label: 'Total Scored Candidates', value: summary.totalScored, hint: 'AI scores generated' },
      { label: 'Average AI Score', value: `${Math.round(summary.averageScore)} / 100`, hint: 'Across scored candidates' },
      { label: 'Shortlisted Candidates', value: recruiterReviewStats.shortlisted, hint: 'Ready for next step' },
      { label: 'Rejected Candidates', value: recruiterReviewStats.rejected, hint: 'Closed after review' },
      { label: 'Pending Review Candidates', value: recruiterReviewStats.pendingReview, hint: 'Need recruiter decision' },
    ],
    [recruiterReviewStats.pendingReview, recruiterReviewStats.rejected, recruiterReviewStats.shortlisted, summary.averageScore, summary.totalCandidates, summary.totalJobs, summary.totalScored],
  );

  const topJobs = useMemo(
    () => [...summary.candidatesPerJob].sort((first, second) => second.count - first.count).slice(0, 5),
    [summary.candidatesPerJob],
  );

  const candidatesPerJobChart = useMemo(
    () => topJobs.map((job) => ({ label: job.jobTitle, value: job.count })),
    [topJobs],
  );

  const decisionDistribution = useMemo(
    () => [
      { label: 'Shortlisted', value: recruiterReviewStats.shortlisted, tone: 'bg-emerald-500 dark:bg-emerald-400' },
      { label: 'Rejected', value: recruiterReviewStats.rejected, tone: 'bg-rose-500 dark:bg-rose-400' },
      { label: 'Pending Review', value: recruiterReviewStats.pendingReview, tone: 'bg-sky-500 dark:bg-sky-400' },
      { label: 'On Hold', value: recruiterReviewStats.onHold, tone: 'bg-amber-500 dark:bg-amber-400' },
    ].filter((item) => item.value > 0 || item.label !== 'On Hold'),
    [recruiterReviewStats],
  );

  const aiScoreDistribution = useMemo(() => {
    const buckets = [
      { label: '0-40', value: 0 },
      { label: '41-70', value: 0 },
      { label: '71-100', value: 0 },
    ];

    enrichedCandidates.forEach((candidate) => {
      if (typeof candidate.scoreValue !== 'number') {
        return;
      }

      if (candidate.scoreValue <= 40) {
        buckets[0].value += 1;
      } else if (candidate.scoreValue <= 70) {
        buckets[1].value += 1;
      } else {
        buckets[2].value += 1;
      }
    });

    return buckets;
  }, [enrichedCandidates]);

  const topScoredCandidates = useMemo(() => {
    const fromCandidateData = enrichedCandidates
      .filter((candidate) => typeof candidate.scoreValue === 'number')
      .sort((first, second) => second.scoreValue - first.scoreValue)
      .slice(0, 5);

    if (fromCandidateData.length) {
      return fromCandidateData;
    }

    return summary.topCandidates.slice(0, 5).map((candidate) => ({
      ...candidate,
      _id: candidate.candidateId,
      appliedJob: { title: candidate.jobTitle },
      scoreValue: candidate.score,
      recruiterDecision: 'Pending Review',
      matchedSkills: [],
    }));
  }, [enrichedCandidates, summary.topCandidates]);

  const interviewOverview = useMemo(() => {
    const scheduledStatuses = new Set(['Scheduled', 'Rescheduled']);
    const scheduledCandidates = enrichedCandidates.filter((candidate) =>
      scheduledStatuses.has(candidate.interviewStatus),
    );

    const upcoming = [...scheduledCandidates]
      .map((candidate) => ({
        ...candidate,
        interviewTimestamp: getInterviewTimestamp(candidate),
      }))
      .filter((candidate) => candidate.interviewTimestamp && candidate.interviewTimestamp >= Date.now())
      .sort((first, second) => first.interviewTimestamp - second.interviewTimestamp)
      .slice(0, 5);

    return {
      scheduledCount: scheduledCandidates.length,
      upcoming,
    };
  }, [enrichedCandidates]);

  const recentActivity = useMemo(() => notifications.slice(0, 5), [notifications]);

  return (
    <section className="space-y-4 lg:space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: SUMMARY_SKELETON_COUNT }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="skeleton-line h-4 w-28" />
                <div className="mt-3 skeleton-line h-7 w-24" />
                <div className="mt-2.5 skeleton-line h-3 w-24" />
              </div>
            ))
          : summaryCards.map((card) => (
              <div key={card.label} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="mt-2.5 text-[1.65rem] font-semibold tracking-tight text-slate-950 dark:text-white">{card.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{card.hint}</p>
              </div>
            ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Candidates per Job</p>
            <h2 className="mt-1.5 text-base font-semibold text-slate-950 dark:text-white">Where applications are landing</h2>
          </div>
          <ChartBarList
            items={candidatesPerJobChart}
            emptyMessage="Create jobs and assign candidates to see role activity here."
          />
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Recruiter Decision Distribution</p>
            <h2 className="mt-1.5 text-base font-semibold text-slate-950 dark:text-white">How reviews are moving</h2>
          </div>
          <div className="space-y-2.5">
            {decisionDistribution.map((item) => (
              <ChartBarList
                key={item.label}
                items={[{ label: item.label, value: item.value }]}
                emptyMessage=""
                colorClass={item.tone}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2 2xl:col-span-1">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">AI Score Distribution</p>
            <h2 className="mt-1.5 text-base font-semibold text-slate-950 dark:text-white">How candidate quality is spread</h2>
          </div>
          <ChartBarList
            items={aiScoreDistribution}
            emptyMessage="Generate AI scores to see distribution across score ranges."
            colorClass="bg-teal-500 dark:bg-teal-400"
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Top Candidates</p>
              <h2 className="mt-1.5 text-base font-semibold text-slate-950 dark:text-white">Highest scoring candidates right now</h2>
            </div>
            <Link to="/candidates" className="btn-secondary w-full sm:w-auto">
              Open Candidate List
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {topScoredCandidates.length ? (
              topScoredCandidates.map((candidate, index) => (
                <div
                  key={candidate._id || candidate.candidateId}
                  className={`rounded-2xl border px-4 py-4 ${
                    index === 0
                      ? 'border-emerald-300/90 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-950/20'
                      : 'border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/45'
                  }`}
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-950 dark:text-white">{candidate.fullName}</p>
                      <p className="mt-1 truncate text-[13px] text-slate-500 dark:text-slate-400">
                        {candidate.appliedJob?.title || candidate.jobTitle || 'Job not assigned'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {index === 0 ? <span className="badge-success">Best Score</span> : null}
                      {candidate.recruiterDecision === 'Shortlisted' ? (
                        <span className="badge-success">Shortlisted</span>
                      ) : null}
                      <span className="badge-muted">
                        {typeof candidate.scoreValue === 'number' ? `${candidate.scoreValue}/100` : 'Not Scored'}
                      </span>
                      <span className={getFitClassName(candidate.scoreValue)}>{getFitLabel(candidate.scoreValue)}</span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Decision: {candidate.recruiterDecision || 'Pending Review'}</span>
                    {candidate.matchedSkills?.length ? (
                      <span>Matched skills: {candidate.matchedSkills.slice(0, 3).join(', ')}</span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                Generate AI scores to highlight the strongest candidates here.
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 max-w-full space-y-4 overflow-hidden">
          <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-w-0 max-w-full flex-col gap-3 overflow-hidden sm:flex-row sm:items-start sm:justify-between">
              <div className="w-full min-w-0 max-w-full">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Upcoming Interviews</p>
                <h2 className="mt-1.5 text-base font-semibold text-slate-950 dark:text-white">What is scheduled next</h2>
              </div>
              <Link to="/interviews" className="btn-secondary w-full max-w-full min-w-0 justify-center sm:w-auto">
                Calendar
              </Link>
            </div>
            <div className="mt-3.5 space-y-2.5">
              {interviewOverview.upcoming.length ? (
                interviewOverview.upcoming.map((candidate) => (
                  <div key={candidate._id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/45">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-950 dark:text-white">{candidate.fullName}</p>
                      <span className="badge-muted">{candidate.interviewStatus || 'Scheduled'}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{formatInterviewDate(candidate.interviewDate, candidate.interviewTime)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                  No upcoming interviews scheduled yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Recent Activity</p>
            <h2 className="mt-1.5 text-base font-semibold text-slate-950 dark:text-white">Latest updates in SmartHire</h2>
            <div className="mt-3.5 space-y-2.5">
              {recentActivity.length ? (
                recentActivity.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/45">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.message}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(item.timestamp)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                  Activity will appear here when candidates are uploaded, scored, reviewed, or scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AnalyticsOverview;
