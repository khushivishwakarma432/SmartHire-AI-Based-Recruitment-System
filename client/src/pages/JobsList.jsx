import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { deleteJob, getJobs } from '../api/jobs';
import AppShell from '../components/AppShell';
import { isUnauthorizedError, removeToken } from '../utils/auth';

const jobSkeletonCards = Array.from({ length: 4 }, (_, index) => index);

function JobsList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingJobId, setDeletingJobId] = useState('');
  const [openJobMenuId, setOpenJobMenuId] = useState('');

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await getJobs();
        setJobs(data.jobs || []);
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

    loadJobs();
  }, [navigate]);

  const handleDelete = async (jobId) => {
    setError('');
    setDeletingJobId(jobId);

    try {
      await deleteJob(jobId);
      setJobs((current) => current.filter((job) => job._id !== jobId));
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      setError(requestError.message);
    } finally {
      setDeletingJobId('');
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return [job.title, job.department, job.location]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearchTerm));
  });

  const toggleJobMenu = (jobId) => {
    setOpenJobMenuId((current) => (current === jobId ? '' : jobId));
  };

  return (
    <AppShell
      title="Jobs"
      description="Manage the roles created by your HR account."
      actions={
        <Link className="btn-primary btn-compact" to="/jobs/create">
          Create job
        </Link>
      }
    >
      {error ? <p className="alert-error">{error}</p> : null}

      <div className="panel p-3.5 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
          <label className="block w-full max-w-md">
            <span className="field-label mb-1">Search jobs</span>
            <input
              className="input-field"
              type="search"
              placeholder="Search by title, department, or location"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {normalizedSearchTerm
              ? `Showing ${filteredJobs.length} of ${jobs.length} jobs`
              : 'Search across your active job postings.'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {jobSkeletonCards.map((card) => (
            <div key={card} className="panel relative overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-slate-200/70" />
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="skeleton-line w-24" />
                  <div className="mt-3 skeleton-line h-7 w-2/3" />
                  <div className="mt-3 skeleton-line w-40" />
                  <div className="mt-4 space-y-2">
                    <div className="skeleton-line w-full" />
                    <div className="skeleton-line w-11/12" />
                    <div className="skeleton-line w-8/12" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="skeleton-pill w-20" />
                    <div className="skeleton-pill w-24" />
                    <div className="skeleton-pill w-16" />
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-2 xl:max-w-[220px] xl:justify-end">
                  <div className="skeleton-button w-16" />
                  <div className="skeleton-button w-16" />
                  <div className="skeleton-button w-18" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <p className="kicker">Jobs Workspace</p>
          <h2 className="title-lg">No jobs created yet</h2>
          <p className="body-muted mt-2">
            Create your first role to start organizing candidates and AI screening around an active opening.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link className="btn-primary btn-compact" to="/jobs/create">
              Create your first job
            </Link>
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <p className="kicker">Jobs Search</p>
          <h2 className="title-lg">No jobs match your search</h2>
          <p className="body-muted mt-2">
            Try a different title, department, or location to find the role you are looking for.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              className="btn-secondary btn-compact"
              type="button"
              onClick={() => setSearchTerm('')}
            >
              Clear search
            </button>
            <Link className="btn-primary btn-compact" to="/jobs/create">
              Create job
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredJobs.map((job) => (
            <article key={job._id} className="panel">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="kicker">{job.department}</p>
                  <h2 className="mt-2 text-[1.35rem] font-semibold tracking-tight text-slate-950">{job.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {job.location} | {job.employmentType}
                  </p>
                  <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-5 text-slate-600">
                    {job.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(job.requiredSkills || []).map((skill) => (
                      <span key={skill} className="skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative flex flex-wrap items-start gap-2 xl:max-w-[220px] xl:justify-end">
                  <Link className="btn-primary btn-compact" to={`/jobs/${job._id}`}>
                    View
                  </Link>
                  <button
                    className="btn-secondary btn-compact px-2.5"
                    type="button"
                    onClick={() => toggleJobMenu(job._id)}
                    aria-expanded={openJobMenuId === job._id}
                    aria-label="Open job actions"
                  >
                    More
                  </button>
                  {openJobMenuId === job._id ? (
                    <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[168px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-950">
                      <Link
                        className="flex w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                        to={`/jobs/${job._id}/edit`}
                        onClick={() => setOpenJobMenuId('')}
                      >
                        Edit Job
                      </Link>
                      <button
                        className="flex w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        type="button"
                        onClick={() => handleDelete(job._id)}
                        disabled={deletingJobId === job._id}
                      >
                        {deletingJobId === job._id ? 'Deleting...' : 'Delete Job'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default JobsList;
