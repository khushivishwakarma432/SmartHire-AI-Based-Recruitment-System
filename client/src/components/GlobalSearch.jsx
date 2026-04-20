import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getCurrentUser } from '../api/auth';
import { getCandidates } from '../api/candidates';
import { getJobs } from '../api/jobs';
import { getStoredToken, isUnauthorizedError, removeToken } from '../utils/auth';

const SEARCH_DEBOUNCE_MS = 180;
const MAX_RESULTS_PER_GROUP = 4;

const normalizeValue = (value) => String(value || '').trim().toLowerCase();

function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [recruiter, setRecruiter] = useState(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadSearchData = async () => {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const [jobsResponse, candidatesResponse, recruiterResponse] = await Promise.all([
          getJobs(),
          getCandidates(),
          getCurrentUser(token),
        ]);

        if (!isMounted) {
          return;
        }

        setJobs(jobsResponse.jobs || []);
        setCandidates(candidatesResponse.candidates || []);
        setRecruiter(recruiterResponse || null);
        setLoadError('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (isUnauthorizedError(error)) {
          removeToken();
          navigate('/login', { replace: true });
          return;
        }

        setLoadError(error.message || 'Search is unavailable right now.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSearchData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOverlayOpen = (event) => {
      if (event.detail?.source !== 'search') {
        setIsOpen(false);
      }
    };

    window.addEventListener('smarthire-overlay-open', handleOverlayOpen);

    return () => {
      window.removeEventListener('smarthire-overlay-open', handleOverlayOpen);
    };
  }, []);

  const filteredResults = useMemo(() => {
    if (!debouncedQuery) {
      return {
        jobs: [],
        candidates: [],
        recruiters: [],
      };
    }

    const normalizedQuery = normalizeValue(debouncedQuery);

    const matchedJobs = jobs
      .filter((job) =>
        [job.title, job.department, job.location].some((value) => normalizeValue(value).includes(normalizedQuery)),
      )
      .slice(0, MAX_RESULTS_PER_GROUP);

    const matchedCandidates = candidates
      .filter((candidate) =>
        [candidate.fullName, candidate.email, candidate.appliedJob?.title].some((value) =>
          normalizeValue(value).includes(normalizedQuery),
        ),
      )
      .slice(0, MAX_RESULTS_PER_GROUP);

    const recruiterFields = recruiter
      ? [recruiter.name, recruiter.email, recruiter.workspaceName, recruiter.company, 'recruiter', 'settings']
      : [];

    const matchedRecruiters =
      recruiterFields.length && recruiterFields.some((value) => normalizeValue(value).includes(normalizedQuery))
        ? [recruiter]
        : [];

    return {
      jobs: matchedJobs,
      candidates: matchedCandidates,
      recruiters: matchedRecruiters,
    };
  }, [candidates, debouncedQuery, jobs, recruiter]);

  const totalResults =
    filteredResults.jobs.length + filteredResults.candidates.length + filteredResults.recruiters.length;
  const shouldShowDropdown = isOpen && (!!debouncedQuery || isLoading || !!loadError);

  const handleResultSelect = (result) => {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');

    if (result.type === 'job') {
      navigate(`/jobs/${result.item._id}`);
      return;
    }

    if (result.type === 'candidate') {
      navigate('/candidates', {
        state: {
          searchTerm: result.item.fullName || result.item.email || '',
          expandCandidateId: result.item._id,
        },
      });
      return;
    }

    navigate('/settings');
  };

  return (
    <div ref={containerRef} className="global-search-shell">
      <div className="global-search-input-wrap">
        <span aria-hidden="true" className="global-search-icon">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <circle cx="8.5" cy="8.5" r="4.75" />
            <path d="M12 12l4.25 4.25" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          className="global-search-input"
          type="search"
          placeholder="Search jobs, candidates, or recruiter"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!isOpen) {
              window.dispatchEvent(new CustomEvent('smarthire-overlay-open', { detail: { source: 'search' } }));
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            window.dispatchEvent(new CustomEvent('smarthire-overlay-open', { detail: { source: 'search' } }));
            setIsOpen(true);
          }}
          aria-label="Global SmartHire search"
        />
      </div>

      {shouldShowDropdown ? (
        <div className="global-search-dropdown" role="listbox" aria-label="Search results">
          {isLoading ? (
            <div className="global-search-status">Loading search results...</div>
          ) : loadError ? (
            <div className="global-search-status">{loadError}</div>
          ) : totalResults === 0 ? (
            <div className="global-search-status">No results found</div>
          ) : (
            <div className="global-search-groups">
              {filteredResults.jobs.length ? (
                <section className="global-search-group">
                  <p className="global-search-group-title">Jobs</p>
                  <div className="global-search-result-list">
                    {filteredResults.jobs.map((job) => (
                      <button
                        key={job._id}
                        className="global-search-result"
                        type="button"
                        onClick={() => handleResultSelect({ type: 'job', item: job })}
                      >
                        <span className="global-search-result-title">{job.title}</span>
                        <span className="global-search-result-meta">
                          {[job.department, job.location].filter(Boolean).join(' / ') || 'Open role'}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {filteredResults.candidates.length ? (
                <section className="global-search-group">
                  <p className="global-search-group-title">Candidates</p>
                  <div className="global-search-result-list">
                    {filteredResults.candidates.map((candidate) => (
                      <button
                        key={candidate._id}
                        className="global-search-result"
                        type="button"
                        onClick={() => handleResultSelect({ type: 'candidate', item: candidate })}
                      >
                        <span className="global-search-result-title">{candidate.fullName || 'Candidate'}</span>
                        <span className="global-search-result-meta">
                          {candidate.email || candidate.appliedJob?.title || 'Candidate profile'}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {filteredResults.recruiters.length ? (
                <section className="global-search-group">
                  <p className="global-search-group-title">Recruiter</p>
                  <div className="global-search-result-list">
                    {filteredResults.recruiters.map((currentRecruiter) => (
                      <button
                        key={currentRecruiter.email || currentRecruiter._id || 'recruiter'}
                        className="global-search-result"
                        type="button"
                        onClick={() => handleResultSelect({ type: 'recruiter', item: currentRecruiter })}
                      >
                        <span className="global-search-result-title">{currentRecruiter.name || 'Your profile'}</span>
                        <span className="global-search-result-meta">
                          {currentRecruiter.email || 'Open settings'}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default GlobalSearch;
