const SETTINGS_STORAGE_KEY = 'smarthire_settings';

const DEFAULT_SETTINGS = {
  workspaceName: 'SmartHire Team',
  notifications: {
    candidateUploads: true,
    scoreGeneration: true,
    recruiterUpdates: true,
  },
};

export const getStoredSettings = () => {
  try {
    const storedValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : {};

    return {
      workspaceName: parsedValue.workspaceName || DEFAULT_SETTINGS.workspaceName,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsedValue.notifications || {}),
      },
    };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
};

export const storeSettings = (settings) => {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const defaultSettings = DEFAULT_SETTINGS;
