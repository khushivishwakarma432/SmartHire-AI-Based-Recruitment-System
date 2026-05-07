import { REQUEST_TIMEOUT_MS, apiRequest } from './request';
import { invalidateDashboardSummaryCache } from './dashboard';

export const generateScore = async (candidateId, jobId) => {
  const response = await apiRequest(`/api/scores/generate/${candidateId}/${jobId}`, {
    method: 'POST',
    timeoutMs: null,
  });
  invalidateDashboardSummaryCache();
  return response;
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
