import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import AuthLayout from './layouts/AuthLayout';
const CompareCandidates = lazy(() => import('./pages/CompareCandidates'));
const CandidatesList = lazy(() => import('./pages/CandidatesList'));
const CreateJob = lazy(() => import('./pages/CreateJob'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EditJob = lazy(() => import('./pages/EditJob'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const JobsList = lazy(() => import('./pages/JobsList'));
const InterviewCalendar = lazy(() => import('./pages/InterviewCalendar'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Settings = lazy(() => import('./pages/Settings'));
const Signup = lazy(() => import('./pages/Signup'));
const UploadCandidate = lazy(() => import('./pages/UploadCandidate'));

function RouteLoadingState() {
  return (
    <section className="app-page">
      <div className="app-container">
        <div className="loading-state">Loading page...</div>
      </div>
    </section>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Navigate replace to="/#features" />} />
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/create" element={<CreateJob />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/jobs/:id/edit" element={<EditJob />} />
          <Route path="/candidates" element={<CandidatesList />} />
          <Route path="/candidates/compare" element={<CompareCandidates />} />
          <Route path="/candidates/upload" element={<UploadCandidate />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/interviews" element={<InterviewCalendar />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
