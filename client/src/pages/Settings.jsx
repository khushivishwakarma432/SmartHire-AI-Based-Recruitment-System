import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCurrentUser } from '../api/auth';
import AppShell from '../components/AppShell';
import { useToast } from '../components/ToastProvider';
import { getStoredToken, isUnauthorizedError, removeToken } from '../utils/auth';
import { getStoredSettings, storeSettings } from '../utils/settings';
import { setStoredTheme, useTheme } from '../utils/theme';

function Settings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(() => {
    const settings = getStoredSettings();

    return {
      workspaceName: settings.workspaceName,
      themePreference: theme,
      notifications: settings.notifications,
    };
  });

  useEffect(() => {
    const loadProfile = async () => {
      const token = getStoredToken();

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const data = await getCurrentUser(token);
        setUser(data.user);
      } catch (requestError) {
        if (isUnauthorizedError(requestError)) {
          removeToken();
          navigate('/login', { replace: true });
          return;
        }

        setError(requestError.message);
        showToast({
          title: 'Unable to load profile',
          message: requestError.message,
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [navigate, showToast]);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      themePreference: theme,
    }));
  }, [theme]);

  const handleWorkspaceChange = (event) => {
    setError('');
    setFormData((current) => ({
      ...current,
      workspaceName: event.target.value,
    }));
  };

  const handleThemeChange = (event) => {
    const nextTheme = event.target.value;
    setStoredTheme(nextTheme);
    setFormData((current) => ({
      ...current,
      themePreference: nextTheme,
    }));
  };

  const handleNotificationChange = (key) => {
    setFormData((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: !current.notifications[key],
      },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const normalizedWorkspaceName = formData.workspaceName.trim();

    if (!normalizedWorkspaceName) {
      const message = 'Workspace name is required.';
      setError(message);
      showToast({
        title: 'Settings not saved',
        message,
        type: 'error',
      });
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      storeSettings({
        workspaceName: normalizedWorkspaceName,
        notifications: formData.notifications,
      });

      setFormData((current) => ({
        ...current,
        workspaceName: normalizedWorkspaceName,
      }));

      showToast({
        title: 'Settings saved',
        message: 'Your settings have been saved.',
        type: 'success',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell
        title="Settings"
        description="Manage your recruiter profile, team name, theme, and notifications."
        actions={
          <Link className="btn-secondary btn-compact" to="/dashboard">
            Back to dashboard
          </Link>
        }
      >
        <div className="panel space-y-5">
          <div className="flex flex-col gap-2.5 border-b border-slate-200 pb-4">
            <div className="skeleton-line w-24" />
            <div className="skeleton-line h-7 w-56" />
            <div className="space-y-2">
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-10/12" />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel-muted space-y-3">
              <div className="skeleton-line w-24" />
              <div className="skeleton h-11 rounded-2xl" />
              <div className="skeleton h-11 rounded-2xl" />
            </div>
            <div className="panel-muted space-y-3">
              <div className="skeleton-line w-32" />
              <div className="skeleton h-11 rounded-2xl" />
              <div className="skeleton h-11 rounded-2xl" />
              <div className="skeleton h-11 rounded-2xl" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Settings"
      description="Manage your recruiter profile, team name, theme, and notifications."
      actions={
        <Link className="btn-secondary btn-compact" to="/dashboard">
          Back to dashboard
        </Link>
      }
    >
      {error ? <p className="alert-error">{error}</p> : null}

      <form className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]" onSubmit={handleSave}>
        <section className="panel space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <p className="kicker">Recruiter Profile</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Profile details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your account identity is loaded from the current SmartHire session.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="panel-muted">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recruiter Name</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{user?.name || 'Not available'}</p>
            </div>
            <div className="panel-muted">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{user?.email || 'Not available'}</p>
            </div>
          </div>

          <label className="block">
            <span className="field-label">Company / Workspace Name</span>
            <input
              className="input-field"
              type="text"
              value={formData.workspaceName}
              onChange={handleWorkspaceChange}
              placeholder="SmartHire Workspace"
            />
            <span className="mt-2 block text-xs text-slate-500">
              This is stored locally to personalize your SmartHire account.
            </span>
          </label>
        </section>

        <section className="space-y-4">
          <div className="panel">
            <div className="border-b border-slate-200 pb-4">
              <p className="kicker">Appearance</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Theme preference</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dark mode stays the premium default, but you can switch anytime.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { value: 'dark', label: 'Dark Mode', detail: 'Premium recruiter dashboard default' },
                { value: 'light', label: 'Light Mode', detail: 'Bright, clean alternative to dark mode' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`panel-muted cursor-pointer transition ${
                    formData.themePreference === option.value ? 'ring-2 ring-emerald-400/60' : ''
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="themePreference"
                    value={option.value}
                    checked={formData.themePreference === option.value}
                    onChange={handleThemeChange}
                  />
                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{option.detail}</p>
                </label>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="border-b border-slate-200 pb-4">
              <p className="kicker">Notifications</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Notification preferences</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Choose which recruiter reminders and updates you want to keep visible.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  key: 'candidateUploads',
                  label: 'Candidate uploads',
                  detail: 'Show confirmation for newly uploaded candidate profiles.',
                },
                {
                  key: 'scoreGeneration',
                  label: 'AI score updates',
                  detail: 'Keep score generation feedback visible during screening.',
                },
                {
                  key: 'recruiterUpdates',
                  label: 'Recruiter review saves',
                  detail: 'Show save feedback for recruiter notes and decision changes.',
                },
              ].map((item) => (
                <label key={item.key} className="panel-muted flex items-start justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                    <span
                      className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                        formData.notifications[item.key]
                          ? 'bg-emerald-500'
                          : theme === 'dark'
                            ? 'bg-slate-700'
                            : 'bg-slate-300'
                      }`}
                    >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow transition ${
                        formData.notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </span>
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={formData.notifications[item.key]}
                    onChange={() => handleNotificationChange(item.key)}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="xl:col-span-2 flex justify-end">
          <button
            className="btn-primary btn-compact disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

export default Settings;
