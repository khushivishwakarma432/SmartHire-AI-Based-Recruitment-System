import { getStoredToken } from '../utils/auth';

import { getApiBaseUrl } from './baseUrl';
import { buildApiError, REQUEST_TIMEOUT_MS, apiRequest } from './request';

const API_BASE_URL = getApiBaseUrl();

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

export const getCandidates = () => apiRequest('/api/candidates', { timeoutMs: null });

export const getCandidatesByJob = (jobId) => apiRequest(`/api/candidates/job/${jobId}`, { timeoutMs: null });

export const reviewCandidate = (candidateId, payload) =>
  apiRequest(`/api/candidates/review/${candidateId}`, {
    method: 'PUT',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

export const updateCandidateTags = (candidateId, payload) =>
  apiRequest(`/api/candidates/tags/${candidateId}`, {
    method: 'PUT',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

export const scheduleCandidateInterview = (candidateId, payload) =>
  apiRequest(`/api/candidates/interview/${candidateId}`, {
    method: 'PUT',
    body: payload,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
