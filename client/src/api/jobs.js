import {
  fetchCachedResource,
  getCachedResource,
  invalidateCachedResource,
} from './cache';
import { invalidateDashboardSummaryCache } from './dashboard';
import { apiRequest, REQUEST_TIMEOUT_MS } from './request';

const JOBS_CACHE_KEY = 'jobs:list';
export const JOBS_CACHE_TTL_MS = 3 * 60 * 1000;

const requestJobs = () => apiRequest('/api/jobs', { timeoutMs: REQUEST_TIMEOUT_MS });

export const getCachedJobs = (options = {}) =>
  getCachedResource(JOBS_CACHE_KEY, {
    storage: 'session',
    maxAgeMs: JOBS_CACHE_TTL_MS,
    ...options,
  });

export const getJobs = async (options = {}) => {
  const { preferCache = false, allowStale = preferCache, forceRefresh = false } = options;
  const cachedJobs = !forceRefresh
    ? getCachedJobs({
        allowStale,
      })
    : null;

  if (preferCache && cachedJobs?.data) {
    return cachedJobs.data;
  }

  return fetchCachedResource(JOBS_CACHE_KEY, requestJobs, { storage: 'session' });
};

export const prefetchJobs = () =>
  fetchCachedResource(JOBS_CACHE_KEY, requestJobs, { storage: 'session' }).catch(() => null);

export const invalidateJobsCache = () => {
  invalidateCachedResource(JOBS_CACHE_KEY, { storage: 'session' });
};

export const getJobById = (jobId) => apiRequest(`/api/jobs/${jobId}`, { timeoutMs: REQUEST_TIMEOUT_MS });

export const createJob = async (payload) => {
  const response = await apiRequest('/api/jobs', {
    method: 'POST',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  invalidateJobsCache();
  invalidateDashboardSummaryCache();
  return response;
};

export const updateJob = async (jobId, payload) => {
  const response = await apiRequest(`/api/jobs/${jobId}`, {
    method: 'PUT',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  invalidateJobsCache();
  invalidateDashboardSummaryCache();
  return response;
};

export const deleteJob = async (jobId) => {
  const response = await apiRequest(`/api/jobs/${jobId}`, {
    method: 'DELETE',
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  invalidateJobsCache();
  invalidateDashboardSummaryCache();
  return response;
};
