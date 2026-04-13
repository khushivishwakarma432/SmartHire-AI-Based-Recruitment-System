import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { getCurrentUser } from '../api/auth';
import { getStoredToken, isUnauthorizedError, removeToken } from '../utils/auth';

function PublicOnlyRoute() {
  const token = getStoredToken();
  const [status, setStatus] = useState(token ? 'checking' : 'public');

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      if (!token) {
        if (isMounted) {
          setStatus('public');
        }
        return;
      }

      try {
        await getCurrentUser(token);

        if (isMounted) {
          setStatus('authenticated');
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (isUnauthorizedError(error)) {
          removeToken();
        }

        setStatus('public');
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === 'checking') {
    return (
      <section className="app-page">
        <div className="app-container">
          <div className="loading-state">Preparing login...</div>
        </div>
      </section>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
