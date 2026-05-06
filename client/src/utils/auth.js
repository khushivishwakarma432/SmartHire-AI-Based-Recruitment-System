const TOKEN_KEY = 'smarthire_token';
const AUTH_USER_KEY = 'smarthire_auth_user';
const AUTH_VERIFIED_AT_KEY = 'smarthire_auth_verified_at';
const AUTH_CACHE_TTL_MS = 90 * 1000;

const getStorage = () => {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

export const getStoredToken = () => getStorage()?.getItem(TOKEN_KEY) || '';

export const storeToken = (token) => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(TOKEN_KEY, token);
};

export const markSessionVerified = (user = null) => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(AUTH_VERIFIED_AT_KEY, String(Date.now()));

  if (user) {
    storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
};

export const hasRecentSessionVerification = (maxAgeMs = AUTH_CACHE_TTL_MS) => {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  const timestamp = Number(storage.getItem(AUTH_VERIFIED_AT_KEY) || 0);

  if (!Number.isFinite(timestamp) || !timestamp) {
    return false;
  }

  return Date.now() - timestamp <= maxAgeMs;
};

export const getCachedAuthenticatedUser = () => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    return JSON.parse(storage.getItem(AUTH_USER_KEY) || 'null');
  } catch (error) {
    return null;
  }
};

export const clearSessionVerification = () => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_VERIFIED_AT_KEY);
  storage.removeItem(AUTH_USER_KEY);
};

export const removeToken = () => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(TOKEN_KEY);
  clearSessionVerification();
};

export const isUnauthorizedError = (error) => error?.statusCode === 401;
