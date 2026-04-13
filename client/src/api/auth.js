import { getApiBaseUrl } from './baseUrl';

const API_BASE_URL = getApiBaseUrl();

const buildApiError = (response, data) => {
  const error = new Error(data.message || 'Something went wrong.');
  error.statusCode = response.status;
  return error;
};

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
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

export const registerUser = (payload) =>
  request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const loginUser = (payload) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCurrentUser = async (token) => {
  const data = await request('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.user || data;
};
