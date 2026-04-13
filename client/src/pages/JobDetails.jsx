import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getCandidatesByJob } from '../api/candidates';
import { deleteJob, getJobById } from '../api/jobs';
import { getLatestScores } from '../api/scores';
import AppShell from '../components/AppShell';
import { isUnauthorizedError, removeToken } from '../utils/auth';

const getRecommendation = (score) => {
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

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [topCandidates, setTopCandidates] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const [jobData, candidatesData] = await Promise.all([getJobById(id), getCandidatesByJob(id)]);

        setJob(jobData.job);

        try {
          const scoresData = await getLatestScores({ jobId: id });
          const scoresByCandidate = (scoresData.scores || []).reduce((accumulator, scoreEntry) => {
            accumulator[scoreEntry.candidateId] = scoreEntry;
            return accumulator;
          }, {});

          const rankedCandidates = (candidatesData.candidates || [])
            .map((candidate) => ({
              id: candidate._id,
              fullName: candidate.fullName,
              score: scoresByCandidate[candidate._id]?.score,
            }))
            .filter((candidate) => typeof candidate.score === 'number')
            .sort((first, second) => second.score - first.score)
            .slice(0, 3);

          setTopCandidates(rankedCandidates);
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

    loadJob();
  }, [id, navigate]);

  const handleDelete = async () => {
    setError('');
    setIsDeleting(true);

    try {
      await deleteJob(id);
      navigate('/jobs', { replace: true });
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      setError(requestError.message);
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      title="Job Details"
      description="Review the full information for this role."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary btn-compact" to="/jobs">
            All jobs
          </Link>
          <Link className="btn-secondary btn-compact" to={`/jobs/${id}/edit`}>
            Edit job
          </Link>
          <button
            className="btn-danger btn-compact disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="loading-state">Loading job details...</div>
      ) : job ? (
        <div className="grid gap-4">
          {error ? <p className="alert-error">{error}</p> : null}

          <section className="panel">
            <p className="kicker">{job.department}</p>
            <h2 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-slate-950 sm:text-[1.9rem]">{job.title}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {job.location} | {job.employmentType}
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="panel">
              <h3 className="title-lg">Description</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.description}</p>
            </div>

            <div className="panel">
              <h3 className="title-lg">Required skills</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(job.requiredSkills || []).length > 0 ? (
                  job.requiredSkills.map((skill) => (
                    <span key={skill} className="skill-pill">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No skills added yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="kicker">Top Candidates for this Job</p>
                <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
                  Highest scored matches for this role
                </h3>
                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                  Candidates are sorted automatically by AI score to highlight the strongest current fits.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {topCandidates.length ? (
                topCandidates.map((candidate, index) => {
                  const recommendation = getRecommendation(candidate.score);

                  return (
                    <article key={candidate.id} className="panel-muted">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Rank #{index + 1}
                          </p>
                          <h4 className="mt-1.5 text-base font-semibold text-slate-900">{candidate.fullName}</h4>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{candidate.score}/100</span>
                      </div>
                      <div className="mt-3">
                        <span className={`badge-compact ${recommendation.className}`}>
                          {recommendation.label}
                        </span>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state md:col-span-3">
                  <h4 className="title-lg">No scored candidates yet</h4>
                  <p className="body-muted mt-2">
                    Generate candidate scores for this role to see the top 3 ranked matches here.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="empty-state">
          <p className="alert-error">{error || 'Unable to load this job.'}</p>
        </div>
      )}
    </AppShell>
  );
}

export default JobDetails;
