import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext(null);
const NOTIFICATIONS_STORAGE_KEY = 'smarthire_notifications';
const MAX_NOTIFICATIONS = 40;

const getStoredNotifications = () => {
  try {
    const storedValue = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveNotifications = (notifications) => {
  try {
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch (error) {
    // Ignore storage failures and keep in-memory notifications working.
  }
};

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(getStoredNotifications);

  const updateNotifications = useCallback((updater) => {
    setNotifications((current) => {
      const nextValue = typeof updater === 'function' ? updater(current) : updater;
      const normalizedValue = Array.isArray(nextValue) ? nextValue.slice(0, MAX_NOTIFICATIONS) : [];
      saveNotifications(normalizedValue);
      return normalizedValue;
    });
  }, []);

  const addNotification = useCallback(
    ({ type, message, reference = null }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const nextNotification = {
        id,
        type,
        message,
        timestamp: new Date().toISOString(),
        isRead: false,
        reference,
      };

      updateNotifications((current) => [nextNotification, ...current].slice(0, MAX_NOTIFICATIONS));
      return id;
    },
    [updateNotifications],
  );

  const markAsRead = useCallback(
    (id) => {
      updateNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      );
    },
    [updateNotifications],
  );

  const markAllAsRead = useCallback(() => {
    updateNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  }, [updateNotifications]);

  const clearAllNotifications = useCallback(() => {
    updateNotifications([]);
  }, [updateNotifications]);

  const unreadCount = useMemo(
    () => notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0),
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
    }),
    [addNotification, clearAllNotifications, markAllAsRead, markAsRead, notifications, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider.');
  }

  return context;
};

export default NotificationProvider;
