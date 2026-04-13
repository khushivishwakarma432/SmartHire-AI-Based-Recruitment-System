import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getCandidates } from '../api/candidates';
import { getLatestScores } from '../api/scores';
import AppShell from '../components/AppShell';
import { isUnauthorizedError, removeToken } from '../utils/auth';

const getScoreClassName = (score) => {
  if (typeof score !== 'number') {
    return 'badge-muted';
  }

  if (score >= 80) {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (score >= 50) {
    return 'border border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border border-rose-200 bg-rose-50 text-rose-700';
};

const getRecommendation = (score) => {
  if (typeof score !== 'number') {
    return {
      label: 'Score Needed',
      className: 'badge-muted',
    };
  }

  if (score >= 80) {
    return {
      label: 'Strong Fit',
      className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (score >= 50) {
    return {
      label: 'Moderate Fit',
      className: 'border border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Low Fit',
    className: 'border border-rose-200 bg-rose-50 text-rose-700',
  };
};

const normalizeRecruiterStatus = (status) => {
  const normalizedStatus = String(status || '').trim();
  return normalizedStatus === 'Pending' || !normalizedStatus ? 'Pending Review' : normalizedStatus;
};

const getRecruiterStatusBadge = (status) => {
  const normalizedStatus = normalizeRecruiterStatus(status);

  if (normalizedStatus === 'Shortlisted') {
    return {
      label: normalizedStatus,
      className: 'badge-success',
    };
  }

  if (normalizedStatus === 'Rejected') {
    return {
      label: normalizedStatus,
      className: 'badge-danger',
    };
  }

  if (normalizedStatus === 'On Hold') {
    return {
      label: normalizedStatus,
      className: 'badge-warning',
    };
  }

  return {
    label: 'Pending Review',
    className: 'badge-muted',
  };
};

const getInterviewStatusBadge = (status) => {
  if (status === 'Completed') {
    return 'badge-success';
  }

  if (status === 'Rescheduled') {
    return 'badge-warning';
  }

  if (status === 'Scheduled') {
    return 'border border-sky-200 bg-sky-50 text-sky-700';
  }

  return 'badge-muted';
};

function CompareCandidates() {
  const location = useLocation();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [scoresByCandidate, setScoresByCandidate] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const selectedCandidateIds = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('ids') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 3);
  }, [location.search]);

  useEffect(() => {
    const loadCandidates = async () => {
      setIsLoading(true);
      setError('');

      try {
        const candidatesData = await getCandidates();
        setCandidates(candidatesData.candidates || []);

        try {
          const scoresData = await getLatestScores({ candidateIds: selectedCandidateIds });
          setScoresByCandidate(
            (scoresData.scores || []).reduce((accumulator, scoreEntry) => {
              accumulator[scoreEntry.candidateId] = scoreEntry;
              return accumulator;
            }, {}),
          );
        } catch (scoreRequestError) {
          if (isUnauthorizedError(scoreRequestError)) {
            removeToken();
            navigate('/login', { replace: true });
            return;
          }
        }
      } catch (requestError) {
        if (isUnauthorizedError(requestError)) {
          removeToken();
          navigate('/login', { replace: true });
          return;
        }

        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [navigate, selectedCandidateIds]);

  const comparableCandidates = useMemo(() => {
    return selectedCandidateIds
      .map((candidateId) => candidates.find((candidate) => candidate._id === candidateId))
      .filter(Boolean)
      .map((candidate) => ({
        ...candidate,
        scoreEntry: scoresByCandidate[candidate._id] || null,
      }))
      .sort((first, second) => {
        const firstScore = typeof first.scoreEntry?.score === 'number' ? first.scoreEntry.score : -1;
        const secondScore = typeof second.scoreEntry?.score === 'number' ? second.scoreEntry.score : -1;
        return secondScore - firstScore;
      });
  }, [candidates, scoresByCandidate, selectedCandidateIds]);

  const bestScore = useMemo(() => {
    const scores = comparableCandidates
      .map((candidate) => candidate.scoreEntry?.score)
      .filter((score) => typeof score === 'number');

    return scores.length ? Math.max(...scores) : null;
  }, [comparableCandidates]);

  return (
    <AppShell
      title="Compare Candidates"
      description="Review selected candidates side by side with scores, skills, recruiter feedback, and interview status."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary btn-compact" to="/candidates">
            Back to candidates
          </Link>
        </div>
      }
    >
      {error ? <p className="alert-error">{error}</p> : null}

      {isLoading ? (
        <div className="loading-state">Loading comparison...</div>
      ) : selectedCandidateIds.length < 2 ? (
        <div className="empty-state">
          <h2 className="title-lg">Select at least 2 candidates</h2>
          <p className="body-muted mt-2">
            Go back to the candidates list and choose two or three candidates to compare.
          </p>
        </div>
      ) : comparableCandidates.length === 0 ? (
        <div className="empty-state">
          <h2 className="title-lg">Selected candidates are unavailable</h2>
          <p className="body-muted mt-2">
            Return to the candidates page and choose active candidate records to compare.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="panel">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="kicker">Comparison Overview</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {comparableCandidates.length} candidates selected
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Use this view to compare AI score, skill gaps, recruiter decision, and interview progress without losing your current candidate list context.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-muted">
                  {bestScore !== null ? `Best AI score: ${bestScore}/100` : 'Generate AI scores to compare fit'}
                </span>
                <span className="badge-muted">
                  {comparableCandidates.filter((candidate) => normalizeRecruiterStatus(candidate.recruiterStatus) === 'Shortlisted').length} shortlisted
                </span>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            {comparableCandidates.map((candidate) => {
              const score = candidate.scoreEntry?.score;
              const recommendation = getRecommendation(score);
              const recruiterStatusBadge = getRecruiterStatusBadge(candidate.recruiterStatus);
              const isBestScore = bestScore !== null && score === bestScore;
              const isShortlisted = normalizeRecruiterStatus(candidate.recruiterStatus) === 'Shortlisted';
              const interviewStatus = candidate.interviewStatus || 'Not Scheduled';

              return (
                <article
                  key={candidate._id}
                  className={`compare-card ${isBestScore ? 'compare-card-best' : ''} ${isShortlisted ? 'compare-card-shortlisted' : ''}`}
                >
                  <div className="compare-card-header">
                    <div className="min-w-0">
                      <p className="kicker">Candidate</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        {candidate.fullName}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {candidate.appliedJob?.title || 'Not available'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{candidate.email || 'No email provided'}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {isBestScore ? <span className="compare-flag compare-flag-best">Best Score</span> : null}
                      {isShortlisted ? <span className="compare-flag compare-flag-shortlisted">Shortlisted</span> : null}
                      <span className={`badge-compact ${recommendation.className}`}>{recommendation.label}</span>
                    </div>
                  </div>

                  <div className="compare-stats-grid">
                    <div className="compare-stat-block">
                      <p className="compare-stat-label">AI Score</p>
                      <p className={`compare-stat-value ${isBestScore ? 'compare-stat-value-best' : ''}`}>
                        {typeof score === 'number' ? `${score}/100` : 'Not generated'}
                      </p>
                    </div>
                    <div className="compare-stat-block">
                      <p className="compare-stat-label">Recruiter Decision</p>
                      <span className={`badge-compact ${recruiterStatusBadge.className}`}>{recruiterStatusBadge.label}</span>
                    </div>
                    <div className="compare-stat-block compare-stat-block-full">
                      <p className="compare-stat-label">Interview Status</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge-compact ${getInterviewStatusBadge(interviewStatus)}`}>{interviewStatus}</span>
                        {candidate.interviewDate && candidate.interviewTime ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {candidate.interviewDate} at {candidate.interviewTime}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="compare-section">
                    <p className="compare-section-title">Matched Skills</p>
                    <div className="compare-tag-wrap">
                      {candidate.scoreEntry?.matchedSkills?.length ? (
                        candidate.scoreEntry.matchedSkills.map((skill) => (
                          <span key={`${candidate._id}-matched-${skill}`} className="compare-tag compare-tag-match">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="compare-empty-copy">No matched skills returned yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="compare-section">
                    <p className="compare-section-title">Missing Skills</p>
                    <div className="compare-tag-wrap">
                      {candidate.scoreEntry?.missingSkills?.length ? (
                        candidate.scoreEntry.missingSkills.map((skill) => (
                          <span key={`${candidate._id}-missing-${skill}`} className="compare-tag compare-tag-gap">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="compare-empty-copy">No missing skills returned yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="compare-section">
                    <p className="compare-section-title">AI Summary</p>
                    <p className="compare-copy">
                      {candidate.scoreEntry?.summary || 'Generate an AI score to see the summary and fit details.'}
                    </p>
                  </div>

                  <div className="compare-section">
                    <p className="compare-section-title">Recruiter Notes</p>
                    <p className="compare-copy">
                      {candidate.recruiterNotes || 'No recruiter notes added yet.'}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}
    </AppShell>
  );
}

export default CompareCandidates;
