import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'smarthire_theme';
const DEFAULT_THEME = 'dark';
const THEME_CHANGE_EVENT = 'smarthire-theme-change';

const normalizeTheme = (theme) => (theme === 'light' ? 'light' : 'dark');

export const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return normalizeTheme(storedTheme || DEFAULT_THEME);
};

export const applyTheme = (theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const resolvedTheme = normalizeTheme(theme);

  root.classList.remove('theme-light', 'theme-dark', 'dark');
  root.classList.add(resolvedTheme === 'light' ? 'theme-light' : 'theme-dark');

  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  }

  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
};

export const setStoredTheme = (theme) => {
  const resolvedTheme = normalizeTheme(theme);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  }

  applyTheme(resolvedTheme);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: {
          theme: resolvedTheme,
        },
      }),
    );
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (event) => {
      setTheme(normalizeTheme(event.detail?.theme || getStoredTheme()));
    };

    const handleStorage = (event) => {
      if (event.key && event.key !== THEME_STORAGE_KEY) {
        return;
      }

      setTheme(getStoredTheme());
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleTheme = () => {
    setStoredTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
};
