import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCurrentUser, registerUser } from '../api/auth';
import { useToast } from '../components/ToastProvider';
import { getStoredToken, isUnauthorizedError, removeToken, storeToken } from '../utils/auth';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function Signup() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
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

    const normalizedName = formData.name.trim();
    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPassword = formData.password;

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      const message = 'Name, email, and password are required.';
      setError(message);
      showToast({ title: 'Signup blocked', message, type: 'error' });
      return;
    }

    if (normalizedName.length < 2) {
      const message = 'Please enter your full name.';
      setError(message);
      showToast({ title: 'Signup blocked', message, type: 'error' });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      const message = 'Please enter a valid email address.';
      setError(message);
      showToast({ title: 'Signup blocked', message, type: 'error' });
      return;
    }

    if (normalizedPassword.length < 6) {
      const message = 'Password must be at least 6 characters long.';
      setError(message);
      showToast({ title: 'Signup blocked', message, type: 'error' });
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const data = await registerUser({
        name: normalizedName,
        email: normalizedEmail,
        password: normalizedPassword,
      });
      setSuccessMessage('Account created successfully. Redirecting to your dashboard...');
      storeToken(data.token);
      showToast({
        title: 'Account created',
        message: 'Your account is ready.',
        type: 'success',
      });
      navigate('/dashboard', { replace: true });
    } catch (submissionError) {
      setError(submissionError.message);
      showToast({
        title: 'Signup failed',
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
            <p className="kicker">Create account</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Sign up for SmartHire
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Create your recruiter account and start reviewing jobs and candidates in one place.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="field-label">Name</span>
            <input
              className="input-field"
              type="text"
              name="name"
              placeholder="Your name"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </label>

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
              placeholder="Create a password"
              autoComplete="new-password"
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
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link className="font-semibold text-sky-700 transition hover:text-sky-800" to="/login">
              Login
            </Link>
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Built for recruiter teams</p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
