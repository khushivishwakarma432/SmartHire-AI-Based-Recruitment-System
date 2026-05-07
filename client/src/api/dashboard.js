import {
  fetchCachedResource,
  getCachedResource,
  invalidateCachedResource,
} from './cache';
import { REQUEST_TIMEOUT_MS, apiRequest } from './request';

const DASHBOARD_SUMMARY_CACHE_KEY = 'dashboard:summary';
export const DASHBOARD_SUMMARY_CACHE_TTL_MS = 60 * 1000;

const requestDashboardSummary = () =>
  apiRequest('/api/dashboard/summary', {
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

export const getCachedDashboardSummary = (options = {}) =>
  getCachedResource(DASHBOARD_SUMMARY_CACHE_KEY, {
    storage: 'session',
    maxAgeMs: DASHBOARD_SUMMARY_CACHE_TTL_MS,
    ...options,
  });

export const getDashboardSummary = async (options = {}) => {
  const { preferCache = false, allowStale = preferCache, forceRefresh = false } = options;
  const cachedSummary = !forceRefresh
    ? getCachedDashboardSummary({
        allowStale,
      })
    : null;

  if (preferCache && cachedSummary?.data) {
    return cachedSummary.data;
  }

  return fetchCachedResource(DASHBOARD_SUMMARY_CACHE_KEY, requestDashboardSummary, {
    storage: 'session',
  });
};

export const prefetchDashboardSummary = () =>
  fetchCachedResource(DASHBOARD_SUMMARY_CACHE_KEY, requestDashboardSummary, {
    storage: 'session',
  }).catch(() => null);

export const invalidateDashboardSummaryCache = () => {
  invalidateCachedResource(DASHBOARD_SUMMARY_CACHE_KEY, { storage: 'session' });
};
