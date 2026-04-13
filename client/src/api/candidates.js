import { getStoredToken } from '../utils/auth';

import { getApiBaseUrl } from './baseUrl';

const API_BASE_URL = getApiBaseUrl();
const buildApiError = (response, data) => {
  const error = new Error(data.message || 'Something went wrong.');
  error.statusCode = response.status;
  error.details = data.details || '';
  return error;
};

const request = async (endpoint) => {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw buildApiError(response, data);
  }

  return data;
};

const requestWithBody = async (endpoint, method, body) => {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw buildApiError(response, data);
  }

  return data;
};

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

export const getCandidates = () => request('/api/candidates');

export const getCandidatesByJob = (jobId) => request(`/api/candidates/job/${jobId}`);

export const reviewCandidate = (candidateId, payload) =>
  requestWithBody(`/api/candidates/review/${candidateId}`, 'PUT', payload);

export const updateCandidateTags = (candidateId, payload) =>
  requestWithBody(`/api/candidates/tags/${candidateId}`, 'PUT', payload);

export const scheduleCandidateInterview = (candidateId, payload) =>
  requestWithBody(`/api/candidates/interview/${candidateId}`, 'PUT', payload);
