import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCandidates } from '../api/candidates';
import { getJobs } from '../api/jobs';
import AppShell from '../components/AppShell';
import { isUnauthorizedError, removeToken } from '../utils/auth';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const normalizeStatus = (status = '') => {
  const value = String(status || '').trim().toLowerCase();

  if (!value) {
    return 'Scheduled';
  }

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const parseLocalDate = (dateValue, timeValue = '09:00') => {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = String(dateValue).split('-').map(Number);
  const [hours = 9, minutes = 0] = String(timeValue || '09:00')
    .split(':')
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
};

const formatMonthLabel = (date) =>
  date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

const formatInterviewDateTime = (candidate) => {
  const parsed = parseLocalDate(candidate.interviewDate, candidate.interviewTime);

  if (!parsed) {
    return 'Not scheduled';
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getInterviewTimestamp = (candidate) => {
  const parsed = parseLocalDate(candidate.interviewDate, candidate.interviewTime);
  return parsed ? parsed.getTime() : null;
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInterviewStatusClassName = (status) => {
  if (status === 'Completed') {
    return 'badge-success';
  }

  if (status === 'Rescheduled') {
    return 'badge-warning';
  }

  if (status === 'Rejected') {
    return 'badge-danger';
  }

  return 'badge-muted';
};

function InterviewCalendar() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [modalState, setModalState] = useState({ isOpen: false, title: '', items: [] });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCalendarData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [jobsResponse, candidatesResponse] = await Promise.all([getJobs(), getCandidates()]);

        if (!isMounted) {
          return;
        }

        setJobs(jobsResponse.jobs || []);
        setCandidates(candidatesResponse.candidates || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        if (isUnauthorizedError(requestError)) {
          removeToken();
          navigate('/login', { replace: true });
          return;
        }

        setError(requestError.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCalendarData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const interviewCandidates = useMemo(
    () =>
      candidates
        .filter((candidate) => candidate.interviewDate)
        .map((candidate) => ({
          ...candidate,
          normalizedInterviewStatus: normalizeStatus(candidate.interviewStatus),
          interviewTimestamp: getInterviewTimestamp(candidate),
          jobId: candidate.appliedJob?._id || candidate.appliedJob || '',
        }))
        .sort((first, second) => {
          const firstTimestamp = first.interviewTimestamp || 0;
          const secondTimestamp = second.interviewTimestamp || 0;
          return firstTimestamp - secondTimestamp;
        }),
    [candidates],
  );

  const filteredInterviews = useMemo(
    () =>
      interviewCandidates.filter((candidate) => {
        const matchesJob = !selectedJob || candidate.jobId === selectedJob;
        const matchesCandidate = !selectedCandidateId || candidate._id === selectedCandidateId;
        const matchesStatus = !selectedStatus || candidate.normalizedInterviewStatus === selectedStatus;
        return matchesJob && matchesCandidate && matchesStatus;
      }),
    [interviewCandidates, selectedCandidateId, selectedJob, selectedStatus],
  );

  const interviewsByDate = useMemo(
    () =>
      filteredInterviews.reduce((accumulator, candidate) => {
        const key = candidate.interviewDate;
        if (!key) {
          return accumulator;
        }

        if (!accumulator[key]) {
          accumulator[key] = [];
        }

        accumulator[key].push(candidate);
        return accumulator;
      }, {}),
    [filteredInterviews],
  );

  const monthDays = useMemo(() => {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [monthDate]);

  const upcomingInterviews = useMemo(() => {
    const now = Date.now();
    return filteredInterviews
      .filter((candidate) => candidate.interviewTimestamp && candidate.interviewTimestamp >= now)
      .slice(0, 5);
  }, [filteredInterviews]);

  const candidateFilterOptions = useMemo(
    () =>
      interviewCandidates.map((candidate) => ({
        id: candidate._id,
        label: candidate.fullName || candidate.email || 'Candidate',
      })),
    [interviewCandidates],
  );

  const openInterviewModal = (items, title) => {
    setModalState({
      isOpen: true,
      title,
      items,
    });
  };

  const resetFilters = () => {
    setSelectedJob('');
    setSelectedCandidateId('');
    setSelectedStatus('');
  };

  const visibleInterviewCount = filteredInterviews.length;

  return (
    <AppShell
      title="Interview Calendar"
      description="View and manage scheduled interviews in one monthly calendar."
      actions={
        <div className="flex w-full max-w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            className="btn-secondary btn-compact w-full max-w-full min-w-0 justify-center sm:w-auto"
            type="button"
            onClick={() => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          >
            Previous Month
          </button>
          <button
            className="btn-secondary btn-compact w-full max-w-full min-w-0 justify-center sm:w-auto"
            type="button"
            onClick={() => setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))}
          >
            Today
          </button>
          <button
            className="btn-secondary btn-compact w-full max-w-full min-w-0 justify-center sm:w-auto"
            type="button"
            onClick={() => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          >
            Next Month
          </button>
          <Link className="btn-primary btn-compact w-full max-w-full min-w-0 justify-center sm:w-auto" to="/candidates">
            Schedule an Interview
          </Link>
        </div>
      }
    >
      {error ? <p className="alert-error">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="space-y-4">
          <div className="panel p-3.5">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="kicker">Calendar View</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {formatMonthLabel(monthDate)}
                  </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {visibleInterviewCount
                    ? `${visibleInterviewCount} interview${visibleInterviewCount === 1 ? '' : 's'} visible this month view`
                    : 'No interviews in the current filtered view'}
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[minmax(0,210px)_minmax(0,210px)_minmax(0,170px)_auto] xl:items-end">
                <label className="block w-full min-w-0">
                  <span className="field-label mb-1">Filter by job</span>
                  <select className="input-field" value={selectedJob} onChange={(event) => setSelectedJob(event.target.value)}>
                    <option value="">All jobs</option>
                    {jobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block w-full min-w-0">
                  <span className="field-label mb-1">Filter by candidate</span>
                  <select
                    className="input-field"
                    value={selectedCandidateId}
                    onChange={(event) => setSelectedCandidateId(event.target.value)}
                  >
                    <option value="">All candidates</option>
                    {candidateFilterOptions.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block w-full min-w-0">
                  <span className="field-label mb-1">Interview status</span>
                  <select className="input-field" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                    <option value="">All statuses</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </label>

                <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-1 xl:justify-end">
                  <button className="btn-secondary btn-compact" type="button" onClick={resetFilters}>
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="panel space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, index) => (
                  <div key={index} className="skeleton h-8 rounded-xl" />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, index) => (
                  <div key={index} className="skeleton h-24 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : interviewCandidates.length === 0 ? (
            <div className="empty-state">
              <p className="kicker">Interview Calendar</p>
              <h2 className="title-lg">No interviews scheduled yet</h2>
              <p className="body-muted mt-2">
                Once interviews are scheduled from the candidates page, they will appear here by date.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link className="btn-primary btn-compact" to="/candidates">
                  Schedule an Interview
                </Link>
              </div>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="empty-state">
              <p className="kicker">Interview Filters</p>
              <h2 className="title-lg">No interviews found</h2>
              <p className="body-muted mt-2">
                Try clearing one or more filters to see matching interview dates again.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button className="btn-secondary btn-compact" type="button" onClick={resetFilters}>
                  Clear filters
                </button>
                <Link className="btn-primary btn-compact" to="/candidates">
                  Schedule an Interview
                </Link>
              </div>
            </div>
          ) : (
            <div className="panel p-3">
              <div className="max-w-full pb-1">
                <div className="w-full max-w-full min-w-0">
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {DAY_LABELS.map((label) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-1 py-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400 sm:px-1.5 sm:text-[10px] sm:tracking-[0.14em]"
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="mt-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
                    {monthDays.map((date) => {
                      const dateKey = getDateKey(date);
                      const dayEvents = interviewsByDate[dateKey] || [];
                      const isCurrentMonth = date.getMonth() === monthDate.getMonth();
                      const isToday =
                        date.getFullYear() === today.getFullYear() &&
                        date.getMonth() === today.getMonth() &&
                        date.getDate() === today.getDate();
                      const visibleEvents = dayEvents.slice(0, 2);
                      const remainingCount = dayEvents.length - visibleEvents.length;

                      return (
                        <div
                          key={dateKey}
                          className={`min-h-[92px] min-w-0 rounded-[16px] border p-1 sm:min-h-[104px] sm:p-1.5 ${
                            isCurrentMonth
                              ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/70'
                              : 'border-slate-200/70 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/35'
                          } ${dayEvents.length ? 'ring-1 ring-emerald-400/20' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                                isToday
                                  ? 'bg-emerald-500 text-white'
                                  : isCurrentMonth
                                    ? 'text-slate-700 dark:text-slate-200'
                                    : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {date.getDate()}
                            </span>
                            {dayEvents.length ? <span className="badge-muted">{dayEvents.length}</span> : null}
                          </div>

                          <div className="mt-1.5 space-y-1">
                            {visibleEvents.map((candidate) => (
                              <button
                                key={candidate._id}
                                className="flex w-full flex-col rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/40 dark:hover:bg-slate-800"
                                type="button"
                                onClick={() =>
                                  openInterviewModal(
                                    [candidate],
                                    `${candidate.fullName || 'Candidate'} interview`,
                                  )
                                }
                              >
                                <span className="truncate text-[10px] font-semibold leading-4 text-slate-900 dark:text-white">
                                  {candidate.fullName || 'Candidate'}
                                </span>
                                <span className="text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                                  {candidate.interviewTime || 'Time not set'}
                                </span>
                              </button>
                            ))}

                            {remainingCount > 0 ? (
                              <button
                                className="inline-flex min-h-[24px] items-center rounded-lg border border-dashed border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
                                type="button"
                                onClick={() =>
                                  openInterviewModal(
                                    dayEvents,
                                    `${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} interviews`,
                                  )
                                }
                              >
                                +{remainingCount} more
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="panel p-4">
            <p className="kicker">Upcoming Interviews</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Next interviews
            </h2>

            {isLoading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="panel-muted space-y-2">
                    <div className="skeleton-line w-24" />
                    <div className="skeleton-line w-36" />
                    <div className="skeleton-line w-28" />
                  </div>
                ))}
              </div>
            ) : upcomingInterviews.length ? (
              <div className="mt-4 space-y-2.5">
                {upcomingInterviews.map((candidate) => (
                  <button
                    key={candidate._id}
                    className="panel-muted w-full text-left transition hover:border-emerald-300 dark:hover:border-emerald-500/40"
                    type="button"
                    onClick={() =>
                      openInterviewModal(
                        [candidate],
                        `${candidate.fullName || 'Candidate'} interview`,
                      )
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                          {candidate.fullName || 'Candidate'}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
                          {candidate.appliedJob?.title || 'No job assigned'}
                        </p>
                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {formatInterviewDateTime(candidate)}
                        </p>
                      </div>
                      <span className={`badge-compact ${getInterviewStatusClassName(candidate.normalizedInterviewStatus)}`}>
                        {candidate.normalizedInterviewStatus}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state mt-4 min-h-[180px]">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No upcoming interviews</h3>
                <p className="body-muted mt-2">
                  Scheduled interviews in the future will appear here for quicker review.
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>

      {modalState.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-6">
          <div className="w-full max-w-2xl rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <p className="kicker">Interview Details</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {modalState.title}
                </h2>
              </div>
              <button className="btn-secondary btn-compact" type="button" onClick={() => setModalState({ isOpen: false, title: '', items: [] })}>
                Close
              </button>
            </div>

            <div className="max-h-[min(78vh,38rem)] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="space-y-4">
                {modalState.items.map((candidate) => (
                  <article key={candidate._id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {candidate.fullName || 'Candidate'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {candidate.appliedJob?.title || 'No applied job'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{candidate.email || 'No email provided'}</p>
                      </div>
                      <span className={`badge-compact ${getInterviewStatusClassName(candidate.normalizedInterviewStatus || normalizeStatus(candidate.interviewStatus))}`}>
                        {candidate.normalizedInterviewStatus || normalizeStatus(candidate.interviewStatus)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[16px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/70">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Interview Date</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{candidate.interviewDate || 'Not set'}</p>
                      </div>
                      <div className="rounded-[16px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/70">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Interview Time</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{candidate.interviewTime || 'Not set'}</p>
                      </div>
                      <div className="rounded-[16px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/70">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Interview Mode</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{candidate.interviewMode || 'Not set'}</p>
                      </div>
                      <div className="rounded-[16px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/70">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Location / Link</p>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">
                          {candidate.interviewLocation || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[16px] border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/70">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Recruiter Notes</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {candidate.recruiterNotes || 'No recruiter notes added yet.'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

export default InterviewCalendar;
