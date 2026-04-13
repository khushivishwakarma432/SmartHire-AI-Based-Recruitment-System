import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { createJob } from '../api/jobs';
import AppShell from '../components/AppShell';
import JobForm from '../components/JobForm';
import { useToast } from '../components/ToastProvider';
import { isUnauthorizedError, removeToken } from '../utils/auth';

function CreateJob() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    if (isSubmitting) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const data = await createJob(payload);
      showToast({
        title: 'Job created',
        message: 'The job is ready for candidate review.',
        type: 'success',
      });
      navigate(`/jobs/${data.job._id}`, { replace: true });
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      setError(requestError.message);
      showToast({
        title: 'Unable to create job',
        message: requestError.message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Create Job"
      description="Add a new job posting with the core details candidates will see."
      actions={
        <Link
          className="btn-secondary btn-compact"
          to="/jobs"
        >
          Back to jobs
        </Link>
      }
    >
      <JobForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Create job"
        error={error}
      />
    </AppShell>
  );
}

export default CreateJob;
