import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { getCurrentUser } from '../api/auth';
import { getStoredToken } from '../utils/auth';
import { isUnauthorizedError, removeToken } from '../utils/auth';

function ProtectedRoute() {
  const location = useLocation();
  const token = getStoredToken();
  const [status, setStatus] = useState(token ? 'checking' : 'unauthorized');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      if (!token) {
        if (isMounted) {
          setStatus('unauthorized');
        }
        return;
      }

      setStatus('checking');
      setError('');

      try {
        await getCurrentUser(token);

        if (isMounted) {
          setStatus('authorized');
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        if (isUnauthorizedError(requestError)) {
          removeToken();
          setStatus('unauthorized');
          return;
        }

        setError(requestError.message || 'Unable to verify your session right now.');
        setStatus('error');
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }

  if (status === 'unauthorized') {
    return <Navigate to="/" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  }

  if (status === 'checking') {
    return (
      <section className="app-page">
        <div className="app-container">
          <div className="loading-state">Verifying your session...</div>
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="app-page">
        <div className="app-container">
          <div className="empty-state">
            <h2 className="title-lg">Unable to verify your session</h2>
            <p className="body-muted mt-2">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
