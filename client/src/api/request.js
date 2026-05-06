import { getStoredToken } from '../utils/auth';

import { getApiBaseUrl } from './baseUrl';

const API_BASE_URL = getApiBaseUrl();

export const REQUEST_TIMEOUT_MS = 8000;
export const AUTH_REQUEST_TIMEOUT_MS = 5000;

export const buildApiError = (response, data) => {
  const error = new Error(data.message || 'Something went wrong.');
  error.statusCode = response.status;
  error.details = data.details || '';
  return error;
};

const buildTimeoutError = (timeoutMs) => {
  const error = new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
  error.statusCode = 408;
  error.isTimeout = true;
  return error;
};

export const apiRequest = async (endpoint, options = {}) => {
  const {
    body,
    headers = {},
    includeAuth = true,
    timeoutMs = REQUEST_TIMEOUT_MS,
    ...fetchOptions
  } = options;

  const token = includeAuth ? getStoredToken() : '';
  const shouldUseTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0;
  const controller = shouldUseTimeout ? new AbortController() : null;
  const timeoutId = shouldUseTimeout ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const shouldUseJsonBody =
      body !== undefined &&
      !(body instanceof FormData) &&
      !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...(shouldUseJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: shouldUseJsonBody ? JSON.stringify(body) : body,
      signal: controller?.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw buildApiError(response, data);
    }

    return data;
  } catch (error) {
    if (shouldUseTimeout && error.name === 'AbortError') {
      throw buildTimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
