import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getJobById, updateJob } from '../api/jobs';
import AppShell from '../components/AppShell';
import JobForm from '../components/JobForm';
import { useToast } from '../components/ToastProvider';
import { isUnauthorizedError, removeToken } from '../utils/auth';

function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [initialValues, setInitialValues] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const data = await getJobById(id);
        const job = data.job;

        setInitialValues({
          title: job.title,
          department: job.department,
          location: job.location,
          employmentType: job.employmentType,
          description: job.description,
          requiredSkills: (job.requiredSkills || []).join(', '),
        });
      } catch (requestError) {
        if (isUnauthorizedError(requestError)) {
          removeToken();
          navigate('/login', { replace: true });
          return;
        }

        setError(requestError.message);
        showToast({
          title: 'Unable to load job',
          message: requestError.message,
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadJob();
  }, [id, navigate]);

  const handleSubmit = async (payload) => {
    if (isSubmitting) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await updateJob(id, payload);
      showToast({
        title: 'Job updated',
        message: 'The role details were saved successfully.',
        type: 'success',
      });
      navigate(`/jobs/${id}`, { replace: true });
    } catch (requestError) {
      if (isUnauthorizedError(requestError)) {
        removeToken();
        navigate('/login', { replace: true });
        return;
      }

      setError(requestError.message);
      showToast({
        title: 'Unable to update job',
        message: requestError.message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Edit Job"
      description="Update the role details for this posting."
      actions={
        <Link
          className="btn-secondary btn-compact"
          to={`/jobs/${id}`}
        >
          Back to details
        </Link>
      }
    >
      {isLoading ? (
        <div className="loading-state">Loading job details...</div>
      ) : initialValues ? (
        <JobForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          error={error}
        />
      ) : (
        <div className="empty-state">
          <p className="alert-error">{error || 'Unable to load this job.'}</p>
        </div>
      )}
    </AppShell>
  );
}

export default EditJob;
