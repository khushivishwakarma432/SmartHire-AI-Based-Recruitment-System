import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  getCandidates,
  getCandidatesByJob,
  reviewCandidate,
  scheduleCandidateInterview,
  updateCandidateTags,
} from '../api/candidates';
import { getJobs } from '../api/jobs';
import { useNotifications } from '../components/NotificationProvider';
import { generateScore, getLatestScores } from '../api/scores';
import AppShell from '../components/AppShell';
import { useToast } from '../components/ToastProvider';
import { withApiBase } from '../api/baseUrl';
import { downloadCandidateReportPdf } from '../utils/candidateReportPdf';
import { isUnauthorizedError, removeToken } from '../utils/auth';

const SCORE_STORAGE_KEY = 'smarthire_candidate_scores';
const COMPARE_SELECTION_STORAGE_KEY = 'smarthire_compare_selection';
const CANDIDATE_VIEW_STATE_STORAGE_KEY = 'smarthire_candidate_view_state';
const candidateTableSkeletonRows = Array.from({ length: 6 }, (_, index) => index);
const SUGGESTED_CANDIDATE_TAGS = [
  'High Potential',
  'Follow Up',
  'Strong Communication',
  'Needs Training',
  'Good Culture Fit',
  'Priority',
];

const getStoredScores = () => {
  try {
    const storedValue = localStorage.getItem(SCORE_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : {};
  } catch (error) {
    return {};
  }
};

const saveStoredScores = (scores) => {
  localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores));
};

const getStoredCompareSelection = () => {
  try {
    const storedValue = sessionStorage.getItem(COMPARE_SELECTION_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue) ? parsedValue.slice(0, 3) : [];
  } catch (error) {
    return [];
  }
};

const saveCompareSelection = (selectedIds) => {
  try {
    sessionStorage.setItem(COMPARE_SELECTION_STORAGE_KEY, JSON.stringify(selectedIds.slice(0, 3)));
  } catch (error) {
    // Ignore storage failures and keep the in-memory selection.
  }
};

