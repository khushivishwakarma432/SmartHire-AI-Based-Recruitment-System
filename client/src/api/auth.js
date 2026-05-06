import { markSessionVerified } from '../utils/auth';

import { apiRequest, AUTH_REQUEST_TIMEOUT_MS } from './request';

export const registerUser = (payload) =>
  apiRequest('/api/auth/register', {
    method: 'POST',
    body: payload,
    includeAuth: false,
    timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
  });

export const loginUser = (payload) =>
  apiRequest('/api/auth/login', {
    method: 'POST',
    body: payload,
    includeAuth: false,
    timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
  });

export const getCurrentUser = async (token) => {
  const data = await apiRequest('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
  });

  const user = data.user || data;
  markSessionVerified(user);
  return user;
};
