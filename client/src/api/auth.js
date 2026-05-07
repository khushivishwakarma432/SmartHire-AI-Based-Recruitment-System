import {
  getCachedAuthenticatedUser,
  getStoredToken,
  hasRecentSessionVerification,
  markSessionVerified,
} from '../utils/auth';

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

export const getCurrentUser = async (token, options = {}) => {
  const { preferCache = false } = options;
  const cachedUser = getCachedAuthenticatedUser();

  if (preferCache && cachedUser && hasRecentSessionVerification()) {
    return cachedUser;
  }

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

export const prefetchCurrentUser = () => {
  const token = getStoredToken();

  if (!token) {
    return Promise.resolve(null);
  }

  return getCurrentUser(token, { preferCache: true }).catch(() => null);
};
