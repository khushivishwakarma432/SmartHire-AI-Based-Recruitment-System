import { getStoredToken } from '../utils/auth';

import { getApiBaseUrl } from './baseUrl';
import {
  fetchCachedResource,
  getCachedResource,
  invalidateCachedResourcePrefix,
} from './cache';
import { invalidateDashboardSummaryCache } from './dashboard';
import { buildApiError, REQUEST_TIMEOUT_MS, apiRequest } from './request';

const API_BASE_URL = getApiBaseUrl();
const CANDIDATES_CACHE_PREFIX = 'candidates:';
export const CANDIDATES_CACHE_TTL_MS = 60 * 1000;

const parseJsonSafely = (value) => {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const getCandidatesCacheKey = (jobId = '') =>
  `${CANDIDATES_CACHE_PREFIX}${jobId ? `job:${jobId}` : 'all'}`;

const requestCandidates = (jobId = '') =>
  apiRequest(jobId ? `/api/candidates/job/${jobId}` : '/api/candidates', {
    timeoutMs: null,
  });

export const getCachedCandidates = (jobId = '', options = {}) =>
  getCachedResource(getCandidatesCacheKey(jobId), {
    storage: 'session',
    maxAgeMs: CANDIDATES_CACHE_TTL_MS,
    ...options,
  });

export const invalidateCandidatesCache = () => {
  invalidateCachedResourcePrefix(CANDIDATES_CACHE_PREFIX, { storage: 'session' });
};

export const uploadCandidate = (formData, options = {}) => {
  const { onProgress } = options;
  const token = getStoredToken();

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open('POST', `${API_BASE_URL}/api/candidates/upload`);
    request.responseType = 'text';

    if (token) {
      request.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (typeof onProgress === 'function') {
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }

    request.onload = () => {
      const data = parseJsonSafely(request.responseText);
      const response = {
        ok: request.status >= 200 && request.status < 300,
        status: request.status,
      };

      if (!response.ok) {
        reject(buildApiError(response, data));
        return;
      }

      invalidateCandidatesCache();
      invalidateDashboardSummaryCache();
      resolve(data);
    };

    request.onerror = () => {
      reject(new Error('Network request failed.'));
    };

    request.onabort = () => {
      reject(new Error('Upload was cancelled.'));
    };

    request.send(formData);
  });
};

export const getCandidates = async (options = {}) => {
  const { preferCache = false, allowStale = preferCache, forceRefresh = false } = options;
  const cachedCandidates = !forceRefresh
    ? getCachedCandidates('', {
        allowStale,
      })
    : null;

  if (preferCache && cachedCandidates?.data) {
    return cachedCandidates.data;
  }

  return fetchCachedResource(getCandidatesCacheKey(''), () => requestCandidates(''), {
    storage: 'session',
  });
};

export const getCandidatesByJob = async (jobId, options = {}) => {
  const { preferCache = false, allowStale = preferCache, forceRefresh = false } = options;
  const normalizedJobId = String(jobId || '').trim();
  const cachedCandidates = normalizedJobId && !forceRefresh
    ? getCachedCandidates(normalizedJobId, {
        allowStale,
      })
    : null;

  if (preferCache && cachedCandidates?.data) {
    return cachedCandidates.data;
  }

  return fetchCachedResource(
    getCandidatesCacheKey(normalizedJobId),
    () => requestCandidates(normalizedJobId),
    {
      storage: 'session',
    },
  );
};

export const prefetchCandidates = (jobId = '') =>
  fetchCachedResource(getCandidatesCacheKey(jobId), () => requestCandidates(jobId), {
    storage: 'session',
  }).catch(() => null);

export const reviewCandidate = async (candidateId, payload) => {
  const response = await apiRequest(`/api/candidates/review/${candidateId}`, {
    method: 'PUT',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  invalidateCandidatesCache();
  invalidateDashboardSummaryCache();
  return response;
};

export const updateCandidateTags = async (candidateId, payload) => {
  const response = await apiRequest(`/api/candidates/tags/${candidateId}`, {
    method: 'PUT',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  invalidateCandidatesCache();
  return response;
};

export const scheduleCandidateInterview = async (candidateId, payload) => {
  const response = await apiRequest(`/api/candidates/interview/${candidateId}`, {
    method: 'PUT',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
  invalidateCandidatesCache();
  invalidateDashboardSummaryCache();
  return response;
};
