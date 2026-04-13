import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCandidates, reviewCandidate } from '../api/candidates';
import { getLatestScores } from '../api/scores';
import AppShell from '../components/AppShell';
import { useToast } from '../components/ToastProvider';
import { isUnauthorizedError, removeToken } from '../utils/auth';

const PIPELINE_STAGES = [
  {
    id: 'uploaded',
    title: 'Uploaded',
    description: 'New candidates waiting for AI evaluation.',
    emptyTitle: 'No uploaded candidates',
    emptyCopy: 'Candidates without an AI score will appear here.',
  },
  {
    id: 'ai-evaluated',
    title: 'AI Evaluated',
    description: 'Scored candidates ready for recruiter review.',
    emptyTitle: 'No AI evaluated candidates',
    emptyCopy: 'Generate AI scores to move candidates into this stage.',
  },
  {
    id: 'shortlisted',
    title: 'Shortlisted',
    description: 'Strong candidates ready for follow-up.',
    emptyTitle: 'No shortlisted candidates',
    emptyCopy: 'Drag strong candidates here once you want to move forward.',
  },
  {
    id: 'rejected',
    title: 'Rejected',
    description: 'Candidates who are not moving forward.',
    emptyTitle: 'No rejected candidates',
    emptyCopy: 'Rejected candidates will remain visible here for tracking.',
  },
];

const normalizeRecruiterStatus = (status) => {
  const normalizedStatus = String(status || '').trim();
  return normalizedStatus === 'Pending' || !normalizedStatus ? 'Pending Review' : normalizedStatus;
};

const getPipelineStage = (candidate, scoreEntry) => {
  const recruiterStatus = normalizeRecruiterStatus(candidate?.recruiterStatus);

  if (recruiterStatus === 'Shortlisted') {
    return 'shortlisted';
  }

  if (recruiterStatus === 'Rejected') {
    return 'rejected';
  }

  return scoreEntry ? 'ai-evaluated' : 'uploaded';
};

const getStageStatusForPersist = (stageId) => {
  if (stageId === 'shortlisted') {
    return 'Shortlisted';
  }

  if (stageId === 'rejected') {
    return 'Rejected';
  }

  return 'Pending Review';
};

const getScoreBadgeClassName = (score) => {
  if (score >= 80) {
    return 'badge-success';
  }

  if (score >= 50) {
    return 'badge-warning';
  }

  return 'badge-danger';
};

const getStageDropErrorMessage = (stageId) => {
  if (stageId === 'uploaded') {
    return 'Scored candidates cannot return to Uploaded. They remain in AI Evaluated until you shortlist or reject them.';
  }

  if (stageId === 'ai-evaluated') {
    return 'This candidate needs an AI score before moving into AI Evaluated.';
  }

  return 'This candidate cannot move to the selected stage.';
};

