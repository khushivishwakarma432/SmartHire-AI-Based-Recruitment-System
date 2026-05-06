import { apiRequest, REQUEST_TIMEOUT_MS } from './request';

export const getJobs = () => apiRequest('/api/jobs', { timeoutMs: REQUEST_TIMEOUT_MS });

export const getJobById = (jobId) => apiRequest(`/api/jobs/${jobId}`, { timeoutMs: REQUEST_TIMEOUT_MS });

export const createJob = (payload) =>
  apiRequest('/api/jobs', {
    method: 'POST',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

export const updateJob = (jobId, payload) =>
  apiRequest(`/api/jobs/${jobId}`, {
    method: 'PUT',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

export const deleteJob = (jobId) =>
  apiRequest(`/api/jobs/${jobId}`, {
    method: 'DELETE',
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
