import { getStoredToken } from '../utils/auth';

import { getApiBaseUrl } from './baseUrl';

const API_BASE_URL = getApiBaseUrl();
const buildApiError = (response, data) => {
  const error = new Error(data.message || 'Something went wrong.');
  error.statusCode = response.status;
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

export const getJobs = () => request('/api/jobs');

export const getJobById = (jobId) => request(`/api/jobs/${jobId}`);

export const createJob = (payload) =>
  request('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateJob = (jobId, payload) =>
  request(`/api/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteJob = (jobId) =>
  request(`/api/jobs/${jobId}`, {
    method: 'DELETE',
  });
