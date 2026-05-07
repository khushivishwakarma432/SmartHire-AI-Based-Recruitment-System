import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCurrentUser, loginUser } from '../api/auth';
import { useToast } from '../components/ToastProvider';
import { prefetchCommonProtectedRouteChunks } from '../routes/routeModules';
import { getStoredToken, hasRecentSessionVerification, isUnauthorizedError, markSessionVerified, removeToken, storeToken } from '../utils/auth';
import { prefetchProtectedExperience } from '../utils/prefetch';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const token = getStoredToken();

      if (!token) {
        return;
      }

      if (hasRecentSessionVerification()) {
        if (isMounted) {
          navigate('/dashboard', { replace: true });
        }
        return;
      }

      try {
        await getCurrentUser(token);

        if (isMounted) {
          navigate('/dashboard', { replace: true });
        }
      } catch (requestError) {
        if (isUnauthorizedError(requestError)) {
          removeToken();
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError('');
    setSuccessMessage('');
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPassword = formData.password;

    if (!normalizedEmail || !normalizedPassword) {
      const message = 'Email and password are required.';
      setError(message);
      showToast({ title: 'Login blocked', message, type: 'error' });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      const message = 'Please enter a valid email address.';
      setError(message);
      showToast({ title: 'Login blocked', message, type: 'error' });
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const data = await loginUser({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (!data?.token) {
        throw new Error('Login succeeded but no session token was returned.');
      }

      setSuccessMessage('Login successful. Redirecting to your dashboard...');
      storeToken(data.token);
      markSessionVerified(data.user || null);
      prefetchCommonProtectedRouteChunks();
      prefetchProtectedExperience();
      showToast({
        title: 'Logged in',
        message: 'You are back in SmartHire.',
        type: 'success',
      });
      navigate('/dashboard', { replace: true });
    } catch (submissionError) {
      setError(submissionError.message);
      showToast({
        title: 'Login failed',
        message: submissionError.message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="form-shell">
        <div className="section-heading">
          <div>
            <p className="kicker">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Log in to SmartHire
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Open your jobs, candidates, scores, and recruiter notes.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="field-label">Email</span>
            <input
              className="input-field"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </label>

          <label className="block">
            <span className="field-label">Password</span>
            <input
              className="input-field"
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </label>

          {error ? <p className="alert-error">{error}</p> : null}
          {successMessage ? <p className="alert-success">{successMessage}</p> : null}

          <button
            className="btn-primary w-full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-900">New to SmartHire?</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Create your recruiter account to start managing jobs, candidates, and hiring decisions.
          </p>
          <Link className="btn-secondary mt-4 w-full justify-center" to="/signup">
            Create Account
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link className="font-semibold text-sky-700 transition hover:text-sky-800" to="/signup">
              Sign up
            </Link>
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Secure sign in</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
