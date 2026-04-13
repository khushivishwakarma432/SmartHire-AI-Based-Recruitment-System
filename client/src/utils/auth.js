const TOKEN_KEY = 'smarthire_token';

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

export const removeToken = () => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(TOKEN_KEY);
};

export const isUnauthorizedError = (error) => error?.statusCode === 401;
