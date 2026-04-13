import { getStoredToken } from '../utils/auth';

import { getApiBaseUrl } from './baseUrl';

const API_BASE_URL = getApiBaseUrl();
const buildApiError = (response, data) => {
  const error = new Error(data.message || 'Something went wrong.');
  error.statusCode = response.status;
  error.details = data.details || '';
  return error;
};

const request = async (endpoint, options = {}) => {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw buildApiError(response, data);
  }

  return data;
};

export const generateScore = async (candidateId, jobId) => {
  return request(`/api/scores/generate/${candidateId}/${jobId}`, {
    method: 'POST',
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

  return request(`/api/scores/latest${queryString ? `?${queryString}` : ''}`);
};
