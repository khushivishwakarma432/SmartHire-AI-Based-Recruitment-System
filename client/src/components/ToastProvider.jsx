import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION = 4200;

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message = '', type = 'info' }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      setToasts((current) => [...current, { id, title, message, type }]);

      window.setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);
    },
    [removeToast],
  );

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
    }),
    [removeToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="min-w-0 flex-1">
              <p className="toast-title">{toast.title}</p>
              {toast.message ? <p className="toast-message">{toast.message}</p> : null}
            </div>
            <button
              className="toast-close"
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider.');
  }

  return context;
};

export default ToastProvider;