const getStoredCandidateViewState = () => {
  try {
    const storedValue = sessionStorage.getItem(CANDIDATE_VIEW_STATE_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : {};

    return {
        selectedJob: parsedValue.selectedJob || '',
        searchTerm: parsedValue.searchTerm || '',
        sortBy: parsedValue.sortBy || 'latest',
        selectedFitTag: parsedValue.selectedFitTag || '',
        selectedRecruiterStatus: parsedValue.selectedRecruiterStatus || '',
        selectedCandidateTag: parsedValue.selectedCandidateTag || '',
      };
  } catch (error) {
    return {
        selectedJob: '',
        searchTerm: '',
        sortBy: 'latest',
        selectedFitTag: '',
        selectedRecruiterStatus: '',
        selectedCandidateTag: '',
      };
  }
};

const saveCandidateViewState = (viewState) => {
  try {
    sessionStorage.setItem(CANDIDATE_VIEW_STATE_STORAGE_KEY, JSON.stringify(viewState));
  } catch (error) {
    // Ignore storage failures and keep the in-memory state.
  }
};

const getScoreClassName = (score) => {
  if (score >= 80) {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (score >= 50) {
    return 'border border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border border-rose-200 bg-rose-50 text-rose-700';
};

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

const getMatchedSkillsExplanation = (matchedSkills = []) => {
  if (!matchedSkills.length) {
    return 'The score did not identify strong alignment with the listed must-have skills for this role.';
  }

  return `The candidate shows evidence of ${matchedSkills.join(', ')}, which supports closer alignment with the role requirements.`;
};

const getMissingSkillsExplanation = (missingSkills = []) => {
  if (!missingSkills.length) {
    return 'No major skill gaps were highlighted, which suggests the profile is broadly aligned with the current job criteria.';
  }

  return `${missingSkills.join(', ')} were identified as missing or less visible. These gaps matter because they may affect day-one readiness for the role.`;
};

const getScoreReason = (score, matchedSkills = [], missingSkills = []) => {
  if (score >= 80) {
    return `This candidate scored highly because the profile appears to align well with the role, with ${matchedSkills.length || 'multiple'} relevant skill matches and limited critical gaps.`;
  }

  if (score >= 50) {
    return `This candidate received a mid-range score because there is partial alignment with the role, but some important skills are either missing or not strongly evidenced.`;
  }

  return `This candidate scored lower because the current profile shows limited alignment with the role and too many important skills appear to be missing or unclear.`;
};

const getStrengthWeaknessSummary = (score, matchedSkills = [], missingSkills = [], summary = '') => {
  const strengthLead = matchedSkills.length
    ? `Strengths show up most clearly in ${matchedSkills.slice(0, 3).join(', ')}.`
    : score >= 80
      ? 'The profile looks broadly aligned with the role requirements.'
      : 'Clear standout strengths were not strongly evidenced in the evaluation.';

  const weaknessLead = missingSkills.length
    ? `The main gaps are ${missingSkills.slice(0, 3).join(', ')}.`
    : score >= 80
      ? 'No major gaps were highlighted in the latest score.'
      : 'The evaluation did not surface strong evidence for the most important missing requirements.';

  if (summary) {
    return `${strengthLead} ${weaknessLead}`;
  }

  return `${strengthLead} ${weaknessLead}`;
};

const getSuggestedRecruiterAction = (score) => {
  if (score >= 80) {
    return {
      label: 'Proceed to Shortlist',
      description: 'The profile looks strong enough to move forward quickly.',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (score >= 50) {
    return {
      label: 'Review Before Decision',
      description: 'There is enough alignment to justify a closer recruiter review.',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Not a Strong Match Yet',
    description: 'The profile likely needs a different role or should stay out of the shortlist.',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  };
};

const getScoreErrorMessage = (error) => {
  if (isUnauthorizedError(error)) {
    return error.message;
  }

  if (error?.statusCode === 503) {
    return 'AI scoring is temporarily unavailable due to model traffic. Please try again in a few moments.';
  }

  if (error?.statusCode === 504) {
    return 'AI scoring took too long to respond. Please try again in a few moments.';
  }

  if (error?.details) {
    return `${error.message} ${error.details}`.trim();
  }

  return error?.message || 'AI scoring failed. Please try again.';
};

const normalizeRecruiterStatus = (status) => {
  const normalizedStatus = String(status || '').trim();
  return normalizedStatus === 'Pending' || !normalizedStatus ? 'Pending Review' : normalizedStatus;
};

const normalizeCandidateTags = (tags = []) => {
  const seen = new Set();
  const values = Array.isArray(tags)
    ? tags
    : String(tags || '')
        .split(',')
        .map((tag) => tag.trim());

  return values.reduce((accumulator, tag) => {
    const normalizedTag = String(tag || '').trim();
    const key = normalizedTag.toLowerCase();

    if (!normalizedTag || seen.has(key)) {
      return accumulator;
    }

    seen.add(key);
    accumulator.push(normalizedTag);
    return accumulator;
  }, []);
};

const getRecruiterStatusBadge = (status) => {
  const normalizedStatus = normalizeRecruiterStatus(status);

  if (normalizedStatus === 'Shortlisted') {
    return {
      label: normalizedStatus,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (normalizedStatus === 'Rejected') {
    return {
      label: normalizedStatus,
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  if (normalizedStatus === 'On Hold') {
    return {
      label: normalizedStatus,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Pending Review',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  };
};

const getInterviewStatusBadge = (status) => {
  if (status === 'Completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'Rescheduled') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (status === 'Scheduled') {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600';
};

function CandidatesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const storedViewState = getStoredCandidateViewState();
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState(storedViewState.selectedJob);
  const [searchTerm, setSearchTerm] = useState(storedViewState.searchTerm);
  const [sortBy, setSortBy] = useState(storedViewState.sortBy);
  const [selectedFitTag, setSelectedFitTag] = useState(storedViewState.selectedFitTag);
  const [selectedRecruiterStatus, setSelectedRecruiterStatus] = useState(storedViewState.selectedRecruiterStatus);
  const [selectedCandidateTag, setSelectedCandidateTag] = useState(storedViewState.selectedCandidateTag);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(getStoredCompareSelection);
  const [scoresByCandidate, setScoresByCandidate] = useState(getStoredScores);
  const [reviewDraftsByCandidate, setReviewDraftsByCandidate] = useState({});
  const [interviewDraftsByCandidate, setInterviewDraftsByCandidate] = useState({});
  const [tagDraftsByCandidate, setTagDraftsByCandidate] = useState({});
  const [loadingScores, setLoadingScores] = useState({});
  const [savingReviewByCandidate, setSavingReviewByCandidate] = useState({});
  const [savingInterviewByCandidate, setSavingInterviewByCandidate] = useState({});
  const [savingTagsByCandidate, setSavingTagsByCandidate] = useState({});
  const [generatingReportByCandidate, setGeneratingReportByCandidate] = useState({});
  const [scoreErrors, setScoreErrors] = useState({});
  const [expandedCandidateId, setExpandedCandidateId] = useState('');
  const [error, setError] = useState('');
  const [reviewMessagesByCandidate, setReviewMessagesByCandidate] = useState({});
  const [reviewErrorsByCandidate, setReviewErrorsByCandidate] = useState({});
  const [interviewMessagesByCandidate, setInterviewMessagesByCandidate] = useState({});
  const [interviewErrorsByCandidate, setInterviewErrorsByCandidate] = useState({});
  const [tagMessagesByCandidate, setTagMessagesByCandidate] = useState({});
  const [tagErrorsByCandidate, setTagErrorsByCandidate] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [openActionMenuId, setOpenActionMenuId] = useState('');

  useEffect(() => {
    const nextState = location.state;

    if (!nextState || (!nextState.searchTerm && !nextState.expandCandidateId)) {
      return;
    }

    if (nextState.searchTerm) {
      setSearchTerm(nextState.searchTerm);
    }

    if (nextState.expandCandidateId) {
      setExpandedCandidateId(nextState.expandCandidateId);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

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
        showToast({
          title: 'Unable to load jobs',
          message: requestError.message,
          type: 'error',
        });
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobs();
  }, [navigate]);

  useEffect(() => {
    const loadCandidates = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = selectedJob ? await getCandidatesByJob(selectedJob) : await getCandidates();
        const nextCandidates = data.candidates || [];

        setCandidates(nextCandidates);
        setReviewDraftsByCandidate((current) => {
          const nextDrafts = { ...current };
          const nextInterviewDrafts = {};
          const nextTagDrafts = {};

          nextCandidates.forEach((candidate) => {
            nextDrafts[candidate._id] = {
              recruiterStatus: normalizeRecruiterStatus(candidate.recruiterStatus),
              recruiterNotes: candidate.recruiterNotes || '',
            };
            nextInterviewDrafts[candidate._id] = {
              interviewDate: candidate.interviewDate || '',
              interviewTime: candidate.interviewTime || '',
              interviewMode: candidate.interviewMode || '',
              interviewLocation: candidate.interviewLocation || '',
              interviewStatus: candidate.interviewStatus || '',
            };
            nextTagDrafts[candidate._id] = {
              input: '',
              tags: normalizeCandidateTags(candidate.tags),
            };
          });

          setInterviewDraftsByCandidate(nextInterviewDrafts);
          setTagDraftsByCandidate(nextTagDrafts);

          return nextDrafts;
        });

        try {
          let nextScoresByCandidate = {};

          if (nextCandidates.length) {
            const scoreData = await getLatestScores({
              candidateIds: nextCandidates.map((candidate) => candidate._id),
            });

            nextScoresByCandidate = (scoreData.scores || []).reduce((accumulator, scoreEntry) => {
              accumulator[scoreEntry.candidateId] = scoreEntry;
              return accumulator;
            }, {});
          }

          setScoresByCandidate(nextScoresByCandidate);
          saveStoredScores(nextScoresByCandidate);
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
        showToast({
          title: 'Unable to load candidates',
          message: requestError.message,
          type: 'error',
        });
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [navigate, selectedJob]);

  useEffect(() => {
    setSelectedCandidateIds((current) => current.filter((candidateId) => candidates.some((candidate) => candidate._id === candidateId)));
    setExpandedCandidateId((current) => (candidates.some((candidate) => candidate._id === current) ? current : ''));
    setOpenActionMenuId((current) => (candidates.some((candidate) => candidate._id === current) ? current : ''));
  }, [candidates]);

  useEffect(() => {
    saveCompareSelection(selectedCandidateIds);
  }, [selectedCandidateIds]);

  useEffect(() => {
    saveCandidateViewState({
      selectedJob,
      searchTerm,
      sortBy,
      selectedFitTag,
      selectedRecruiterStatus,
      selectedCandidateTag,
    });
  }, [searchTerm, selectedCandidateTag, selectedFitTag, selectedJob, selectedRecruiterStatus, sortBy]);

  const handleJobChange = (event) => {
    setSelectedJob(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleFitTagChange = (event) => {
    setSelectedFitTag(event.target.value);
  };

  const handleRecruiterStatusChange = (event) => {
    setSelectedRecruiterStatus(event.target.value);
  };

  const handleCandidateTagChange = (event) => {
    setSelectedCandidateTag(event.target.value);
  };

  const handleGenerateScore = async (candidate) => {
    const jobId = candidate.appliedJob?._id || candidate.appliedJob;

    if (!jobId) {
      showToast({
        title: 'Score unavailable',
        message: 'Candidate does not have a valid applied job.',
        type: 'error',
      });
      setScoreErrors((current) => ({
        ...current,
        [candidate._id]: 'Candidate does not have a valid applied job.',
      }));
      return;
    }

    setLoadingScores((current) => ({ ...current, [candidate._id]: true }));
    setScoreErrors((current) => ({ ...current, [candidate._id]: '' }));

    try {
      const data = await generateScore(candidate._id, jobId);
      setScoresByCandidate((current) => {
        const nextScores = {
          ...current,
          [candidate._id]: data.score,
        };

        saveStoredScores(nextScores);
        return nextScores;
      });
      showToast({
        title: 'AI score generated',
        message: `${candidate.fullName} has a fresh evaluation ready to review.`,
        type: 'success',
      });
      addNotification({
        type: 'score',
        message: `AI score generated for ${candidate.fullName}.`,
        reference: {
          candidateId: candidate._id,
          candidateName: candidate.fullName,
          jobId,
        },
      });
      setExpandedCandidateId(candidate._id);
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      const message = getScoreErrorMessage(requestError);
      setScoreErrors((current) => ({
        ...current,
        [candidate._id]: message,
      }));
      showToast({
        title: 'Score generation failed',
        message,
        type: 'error',
      });
    } finally {
      setLoadingScores((current) => ({ ...current, [candidate._id]: false }));
    }
  };

  const toggleExpandedRow = (candidateId) => {
    setExpandedCandidateId((current) => (current === candidateId ? '' : candidateId));
    setOpenActionMenuId('');
  };

  const toggleActionMenu = (candidateId) => {
    setOpenActionMenuId((current) => (current === candidateId ? '' : candidateId));
  };

  const updateReviewDraft = (candidateId, field, value) => {
    setReviewMessagesByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setReviewErrorsByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setReviewDraftsByCandidate((current) => ({
      ...current,
      [candidateId]: {
        recruiterStatus: current[candidateId]?.recruiterStatus || 'Pending Review',
        recruiterNotes: current[candidateId]?.recruiterNotes || '',
        [field]: value,
      },
    }));
  };

  const updateInterviewDraft = (candidateId, field, value) => {
    setInterviewMessagesByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setInterviewErrorsByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setInterviewDraftsByCandidate((current) => ({
      ...current,
      [candidateId]: {
        interviewDate: current[candidateId]?.interviewDate || '',
        interviewTime: current[candidateId]?.interviewTime || '',
        interviewMode: current[candidateId]?.interviewMode || '',
        interviewLocation: current[candidateId]?.interviewLocation || '',
        interviewStatus: current[candidateId]?.interviewStatus || '',
        [field]: value,
      },
    }));
  };

  const updateTagInput = (candidateId, value) => {
    setTagMessagesByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setTagErrorsByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setTagDraftsByCandidate((current) => ({
      ...current,
      [candidateId]: {
        input: value,
        tags: current[candidateId]?.tags || [],
      },
    }));
  };

  const syncCandidateTagsLocally = (candidateId, nextTags, nextInput = '') => {
    const normalizedTags = normalizeCandidateTags(nextTags);

    setCandidates((current) =>
      current.map((candidate) =>
        candidate._id === candidateId
          ? {
              ...candidate,
              tags: normalizedTags,
            }
          : candidate,
      ),
    );
    setTagDraftsByCandidate((current) => ({
      ...current,
      [candidateId]: {
        input: nextInput,
        tags: normalizedTags,
      },
    }));

    return normalizedTags;
  };

  const persistCandidateTags = async (candidateId, nextTags, options = {}) => {
    const {
      nextInput = '',
      successMessage = 'Candidate tags updated.',
      showSuccessToast = false,
    } = options;
    const normalizedTags = normalizeCandidateTags(nextTags);
    const currentCandidate = candidates.find((candidate) => candidate._id === candidateId);
    const previousTags = normalizeCandidateTags(currentCandidate?.tags);
    const previousDraft = tagDraftsByCandidate[candidateId] || {
      input: '',
      tags: previousTags,
    };

    syncCandidateTagsLocally(candidateId, normalizedTags, nextInput);
    setTagMessagesByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setTagErrorsByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setSavingTagsByCandidate((current) => ({
      ...current,
      [candidateId]: true,
    }));

    try {
      const data = await updateCandidateTags(candidateId, {
        tags: normalizedTags,
      });
      const savedTags = normalizeCandidateTags(data.candidate.tags);

      setCandidates((current) =>
        current.map((candidate) => (candidate._id === candidateId ? data.candidate : candidate)),
      );
      setTagDraftsByCandidate((current) => ({
        ...current,
        [candidateId]: {
          input: '',
          tags: savedTags,
        },
      }));
      setTagMessagesByCandidate((current) => ({
        ...current,
        [candidateId]: successMessage,
      }));

      if (showSuccessToast) {
        showToast({
          title: 'Tags updated',
          message: 'Candidate tags were saved successfully.',
          type: 'success',
        });
      }
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      syncCandidateTagsLocally(candidateId, previousDraft.tags, previousDraft.input || '');
      setTagErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: requestError.message || 'Unable to save candidate tags.',
      }));
      showToast({
        title: 'Unable to save tags',
        message: requestError.message || 'Candidate tags could not be updated.',
        type: 'error',
      });
    } finally {
      setSavingTagsByCandidate((current) => ({
        ...current,
        [candidateId]: false,
      }));
    }
  };

  const handleAddCandidateTag = async (candidateId, rawTag) => {
    const normalizedTag = String(rawTag || '').trim();

    if (!normalizedTag) {
      setTagErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: 'Please enter a tag before adding it.',
      }));
      return;
    }

    if (savingTagsByCandidate[candidateId]) {
      return;
    }

    setTagMessagesByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setTagErrorsByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    const currentDraft = tagDraftsByCandidate[candidateId] || {
      input: '',
      tags: normalizeCandidateTags(candidates.find((candidate) => candidate._id === candidateId)?.tags),
    };
    const nextTags = normalizeCandidateTags([...currentDraft.tags, normalizedTag]);

    if (nextTags.length === currentDraft.tags.length) {
      setTagErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: `"${normalizedTag}" is already added.`,
      }));
      return;
    }

    await persistCandidateTags(candidateId, nextTags, {
      successMessage: `"${normalizedTag}" added.`,
    });
  };

  const handleRemoveCandidateTag = async (candidateId, tagToRemove) => {
    if (savingTagsByCandidate[candidateId]) {
      return;
    }

    setTagMessagesByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setTagErrorsByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    const currentDraft = tagDraftsByCandidate[candidateId] || {
      input: '',
      tags: normalizeCandidateTags(candidates.find((candidate) => candidate._id === candidateId)?.tags),
    };
    const nextTags = currentDraft.tags.filter(
      (tag) => tag.toLowerCase() !== String(tagToRemove || '').trim().toLowerCase(),
    );

    await persistCandidateTags(candidateId, nextTags, {
      successMessage: `"${String(tagToRemove || '').trim()}" removed.`,
      nextInput: currentDraft.input || '',
    });
  };

  const handleTagInputKeyDown = async (event, candidateId) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    await handleAddCandidateTag(candidateId, tagDraftsByCandidate[candidateId]?.input || '');
  };

  const handleSaveReview = async (candidateId) => {
    const reviewDraft = reviewDraftsByCandidate[candidateId] || {
      recruiterStatus: 'Pending Review',
      recruiterNotes: '',
    };
    const normalizedNotes = reviewDraft.recruiterNotes.trim();

    if (!reviewDraft.recruiterStatus) {
      showToast({
        title: 'Review blocked',
        message: 'Please select a recruiter status.',
        type: 'error',
      });
      setReviewErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: 'Please select a recruiter status.',
      }));
      return;
    }

    if (normalizedNotes.length > 1000) {
      showToast({
        title: 'Review blocked',
        message: 'Recruiter notes must be 1000 characters or fewer.',
        type: 'error',
      });
      setReviewErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: 'Recruiter notes must be 1000 characters or fewer.',
      }));
      return;
    }

    setReviewMessagesByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setReviewErrorsByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setSavingReviewByCandidate((current) => ({ ...current, [candidateId]: true }));
    setError('');

    try {
      const data = await reviewCandidate(candidateId, {
        recruiterStatus: reviewDraft.recruiterStatus,
        recruiterNotes: normalizedNotes,
      });

      setCandidates((current) =>
        current.map((candidate) => (candidate._id === candidateId ? data.candidate : candidate)),
      );
      setReviewDraftsByCandidate((current) => ({
        ...current,
        [candidateId]: {
          recruiterStatus: normalizeRecruiterStatus(data.candidate.recruiterStatus),
          recruiterNotes: data.candidate.recruiterNotes || '',
        },
      }));
      setReviewMessagesByCandidate((current) => ({
        ...current,
        [candidateId]: 'Recruiter review saved successfully.',
      }));
      showToast({
        title: 'Review saved',
        message: 'Recruiter status and notes were updated.',
        type: 'success',
      });
      addNotification({
        type: 'decision',
        message: `${data.candidate.fullName || 'Candidate'} was marked ${normalizeRecruiterStatus(data.candidate.recruiterStatus)}.`,
        reference: {
          candidateId,
          candidateName: data.candidate.fullName || '',
          jobId: data.candidate.appliedJob?._id || data.candidate.appliedJob || '',
        },
      });
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      setReviewErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: requestError.message,
      }));
      showToast({
        title: 'Unable to save review',
        message: requestError.message,
        type: 'error',
      });
    } finally {
      setSavingReviewByCandidate((current) => ({ ...current, [candidateId]: false }));
    }
  };

  const handleSaveInterview = async (candidateId) => {
    const interviewDraft = interviewDraftsByCandidate[candidateId] || {
      interviewDate: '',
      interviewTime: '',
      interviewMode: '',
      interviewLocation: '',
      interviewStatus: '',
    };
    const normalizedLocation = interviewDraft.interviewLocation.trim();

    if (
      !interviewDraft.interviewDate ||
      !interviewDraft.interviewTime ||
      !interviewDraft.interviewMode ||
      !interviewDraft.interviewStatus
    ) {
      const message = 'Date, time, mode, and status are required to schedule an interview.';
      setInterviewErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: message,
      }));
      showToast({
        title: 'Interview not saved',
        message,
        type: 'error',
      });
      return;
    }

    if (interviewDraft.interviewMode === 'Online' && !normalizedLocation) {
      const message = 'Please add a meeting link or location for the interview.';
      setInterviewErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: message,
      }));
      showToast({
        title: 'Interview not saved',
        message,
        type: 'error',
      });
      return;
    }

    setInterviewErrorsByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setInterviewMessagesByCandidate((current) => ({
      ...current,
      [candidateId]: '',
    }));
    setSavingInterviewByCandidate((current) => ({ ...current, [candidateId]: true }));

    try {
      const data = await scheduleCandidateInterview(candidateId, {
        interviewDate: interviewDraft.interviewDate,
        interviewTime: interviewDraft.interviewTime,
        interviewMode: interviewDraft.interviewMode,
        interviewLocation: normalizedLocation,
        interviewStatus: interviewDraft.interviewStatus,
      });

      setCandidates((current) =>
        current.map((candidate) => (candidate._id === candidateId ? data.candidate : candidate)),
      );
      setInterviewDraftsByCandidate((current) => ({
        ...current,
        [candidateId]: {
          interviewDate: data.candidate.interviewDate || '',
          interviewTime: data.candidate.interviewTime || '',
          interviewMode: data.candidate.interviewMode || '',
          interviewLocation: data.candidate.interviewLocation || '',
          interviewStatus: data.candidate.interviewStatus || '',
        },
      }));
      setInterviewMessagesByCandidate((current) => ({
        ...current,
        [candidateId]: 'Interview details saved successfully.',
      }));
      showToast({
        title: 'Interview scheduled',
        message: 'Interview details were updated for this candidate.',
        type: 'success',
      });
      addNotification({
        type: 'interview',
        message: `Interview scheduled for ${data.candidate.fullName || 'candidate'} on ${data.candidate.interviewDate || 'the selected date'}.`,
        reference: {
          candidateId,
          candidateName: data.candidate.fullName || '',
          jobId: data.candidate.appliedJob?._id || data.candidate.appliedJob || '',
        },
      });
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      setInterviewErrorsByCandidate((current) => ({
        ...current,
        [candidateId]: requestError.message,
      }));
      showToast({
        title: 'Unable to save interview',
        message: requestError.message,
        type: 'error',
      });
    } finally {
      setSavingInterviewByCandidate((current) => ({ ...current, [candidateId]: false }));
    }
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidateIds((current) => {
      if (current.includes(candidateId)) {
        return current.filter((id) => id !== candidateId);
      }

      if (current.length >= 3) {
        showToast({
          title: 'Compare limit reached',
          message: 'Select up to 3 candidates at a time for comparison.',
          type: 'error',
        });
        return current;
      }

      return [...current, candidateId];
    });
  };

  const compareSelectionMessage =
    selectedCandidateIds.length === 0
      ? 'Select 2 to 3 candidates to compare them side by side.'
      : selectedCandidateIds.length === 1
        ? 'Select 1 more candidate to enable comparison.'
        : selectedCandidateIds.length === 2
          ? 'Ready to compare 2 selected candidates.'
          : 'Ready to compare 3 selected candidates.';

  const availableCandidateTags = normalizeCandidateTags([
    ...SUGGESTED_CANDIDATE_TAGS,
    ...candidates.flatMap((candidate) => (Array.isArray(candidate.tags) ? candidate.tags : [])),
  ]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredCandidates = candidates.filter((candidate) => {
    const searchMatches =
      !normalizedSearchTerm ||
      [candidate.fullName, candidate.email, candidate.appliedJob?.title]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearchTerm));

    const scoreEntry = scoresByCandidate[candidate._id];
    const fitTagMatches =
      !selectedFitTag ||
      (scoreEntry && getRecommendation(scoreEntry.score).label === selectedFitTag);

    const recruiterStatusMatches =
      !selectedRecruiterStatus ||
      normalizeRecruiterStatus(candidate.recruiterStatus) === selectedRecruiterStatus;

    const candidateTagMatches =
      !selectedCandidateTag ||
      normalizeCandidateTags(candidate.tags).some(
        (tag) => tag.toLowerCase() === selectedCandidateTag.toLowerCase(),
      );

    return searchMatches && fitTagMatches && recruiterStatusMatches && candidateTagMatches;
  });

  const sortedCandidates = [...filteredCandidates].sort((firstCandidate, secondCandidate) => {
    const firstScore = scoresByCandidate[firstCandidate._id]?.score;
    const secondScore = scoresByCandidate[secondCandidate._id]?.score;
    const firstStatus = normalizeRecruiterStatus(firstCandidate.recruiterStatus);
    const secondStatus = normalizeRecruiterStatus(secondCandidate.recruiterStatus);
    const recruiterStatusOrder = {
      Shortlisted: 0,
      'Pending Review': 1,
      'On Hold': 2,
      Rejected: 3,
    };

    if (sortBy === 'score') {
      if (typeof firstScore === 'number' && typeof secondScore === 'number') {
        return secondScore - firstScore;
      }

      if (typeof firstScore === 'number') {
        return -1;
      }

      if (typeof secondScore === 'number') {
        return 1;
      }

      return new Date(secondCandidate.uploadedAt) - new Date(firstCandidate.uploadedAt);
    }

    if (sortBy === 'recruiterStatus') {
      const firstOrder = recruiterStatusOrder[firstStatus] ?? 99;
      const secondOrder = recruiterStatusOrder[secondStatus] ?? 99;

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }
    }

    return new Date(secondCandidate.uploadedAt) - new Date(firstCandidate.uploadedAt);
  });

  const handleDownloadReport = async (candidate) => {
    const scoreEntry = scoresByCandidate[candidate._id];

    if (!scoreEntry || generatingReportByCandidate[candidate._id]) {
      return;
    }

    const recommendation = getRecommendation(scoreEntry.score);
    const recruiterStatus = normalizeRecruiterStatus(candidate.recruiterStatus);
    setGeneratingReportByCandidate((current) => ({
      ...current,
      [candidate._id]: true,
    }));

    try {
      await downloadCandidateReportPdf({
        candidate,
        scoreEntry,
        recommendation,
        recruiterStatus,
      });
      setOpenActionMenuId('');
      showToast({
        title: 'Report downloaded',
        message: `${candidate.fullName || 'Candidate'} report is ready.`,
        type: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Report generation failed',
        message: error.message || 'Candidate PDF report could not be generated.',
        type: 'error',
      });
    } finally {
      setGeneratingReportByCandidate((current) => ({
        ...current,
        [candidate._id]: false,
      }));
    }
  };

  return (
    <AppShell
      title="Candidates"
      description="Review uploaded candidates, open resumes, and generate AI-based screening scores."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary btn-compact disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={selectedCandidateIds.length < 2 || selectedCandidateIds.length > 3}
            onClick={() =>
              navigate(`/candidates/compare?ids=${selectedCandidateIds.join(',')}`)
            }
          >
            Compare Candidates
          </button>
          <Link className="btn-primary btn-compact" to="/candidates/upload">
            Upload candidate
          </Link>
        </div>
      }
    >
      <div className="panel p-3.5 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Comparison Selection</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{compareSelectionMessage}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-muted">{selectedCandidateIds.length}/3 selected</span>
            {selectedCandidateIds.length ? (
              <button
                className="btn-secondary btn-compact"
                type="button"
                onClick={() => setSelectedCandidateIds([])}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,220px)_minmax(0,300px)_minmax(0,170px)_minmax(0,170px)_minmax(0,180px)_minmax(0,180px)_auto] xl:items-end">
          <label className="block w-full">
            <span className="field-label mb-1">Filter by job</span>
            <select
              className="input-field"
              value={selectedJob}
              onChange={handleJobChange}
              disabled={isLoadingJobs}
            >
              <option value="">All jobs</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-full">
            <span className="field-label mb-1">Search candidates</span>
            <input
              className="input-field"
              type="search"
              placeholder="Search by name, email, or job title"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </label>
          <label className="block w-full">
            <span className="field-label mb-1">Sort by</span>
            <select className="input-field" value={sortBy} onChange={handleSortChange}>
              <option value="latest">Latest upload</option>
              <option value="score">AI score</option>
              <option value="recruiterStatus">Recruiter decision</option>
            </select>
          </label>
          <label className="block w-full">
            <span className="field-label mb-1">Fit tag</span>
            <select className="input-field" value={selectedFitTag} onChange={handleFitTagChange}>
              <option value="">All fit tags</option>
              <option value="Strong Fit">Strong Fit</option>
              <option value="Moderate Fit">Moderate Fit</option>
              <option value="Low Fit">Low Fit</option>
            </select>
          </label>
            <label className="block w-full">
              <span className="field-label mb-1">Recruiter status</span>
              <select
                className="input-field"
                value={selectedRecruiterStatus}
              onChange={handleRecruiterStatusChange}
            >
              <option value="">All decisions</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="On Hold">On Hold</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>
            <label className="block w-full">
              <span className="field-label mb-1">Candidate tag</span>
              <select className="input-field" value={selectedCandidateTag} onChange={handleCandidateTagChange}>
                <option value="">All tags</option>
                {availableCandidateTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs font-medium text-slate-500 sm:text-sm xl:text-right">
            {normalizedSearchTerm || selectedFitTag || selectedRecruiterStatus || selectedCandidateTag
                ? `Showing ${filteredCandidates.length} of ${candidates.length} candidates`
                : selectedJob
                  ? 'Showing candidates for the selected job.'
                : 'Showing all uploaded candidates.'}
          </p>
        </div>
      </div>

      {error ? <p className="alert-error">{error}</p> : null}

      {isLoading ? (
        <div className="table-shell">
          <div className="max-h-[calc(100vh-18rem)] overflow-auto">
            <table className="w-full min-w-[980px] divide-y divide-slate-200 xl:min-w-full">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr>
                  {['', 'Candidate', 'Email', 'Applied Job', 'Uploaded', 'AI Score', 'Status', 'Resume', 'Actions'].map((label, index) => (
                    <th
                      key={`${label}-${index}`}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {candidateTableSkeletonRows.map((row) => (
                  <tr key={row}>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="skeleton h-4 w-4 rounded" />
                    </td>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="skeleton-line h-4 w-32" />
                    </td>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="skeleton-line h-4 w-44" />
                    </td>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="skeleton-line h-4 w-32" />
                    </td>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="skeleton-line h-4 w-24" />
                    </td>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="flex items-center gap-2">
                        <div className="skeleton-pill w-16" />
                        <div className="skeleton-pill w-20" />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="skeleton-pill w-24" />
                    </td>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="skeleton-button w-24" />
                    </td>
                    <td className="px-3 py-2.5 xl:px-4">
                      <div className="flex items-center gap-2">
                        <div className="skeleton-button w-28" />
                        <div className="skeleton-button w-16" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="empty-state">
          <p className="kicker">Candidate Pipeline</p>
          <h2 className="title-lg">
            {selectedJob ? 'No candidates for this role yet' : 'No candidates uploaded yet'}
          </h2>
          <p className="body-muted mt-2">
            {selectedJob
              ? 'This role does not have any candidates yet. Add a resume to start screening for this opening.'
              : 'Upload your first candidate to start building a shortlist and generating AI evaluations.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link className="btn-primary btn-compact" to="/candidates/upload">
              Upload candidate
            </Link>
            <Link className="btn-secondary btn-compact" to="/jobs">
              View jobs
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {selectedJob ? 'You can switch the job filter anytime to review another role.' : 'Candidates will appear here once resumes are uploaded.'}
          </p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="empty-state">
          <p className="kicker">Candidate Search</p>
          <h2 className="title-lg">No candidates match your search</h2>
          <p className="body-muted mt-2">
            Try a different candidate name, email, or job title to find the profile you need.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              className="btn-secondary btn-compact"
              type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFitTag('');
                  setSelectedRecruiterStatus('');
                  setSelectedCandidateTag('');
                  setSortBy('latest');
                }}
            >
              Reset filters
            </button>
            <Link className="btn-primary btn-compact" to="/candidates/upload">
              Upload candidate
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Existing job filters stay applied while you search.
          </p>
        </div>
      ) : (
        <div className="table-shell">
          <div className="max-h-[calc(100vh-18rem)] overflow-auto">
            <table className="w-full min-w-[980px] divide-y divide-slate-200 xl:min-w-full">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    Compare
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    Job Applied
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    Upload Date
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    AI Score
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    Recruiter Decision
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    Resume
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 xl:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedCandidates.map((candidate) => {
                  const scoreEntry = scoresByCandidate[candidate._id];
                  const isExpanded = expandedCandidateId === candidate._id;
                    const candidateTags = normalizeCandidateTags(candidate.tags);
                    const recommendation = scoreEntry ? getRecommendation(scoreEntry.score) : null;
                    const suggestedRecruiterAction = scoreEntry
                      ? getSuggestedRecruiterAction(scoreEntry.score)
                      : null;
                  const statusBadge = getRecruiterStatusBadge(candidate.recruiterStatus);
                  const reviewDraft = reviewDraftsByCandidate[candidate._id] || {
                    recruiterStatus: normalizeRecruiterStatus(candidate.recruiterStatus),
                    recruiterNotes: candidate.recruiterNotes || '',
                  };
                    const interviewDraft = interviewDraftsByCandidate[candidate._id] || {
                      interviewDate: candidate.interviewDate || '',
                      interviewTime: candidate.interviewTime || '',
                      interviewMode: candidate.interviewMode || '',
                      interviewLocation: candidate.interviewLocation || '',
                      interviewStatus: candidate.interviewStatus || '',
                    };
                    const tagDraft = tagDraftsByCandidate[candidate._id] || {
                      input: '',
                      tags: candidateTags,
                    };
                    const reviewError = reviewErrorsByCandidate[candidate._id];
                    const reviewMessage = reviewMessagesByCandidate[candidate._id];
                    const interviewError = interviewErrorsByCandidate[candidate._id];
                    const interviewMessage = interviewMessagesByCandidate[candidate._id];
                    const tagError = tagErrorsByCandidate[candidate._id];
                    const tagMessage = tagMessagesByCandidate[candidate._id];
                    const hasInterview = Boolean(
                      candidate.interviewDate &&
                      candidate.interviewTime &&
                      candidate.interviewMode &&
                      candidate.interviewStatus,
                  );

                  return (
                    <Fragment key={candidate._id}>
                      <tr key={candidate._id} className="transition hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 align-top text-sm xl:px-4">
                          <label className="inline-flex items-center">
                            <input
                              className="checkbox-field"
                              type="checkbox"
                              checked={selectedCandidateIds.includes(candidate._id)}
                              disabled={
                                !selectedCandidateIds.includes(candidate._id) &&
                                selectedCandidateIds.length >= 3
                              }
                              onChange={() => toggleCandidateSelection(candidate._id)}
                            />
                          </label>
                        </td>
                          <td className="min-w-[180px] px-3 py-2.5 align-top text-[13px] font-semibold leading-5 text-slate-900 xl:px-4">
                            <div className="space-y-1.5">
                              <p>{candidate.fullName}</p>
                              {candidateTags.length ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {candidateTags.slice(0, 2).map((tag) => (
                                    <span
                                      key={`${candidate._id}-row-tag-${tag}`}
                                      className="candidate-tag-chip candidate-tag-chip-row"
                                      title={tag}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {candidateTags.length > 2 ? (
                                    <span className="candidate-tag-chip candidate-tag-chip-muted">
                                      +{candidateTags.length - 2}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        <td className="min-w-[180px] px-3 py-2.5 align-top text-[13px] leading-5 text-slate-600 xl:px-4">{candidate.email}</td>
                        <td className="min-w-[140px] px-3 py-2.5 align-top text-[13px] leading-5 text-slate-600 xl:px-4">
                          {candidate.appliedJob?.title || 'Not available'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-top text-[13px] leading-5 text-slate-600 xl:px-4">
                          {new Date(candidate.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="min-w-[150px] px-3 py-2.5 align-top text-[13px] xl:px-4">
                          {scoreEntry ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                className={`badge-compact ${getScoreClassName(
                                  scoreEntry.score,
                                )}`}
                                type="button"
                                onClick={() => toggleExpandedRow(candidate._id)}
                              >
                                {scoreEntry.score}/100
                              </button>
                              <span
                                className={`badge-compact ${getRecommendation(
                                  scoreEntry.score,
                                ).className}`}
                              >
                                {getRecommendation(scoreEntry.score).label}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">Not Scored</span>
                          )}
                        </td>
                        <td className="min-w-[130px] px-3 py-2.5 align-top text-[13px] text-slate-600 xl:px-4">
                          <span
                            className={`badge-compact ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-top text-[13px] xl:px-4">
                          <a
                            className="btn-secondary btn-compact"
                            href={withApiBase(candidate.resumeUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Resume
                          </a>
                        </td>
                        <td className="min-w-[124px] px-3 py-2.5 align-top text-[13px] xl:px-4">
                          <div className="relative flex items-start gap-1.5">
                            <button
                              className="btn-primary btn-compact disabled:cursor-not-allowed disabled:opacity-70"
                              type="button"
                              onClick={() => handleGenerateScore(candidate)}
                              disabled={loadingScores[candidate._id]}
                            >
                              {loadingScores[candidate._id] ? 'Generating...' : 'Generate Score'}
                            </button>
                            <button
                              className="btn-secondary btn-compact px-2.5"
                              type="button"
                              onClick={() => toggleActionMenu(candidate._id)}
                              aria-expanded={openActionMenuId === candidate._id}
                              aria-label="Open candidate actions"
                            >
                              More
                            </button>
                            {openActionMenuId === candidate._id ? (
                              <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[168px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)]">
                                <button
                                  className="flex w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                  type="button"
                                  onClick={() => toggleExpandedRow(candidate._id)}
                                >
                                  {isExpanded ? 'Hide Details' : 'View Details'}
                                </button>
                                {scoreEntry ? (
                                  <button
                                    className="flex w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="button"
                                    onClick={() => handleDownloadReport(candidate)}
                                    disabled={generatingReportByCandidate[candidate._id]}
                                  >
                                    {generatingReportByCandidate[candidate._id] ? 'Generating PDF...' : 'Download Report'}
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {scoreErrors[candidate._id] ? (
                        <tr key={`${candidate._id}-error`} className="bg-rose-50/60">
                          <td className="px-3 py-2 text-sm text-rose-700 xl:px-4" colSpan={9}>
                            {scoreErrors[candidate._id]}
                          </td>
                        </tr>
                      ) : null}
                      {isExpanded ? (
                        <tr key={`${candidate._id}-details`} className="bg-slate-50/80">
                          <td className="px-3 py-3 xl:px-4" colSpan={9}>
                              <div className="grid gap-2.5 lg:grid-cols-[1fr_1fr_1.1fr]">
                                {scoreEntry ? (
                                  <>
                                    <div className="panel-muted lg:col-span-3">
                                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                                        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="badge-compact border-sky-200 bg-sky-50 text-[0.68rem] uppercase tracking-[0.2em] text-sky-700">
                                                AI Evaluation
                                              </span>
                                              <span className="badge-compact border-slate-200 bg-white text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">
                                                Explainability
                                              </span>
                                            </div>
                                            <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
                                              Why this candidate received this score
                                            </h3>
                                            <p className="mt-1.5 line-clamp-3 text-sm leading-5 text-slate-600">
                                              {getScoreReason(
                                                scoreEntry.score,
                                                scoreEntry.matchedSkills,
                                                scoreEntry.missingSkills,
                                              )}
                                            </p>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className={`badge-compact px-2.5 py-1 text-xs ${recommendation.className}`}>
                                              {recommendation.label}
                                            </span>
                                            <span className="badge-compact border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                                              {scoreEntry.score}/100
                                            </span>
                                            <button
                                              className="btn-secondary btn-compact disabled:cursor-not-allowed disabled:opacity-70"
                                              type="button"
                                              onClick={() => handleDownloadReport(candidate)}
                                              disabled={generatingReportByCandidate[candidate._id]}
                                            >
                                              {generatingReportByCandidate[candidate._id] ? 'Generating PDF...' : 'Download Report'}
                                            </button>
                                          </div>
                                        </div>

                                        <div className="mt-3 grid gap-2.5 lg:grid-cols-[1.1fr_0.9fr]">
                                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                              Resume Strength / Weakness Summary
                                            </p>
                                            <p className="mt-1.5 line-clamp-4 text-sm leading-5 text-slate-600">
                                              {getStrengthWeaknessSummary(
                                                scoreEntry.score,
                                                scoreEntry.matchedSkills,
                                                scoreEntry.missingSkills,
                                                scoreEntry.summary,
                                              )}
                                            </p>
                                          </div>
                                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                              Suggested Recruiter Action
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                              <span
                                                className={`badge-compact px-2.5 py-1 text-xs ${suggestedRecruiterAction.className}`}
                                              >
                                                {suggestedRecruiterAction.label}
                                              </span>
                                            </div>
                                            <p className="mt-1.5 text-sm leading-5 text-slate-600">
                                              {suggestedRecruiterAction.description}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="panel-muted border-emerald-200 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                        Matched Skills
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {scoreEntry.matchedSkills?.length ? (
                                          scoreEntry.matchedSkills.map((skill) => (
                                            <span
                                              key={`${candidate._id}-matched-${skill}`}
                                              className="skill-pill border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700"
                                            >
                                              {skill}
                                            </span>
                                          ))
                                        ) : (
                                          <p className="text-sm text-slate-500">No matched skills returned.</p>
                                        )}
                                      </div>
                                      <p className="mt-2.5 text-sm leading-5 text-slate-600">
                                        {getMatchedSkillsExplanation(scoreEntry.matchedSkills)}
                                      </p>
                                    </div>

                                    <div className="panel-muted border-rose-200 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
                                        Missing Skills
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {scoreEntry.missingSkills?.length ? (
                                          scoreEntry.missingSkills.map((skill) => (
                                            <span
                                              key={`${candidate._id}-missing-${skill}`}
                                              className="skill-pill border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700"
                                            >
                                              {skill}
                                            </span>
                                          ))
                                        ) : (
                                          <p className="text-sm text-slate-500">No missing skills returned.</p>
                                        )}
                                      </div>
                                      <p className="mt-2.5 text-sm leading-5 text-slate-600">
                                        {getMissingSkillsExplanation(scoreEntry.missingSkills)}
                                      </p>
                                    </div>

                                    <div className="panel-muted p-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                                        AI Summary
                                      </p>
                                      <p className="mt-2 text-sm leading-5 text-slate-600">
                                        {scoreEntry.summary ||
                                          'AI evaluation is available, but a detailed explanation summary was not returned for this score.'}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="panel-muted lg:col-span-3">
                                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        AI Evaluation
                                      </p>
                                        <h3 className="mt-1.5 text-base font-semibold text-slate-900">
                                          No AI score generated yet
                                        </h3>
                                        <p className="mt-1.5 text-sm leading-5 text-slate-600">
                                          Generate a score to view the hiring recommendation, score explanation, matched skills, missing skills, and recruiter guidance for this candidate.
                                        </p>
                                      </div>
                                    <button
                                      className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
                                      type="button"
                                      onClick={() => handleGenerateScore(candidate)}
                                      disabled={loadingScores[candidate._id]}
                                    >
                                      {loadingScores[candidate._id] ? 'Generating...' : 'Generate Score'}
                                    </button>
                                    </div>
                                  </div>
                                )}

                                <div className="panel-muted p-3.5 lg:col-span-3">
                                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                          Candidate Tags
                                        </p>
                                        <h3 className="mt-1.5 text-base font-semibold text-slate-900">
                                          Organize this profile with recruiter tags
                                        </h3>
                                      </div>
                                      <span className="badge-compact border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                                        {tagDraft.tags.length} tag{tagDraft.tags.length === 1 ? '' : 's'}
                                      </span>
                                    </div>

                                    {tagDraft.tags.length ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {tagDraft.tags.map((tag) => (
                                          <button
                                            key={`${candidate._id}-tag-${tag}`}
                                            className="candidate-tag-chip candidate-tag-chip-interactive"
                                            type="button"
                                            onClick={() => handleRemoveCandidateTag(candidate._id, tag)}
                                            disabled={savingTagsByCandidate[candidate._id]}
                                            title={tag}
                                          >
                                            <span className="truncate">{tag}</span>
                                            <span className="candidate-tag-remove">x</span>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-500">
                                        No tags added yet.
                                      </p>
                                    )}

                                    <div className="flex flex-wrap gap-1.5">
                                      {SUGGESTED_CANDIDATE_TAGS.map((tag) => (
                                        <button
                                          key={`${candidate._id}-suggested-${tag}`}
                                          className="candidate-tag-chip candidate-tag-chip-suggested"
                                          type="button"
                                          onClick={() => handleAddCandidateTag(candidate._id, tag)}
                                          disabled={savingTagsByCandidate[candidate._id]}
                                          title={tag}
                                        >
                                          {tag}
                                        </button>
                                      ))}
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                      <input
                                        className="input-field min-w-0"
                                        type="text"
                                        placeholder="Add a custom tag"
                                        value={tagDraft.input}
                                        onChange={(event) => updateTagInput(candidate._id, event.target.value)}
                                        onKeyDown={(event) => handleTagInputKeyDown(event, candidate._id)}
                                        disabled={savingTagsByCandidate[candidate._id]}
                                      />
                                      <button
                                        className="btn-secondary btn-compact"
                                        type="button"
                                        onClick={() => handleAddCandidateTag(candidate._id, tagDraft.input)}
                                        disabled={savingTagsByCandidate[candidate._id]}
                                      >
                                        {savingTagsByCandidate[candidate._id] ? 'Saving...' : 'Add Tag'}
                                      </button>
                                    </div>

                                    {tagError ? <p className="alert-error">{tagError}</p> : null}
                                    {tagMessage ? <p className="alert-success">{tagMessage}</p> : null}
                                    <p className="text-xs text-slate-500">
                                      Changes save automatically and remain available after refresh.
                                    </p>
                                  </div>
                                </div>

                                <div className="panel-muted p-3.5 lg:col-span-3">
                                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                                  <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                      Recruiter Status
                                    </label>
                                    <select
                                      className="input-field"
                                      value={reviewDraft.recruiterStatus}
                                      onChange={(event) =>
                                        updateReviewDraft(candidate._id, 'recruiterStatus', event.target.value)
                                      }
                                    >
                                      <option value="Pending Review">Pending Review</option>
                                      <option value="Shortlisted">Shortlisted</option>
                                      <option value="On Hold">On Hold</option>
                                      <option value="Rejected">Rejected</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                      Recruiter Notes
                                    </label>
                                    <textarea
                                      className="input-field min-h-28 resize-y"
                                      placeholder="Add recruiter notes about this candidate."
                                      value={reviewDraft.recruiterNotes}
                                      onChange={(event) =>
                                        updateReviewDraft(candidate._id, 'recruiterNotes', event.target.value)
                                      }
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                      {reviewDraft.recruiterNotes.trim().length}/1000 characters
                                    </p>
                                  </div>
                                  {reviewError ? <p className="alert-error">{reviewError}</p> : null}
                                  {reviewMessage ? <p className="alert-success">{reviewMessage}</p> : null}
                                  <div className="flex justify-end">
                                    <button
                                      className="btn-secondary btn-compact disabled:cursor-not-allowed disabled:opacity-70"
                                      type="button"
                                      onClick={() => handleSaveReview(candidate._id)}
                                      disabled={savingReviewByCandidate[candidate._id]}
                                    >
                                      {savingReviewByCandidate[candidate._id] ? 'Saving...' : 'Save Review'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="panel-muted p-3.5 lg:col-span-3">
                                <div className="space-y-6 rounded-[20px] border border-slate-200 bg-white px-6 py-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:px-7 sm:py-7">
                                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Interview Scheduling
                                      </p>
                                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                        Schedule Interview
                                      </h3>
                                      <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Add the next interview step for this candidate and keep the pipeline updated.
                                      </p>
                                    </div>
                                    {hasInterview ? (
                                      <span className={`badge-compact ${getInterviewStatusBadge(candidate.interviewStatus)}`}>
                                        {candidate.interviewStatus}
                                      </span>
                                    ) : (
                                      <span className="badge-compact border-slate-200 bg-slate-50 text-slate-600">
                                        Not Scheduled
                                      </span>
                                    )}
                                  </div>

                                  {hasInterview ? (
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">{candidate.interviewDate}</p>
                                      </div>
                                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Time</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">{candidate.interviewTime}</p>
                                      </div>
                                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mode</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">{candidate.interviewMode}</p>
                                      </div>
                                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Location / Link</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">{candidate.interviewLocation || 'Not provided'}</p>
                                      </div>
                                    </div>
                                  ) : null}

                                  <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
                                    <div className="space-y-2.5">
                                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Interview Date
                                      </label>
                                      <input
                                        className="input-field min-h-[48px]"
                                        type="date"
                                        value={interviewDraft.interviewDate}
                                        onChange={(event) =>
                                          updateInterviewDraft(candidate._id, 'interviewDate', event.target.value)
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2.5">
                                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Interview Time
                                      </label>
                                      <input
                                        className="input-field min-h-[48px]"
                                        type="time"
                                        value={interviewDraft.interviewTime}
                                        onChange={(event) =>
                                          updateInterviewDraft(candidate._id, 'interviewTime', event.target.value)
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2.5">
                                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Interview Mode
                                      </label>
                                      <select
                                        className="input-field min-h-[48px]"
                                        value={interviewDraft.interviewMode}
                                        onChange={(event) =>
                                          updateInterviewDraft(candidate._id, 'interviewMode', event.target.value)
                                        }
                                      >
                                        <option value="">Select mode</option>
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                      </select>
                                    </div>
                                    <div className="space-y-2.5">
                                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Interview Status
                                      </label>
                                      <select
                                        className="input-field min-h-[48px]"
                                        value={interviewDraft.interviewStatus}
                                        onChange={(event) =>
                                          updateInterviewDraft(candidate._id, 'interviewStatus', event.target.value)
                                        }
                                      >
                                        <option value="">Select status</option>
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Rescheduled">Rescheduled</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="space-y-2.5">
                                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                      Location / Meeting Link
                                    </label>
                                    <input
                                      className="input-field min-h-[48px]"
                                      type="text"
                                      placeholder="Office address or video meeting link"
                                      value={interviewDraft.interviewLocation}
                                      onChange={(event) =>
                                        updateInterviewDraft(candidate._id, 'interviewLocation', event.target.value)
                                      }
                                    />
                                  </div>

                                  {interviewError ? <p className="alert-error">{interviewError}</p> : null}
                                  {interviewMessage ? <p className="alert-success">{interviewMessage}</p> : null}

                                  <div className="flex justify-end pt-1">
                                    <button
                                      className="btn-primary btn-compact disabled:cursor-not-allowed disabled:opacity-70"
                                      type="button"
                                      onClick={() => handleSaveInterview(candidate._id)}
                                      disabled={savingInterviewByCandidate[candidate._id]}
                                    >
                                      {savingInterviewByCandidate[candidate._id] ? 'Saving...' : 'Schedule Interview'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </AppShell>
  );
}

export default CandidatesList;
