import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import AuthLayout from './layouts/AuthLayout';
import CompareCandidates from './pages/CompareCandidates';
import CandidatesList from './pages/CandidatesList';
import CreateJob from './pages/CreateJob';
import Dashboard from './pages/Dashboard';
import EditJob from './pages/EditJob';
import JobDetails from './pages/JobDetails';
import JobsList from './pages/JobsList';
import InterviewCalendar from './pages/InterviewCalendar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Pipeline from './pages/Pipeline';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import UploadCandidate from './pages/UploadCandidate';

function App() {
  return (
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
  );
}

export default App;
