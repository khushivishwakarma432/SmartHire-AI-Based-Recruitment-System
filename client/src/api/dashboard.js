import { getStoredToken } from '../utils/auth';

import { getApiBaseUrl } from './baseUrl';

const API_BASE_URL = getApiBaseUrl();
const buildApiError = (response, data) => {
  const error = new Error(data.message || 'Something went wrong.');
  error.statusCode = response.status;
  return error;
};

export const getDashboardSummary = async () => {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw buildApiError(response, data);
  }

  return data;
};
