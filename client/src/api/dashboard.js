import { REQUEST_TIMEOUT_MS, apiRequest } from './request';

export const getDashboardSummary = async () => {
  return apiRequest('/api/dashboard/summary', {
    timeoutMs: REQUEST_TIMEOUT_MS,
  });
};
