import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'smarthire_theme';
const DEFAULT_THEME = 'dark';

export const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : DEFAULT_THEME;
};

export const applyTheme = (theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const resolvedTheme = theme === 'light' ? 'light' : 'dark';

  root.classList.remove('theme-light', 'theme-dark', 'dark');
  root.classList.add(resolvedTheme === 'light' ? 'theme-light' : 'theme-dark');

  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  }

  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
};

export const setStoredTheme = (theme) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  applyTheme(theme);
};

export const useTheme = () => {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setStoredTheme(nextTheme);
      return nextTheme;
    });
  };

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
};
