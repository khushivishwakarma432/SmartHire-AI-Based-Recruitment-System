import { prefetchCurrentUser } from '../api/auth';
import { prefetchCandidates } from '../api/candidates';
import { prefetchDashboardSummary } from '../api/dashboard';
import { prefetchJobs } from '../api/jobs';

const warmPrefetch = (task) => {
  Promise.resolve()
    .then(task)
    .catch(() => null);
};

export const prefetchCurrentExperience = (pathname = '') => {
  if (pathname === '/dashboard') {
    warmPrefetch(() => prefetchDashboardSummary());
    warmPrefetch(() => prefetchCandidates());
    return;
  }

  if (pathname === '/jobs') {
    warmPrefetch(() => prefetchJobs());
    return;
  }

  if (pathname === '/candidates') {
    warmPrefetch(() => prefetchCandidates());
    warmPrefetch(() => prefetchJobs());
    return;
  }

  if (pathname === '/candidates/upload') {
    warmPrefetch(() => prefetchJobs());
    return;
  }

  if (pathname === '/interviews') {
    warmPrefetch(() => prefetchJobs());
    warmPrefetch(() => prefetchCandidates());
  }
};

export const prefetchProtectedExperience = () => {
  warmPrefetch(() => prefetchCurrentUser());
  warmPrefetch(() => prefetchDashboardSummary());
  warmPrefetch(() => prefetchJobs());
  warmPrefetch(() => prefetchCandidates());
};
