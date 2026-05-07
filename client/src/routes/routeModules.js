import { lazy } from 'react';

import { prefetchCurrentExperience } from '../utils/prefetch';

const lazyWithPreload = (factory) => {
  const Component = lazy(factory);
  Component.preload = factory;
  return Component;
};

export const CompareCandidates = lazyWithPreload(() => import('../pages/CompareCandidates'));
export const CandidatesList = lazyWithPreload(() => import('../pages/CandidatesList'));
export const CreateJob = lazyWithPreload(() => import('../pages/CreateJob'));
export const Dashboard = lazyWithPreload(() => import('../pages/Dashboard'));
export const EditJob = lazyWithPreload(() => import('../pages/EditJob'));
export const InterviewCalendar = lazyWithPreload(() => import('../pages/InterviewCalendar'));
export const JobDetails = lazyWithPreload(() => import('../pages/JobDetails'));
export const JobsList = lazyWithPreload(() => import('../pages/JobsList'));
export const Landing = lazyWithPreload(() => import('../pages/Landing'));
export const Login = lazyWithPreload(() => import('../pages/Login'));
export const NotFound = lazyWithPreload(() => import('../pages/NotFound'));
export const Pipeline = lazyWithPreload(() => import('../pages/Pipeline'));
export const Settings = lazyWithPreload(() => import('../pages/Settings'));
export const Signup = lazyWithPreload(() => import('../pages/Signup'));
export const UploadCandidate = lazyWithPreload(() => import('../pages/UploadCandidate'));

const routeDefinitions = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'See jobs, candidates, scores, recruiter decisions, and interviews in one view.',
    preload: Dashboard.preload,
    match: (pathname) => pathname === '/dashboard',
  },
  {
    id: 'jobs',
    title: 'Jobs',
    description: 'Manage the roles created by your HR account.',
    preload: JobsList.preload,
    match: (pathname) => pathname === '/jobs',
  },
  {
    id: 'jobs-create',
    title: 'Create Job',
    description: 'Add a new hiring role and define the requirements your team needs.',
    preload: CreateJob.preload,
    match: (pathname) => pathname === '/jobs/create',
  },
  {
    id: 'jobs-detail',
    title: 'Job Details',
    description: 'Review the job brief, skills, and candidate scoring context for this role.',
    preload: JobDetails.preload,
    match: (pathname) => /^\/jobs\/[^/]+$/.test(pathname),
  },
  {
    id: 'jobs-edit',
    title: 'Edit Job',
    description: 'Update role details without leaving the hiring workspace.',
    preload: EditJob.preload,
    match: (pathname) => /^\/jobs\/[^/]+\/edit$/.test(pathname),
  },
  {
    id: 'candidates',
    title: 'Candidates',
    description: 'Review applicants, AI scores, notes, and interview readiness in one place.',
    preload: CandidatesList.preload,
    match: (pathname) => pathname === '/candidates',
  },
  {
    id: 'compare-candidates',
    title: 'Compare Candidates',
    description: 'Compare shortlisted profiles side by side with scores and recruiter context.',
    preload: CompareCandidates.preload,
    match: (pathname) => pathname === '/candidates/compare',
  },
  {
    id: 'upload-candidate',
    title: 'Upload Candidate',
    description: 'Upload one candidate at a time or process a compact PDF batch.',
    preload: UploadCandidate.preload,
    match: (pathname) => pathname === '/candidates/upload',
  },
  {
    id: 'pipeline',
    title: 'Hiring Pipeline',
    description: 'Move candidates through hiring stages without waiting on the next screen.',
    preload: Pipeline.preload,
    match: (pathname) => pathname === '/pipeline',
  },
  {
    id: 'interviews',
    title: 'Interview Calendar',
    description: 'View and manage scheduled interviews in one monthly calendar.',
    preload: InterviewCalendar.preload,
    match: (pathname) => pathname === '/interviews',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Manage your recruiter profile, workspace, theme, and notifications.',
    preload: Settings.preload,
    match: (pathname) => pathname === '/settings',
  },
];

const commonProtectedRouteIds = ['dashboard', 'jobs', 'candidates', 'upload-candidate'];

export const getRouteMeta = (pathname) =>
  routeDefinitions.find((routeDefinition) => routeDefinition.match(pathname)) || null;

export const preloadRouteComponent = (pathname) => {
  const routeMeta = getRouteMeta(pathname);

  if (!routeMeta?.preload) {
    return Promise.resolve(null);
  }

  return routeMeta.preload();
};

export const prefetchCommonProtectedRouteChunks = () =>
  Promise.allSettled(
    routeDefinitions
      .filter((routeDefinition) => commonProtectedRouteIds.includes(routeDefinition.id))
      .map((routeDefinition) => routeDefinition.preload()),
  );

export const prefetchRouteExperience = (pathname) => {
  preloadRouteComponent(pathname);
  prefetchCurrentExperience(pathname);
};
