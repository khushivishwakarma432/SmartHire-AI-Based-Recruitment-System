import { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import HelpAssistant from './components/HelpAssistant';
import AuthLayout from './layouts/AuthLayout';
import {
  CandidatesList,
  CompareCandidates,
  CreateJob,
  Dashboard,
  EditJob,
  InterviewCalendar,
  JobDetails,
  JobsList,
  Landing,
  Login,
  NotFound,
  Pipeline,
  Settings,
  Signup,
  UploadCandidate,
  getRouteMeta,
} from './routes/routeModules';

function RouteLoadingState() {
  const location = useLocation();
  const routeMeta = getRouteMeta(location.pathname);

  if (routeMeta) {
    return (
      <AppShell title={routeMeta.title} description={routeMeta.description}>
        <div className="space-y-4">
          <section className="panel p-4">
            <div className="skeleton-line w-28" />
            <div className="mt-3 skeleton-line h-7 w-56" />
            <div className="mt-3 space-y-2">
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-10/12" />
            </div>
          </section>
          <section className="panel space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="panel-muted space-y-3">
                  <div className="skeleton-line w-24" />
                  <div className="skeleton-line h-6 w-2/3" />
                  <div className="space-y-2">
                    <div className="skeleton-line w-full" />
                    <div className="skeleton-line w-11/12" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

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
    <>
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
      <HelpAssistant />
    </>
  );
}

export default App;