function Pipeline() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [scoresByCandidate, setScoresByCandidate] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedCandidateId, setDraggedCandidateId] = useState('');
  const [dragOverStageId, setDragOverStageId] = useState('');
  const [updatingCandidateId, setUpdatingCandidateId] = useState('');

  useEffect(() => {
    const loadPipeline = async () => {
      setIsLoading(true);
      setError('');

      try {
        const candidatesData = await getCandidates();
        const nextCandidates = candidatesData.candidates || [];

        setCandidates(nextCandidates);

        if (!nextCandidates.length) {
          setScoresByCandidate({});
          return;
        }

        try {
          const scoreData = await getLatestScores({
            candidateIds: nextCandidates.map((candidate) => candidate._id),
          });
          const nextScores = (scoreData.scores || []).reduce((accumulator, scoreEntry) => {
            accumulator[scoreEntry.candidateId] = scoreEntry;
            return accumulator;
          }, {});

          setScoresByCandidate(nextScores);
        } catch (scoreError) {
          if (isUnauthorizedError(scoreError)) {
            removeToken();
            navigate('/login', { replace: true });
            return;
          }

          setScoresByCandidate({});
        }
      } catch (requestError) {
        if (isUnauthorizedError(requestError)) {
          removeToken();
          navigate('/login', { replace: true });
          return;
        }

        setError(requestError.message);
        setCandidates([]);
        showToast({
          title: 'Unable to load pipeline',
          message: requestError.message,
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPipeline();
  }, [navigate, showToast]);

  const stageBuckets = useMemo(() => {
    const nextBuckets = PIPELINE_STAGES.reduce((accumulator, stage) => {
      accumulator[stage.id] = [];
      return accumulator;
    }, {});

    candidates.forEach((candidate) => {
      const stageId = getPipelineStage(candidate, scoresByCandidate[candidate._id]);
      nextBuckets[stageId].push(candidate);
    });

    Object.values(nextBuckets).forEach((bucket) => {
      bucket.sort((firstCandidate, secondCandidate) => new Date(secondCandidate.uploadedAt) - new Date(firstCandidate.uploadedAt));
    });

    return nextBuckets;
  }, [candidates, scoresByCandidate]);

  const canMoveCandidateToStage = (candidate, stageId) => {
    const scoreEntry = scoresByCandidate[candidate._id];

    if (stageId === 'uploaded') {
      return !scoreEntry;
    }

    if (stageId === 'ai-evaluated') {
      return Boolean(scoreEntry);
    }

    return true;
  };

  const handleDragStart = (event, candidateId) => {
    if (updatingCandidateId) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', candidateId);
    setDraggedCandidateId(candidateId);
  };

  const handleDragEnd = () => {
    setDraggedCandidateId('');
    setDragOverStageId('');
  };

  const handleColumnDragOver = (event, stageId) => {
    if (!draggedCandidateId) {
      return;
    }

    event.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleColumnDragLeave = (event, stageId) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragOverStageId((current) => (current === stageId ? '' : current));
    }
  };

  const handleDropOnStage = async (event, stageId) => {
    event.preventDefault();

    const candidateId = draggedCandidateId;
    const candidate = candidates.find((currentCandidate) => currentCandidate._id === candidateId);

    setDragOverStageId('');
    setDraggedCandidateId('');

    if (!candidate || updatingCandidateId) {
      return;
    }

    const currentStageId = getPipelineStage(candidate, scoresByCandidate[candidate._id]);

    if (currentStageId === stageId) {
      return;
    }

    if (!canMoveCandidateToStage(candidate, stageId)) {
      showToast({
        title: 'Stage move blocked',
        message: getStageDropErrorMessage(stageId),
        type: 'error',
      });
      return;
    }

    const nextRecruiterStatus = getStageStatusForPersist(stageId);
    const previousCandidate = candidate;
    const optimisticCandidate = {
      ...candidate,
      recruiterStatus: nextRecruiterStatus,
    };

    setUpdatingCandidateId(candidateId);
    setCandidates((current) =>
      current.map((entry) => (entry._id === candidateId ? optimisticCandidate : entry)),
    );

    try {
      const data = await reviewCandidate(candidateId, {
        recruiterStatus: nextRecruiterStatus,
        recruiterNotes: candidate.recruiterNotes || '',
      });

      setCandidates((current) =>
        current.map((entry) => (entry._id === candidateId ? data.candidate : entry)),
      );
      showToast({
        title: 'Pipeline updated',
        message: `${data.candidate.fullName || 'Candidate'} moved to ${PIPELINE_STAGES.find((stage) => stage.id === stageId)?.title || 'the new stage'}.`,
        type: 'success',
      });
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      setCandidates((current) =>
        current.map((entry) => (entry._id === candidateId ? previousCandidate : entry)),
      );
      showToast({
        title: 'Unable to update pipeline',
        message: requestError.message,
        type: 'error',
      });
    } finally {
      setUpdatingCandidateId('');
    }
  };

  return (
    <AppShell
      title="Hiring Pipeline"
      description="Move candidates through a compact kanban pipeline without changing the existing candidate list or scoring workflow."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary btn-compact" to="/candidates">
            Candidate list
          </Link>
          <Link className="btn-primary btn-compact" to="/candidates/upload">
            Upload candidate
          </Link>
        </div>
      }
    >
      {error ? <p className="alert-error">{error}</p> : null}

      {isLoading ? (
        <div className="pipeline-board">
          {PIPELINE_STAGES.map((stage) => (
            <div className="pipeline-column" key={stage.id}>
              <div className="pipeline-column-head">
                <div>
                  <div className="skeleton-line w-24" />
                  <div className="mt-2 skeleton-line w-36" />
                </div>
                <div className="skeleton-pill w-12" />
              </div>
              <div className="pipeline-column-body">
                {Array.from({ length: 3 }, (_, index) => (
                  <div className="pipeline-card" key={`${stage.id}-${index}`}>
                    <div className="skeleton-line w-28" />
                    <div className="mt-2 skeleton-line w-32" />
                    <div className="mt-3 flex gap-2">
                      <div className="skeleton-pill w-16" />
                      <div className="skeleton-pill w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pipeline-board">
          {PIPELINE_STAGES.map((stage) => {
            const stageCandidates = stageBuckets[stage.id] || [];

            return (
              <section
                className={`pipeline-column ${dragOverStageId === stage.id ? 'pipeline-column-active' : ''}`}
                key={stage.id}
                onDragOver={(event) => handleColumnDragOver(event, stage.id)}
                onDragLeave={(event) => handleColumnDragLeave(event, stage.id)}
                onDrop={(event) => handleDropOnStage(event, stage.id)}
              >
                <div className="pipeline-column-head">
                  <div className="min-w-0">
                    <p className="pipeline-column-kicker">{stage.title}</p>
                    <p className="pipeline-column-copy">{stage.description}</p>
                  </div>
                  <span className="badge-muted">{stageCandidates.length}</span>
                </div>

                <div className="pipeline-column-body">
                  {stageCandidates.length ? (
                    stageCandidates.map((candidate) => {
                      const scoreEntry = scoresByCandidate[candidate._id];
                      const recruiterStatus = normalizeRecruiterStatus(candidate.recruiterStatus);
                      const isDragging = draggedCandidateId === candidate._id;
                      const isUpdating = updatingCandidateId === candidate._id;

                      return (
                        <article
                          className={`pipeline-card ${isDragging ? 'pipeline-card-dragging' : ''}`}
                          draggable={!isUpdating}
                          key={candidate._id}
                          onDragStart={(event) => handleDragStart(event, candidate._id)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="pipeline-card-title" title={candidate.fullName}>
                                {candidate.fullName}
                              </h3>
                              <p className="pipeline-card-copy" title={candidate.appliedJob?.title || 'Not available'}>
                                {candidate.appliedJob?.title || 'Not available'}
                              </p>
                            </div>
                            {isUpdating ? <span className="badge-muted">Saving</span> : null}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`badge-compact ${scoreEntry ? getScoreBadgeClassName(scoreEntry.score) : 'badge-muted'}`}>
                              {scoreEntry ? `${scoreEntry.score}/100` : 'No score'}
                            </span>
                            <span className="badge-muted">{recruiterStatus}</span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="pipeline-card-copy">
                              {scoreEntry ? 'AI evaluated' : 'Waiting for score'}
                            </span>
                            <Link
                              className="pipeline-card-link"
                              to="/candidates"
                              state={{ expandCandidateId: candidate._id }}
                            >
                              Open
                            </Link>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="pipeline-empty-state">
                      <p className="pipeline-empty-title">{stage.emptyTitle}</p>
                      <p className="pipeline-empty-copy">{stage.emptyCopy}</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

export default Pipeline;
