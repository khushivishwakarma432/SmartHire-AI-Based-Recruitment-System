import { REQUEST_TIMEOUT_MS, apiRequest } from './request';

export const generateScore = async (candidateId, jobId) => {
  return apiRequest(`/api/scores/generate/${candidateId}/${jobId}`, {
    method: 'POST',
    timeoutMs: null,
  });
};

export const getLatestScores = async (params = {}) => {
  const searchParams = new URLSearchParams();

  if (Array.isArray(params.candidateIds) && params.candidateIds.length) {
    searchParams.set('candidateIds', params.candidateIds.join(','));
  }

  if (params.jobId) {
    searchParams.set('jobId', params.jobId);
  }

  const queryString = searchParams.toString();

  return apiRequest(`/api/scores/latest${queryString ? `?${queryString}` : ''}`, {
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
};
