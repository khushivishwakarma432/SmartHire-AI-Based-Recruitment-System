import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useNotifications } from './NotificationProvider';

const formatRelativeTime = (timestamp) => {
  const value = new Date(timestamp).getTime();

  if (!Number.isFinite(value)) {
    return 'Just now';
  }

  const difference = Date.now() - value;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) {
    return 'Just now';
  }

  if (difference < hour) {
    return `${Math.max(1, Math.floor(difference / minute))} min ago`;
  }

  if (difference < day) {
    return `${Math.max(1, Math.floor(difference / hour))} hr ago`;
  }

  return `${Math.max(1, Math.floor(difference / day))} day${difference >= 2 * day ? 's' : ''} ago`;
};

function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const visibleNotifications = useMemo(() => notifications.slice(0, 12), [notifications]);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    if (notification.type === 'interview') {
      navigate('/interviews');
      return;
    }

    if (notification.reference?.candidateName) {
      navigate('/candidates', {
        state: {
          searchTerm: notification.reference.candidateName,
          expandCandidateId: notification.reference.candidateId || '',
        },
      });
      return;
    }

    navigate('/candidates');
  };

  return (
    <div ref={containerRef} className="notification-shell">
      <button
        className="notification-bell-button"
        type="button"
        aria-label="Open notifications"
        aria-expanded={isOpen}
        onClick={() =>
          setIsOpen((current) => {
            const nextValue = !current;
            if (nextValue) {
              window.dispatchEvent(new CustomEvent('smarthire-overlay-open', { detail: { source: 'notifications' } }));
            }
            return nextValue;
          })
        }
      >
        <span aria-hidden="true" className="notification-bell-icon">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
            <path d="M10 3.25a3.5 3.5 0 0 0-3.5 3.5v1.1c0 .92-.24 1.83-.7 2.63l-.88 1.53A1 1 0 0 0 5.8 13.5h8.4a1 1 0 0 0 .88-1.49l-.88-1.53a5.3 5.3 0 0 1-.7-2.63v-1.1A3.5 3.5 0 0 0 10 3.25Z" />
            <path d="M8.3 15a1.8 1.8 0 0 0 3.4 0" strokeLinecap="round" />
          </svg>
        </span>
        <span className="notification-bell-label">Notifications</span>
        {unreadCount ? (
          <span className="notification-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="notification-dropdown">
          <div className="notification-dropdown-head">
            <div>
              <p className="notification-dropdown-title">Notifications</p>
              <p className="notification-dropdown-copy">
                {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
              </p>
            </div>
            <div className="notification-dropdown-actions">
              {notifications.length ? (
                <>
                  <button className="notification-text-action" type="button" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                  <button className="notification-text-action" type="button" onClick={clearAllNotifications}>
                    Clear all
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {visibleNotifications.length ? (
            <div className="notification-list">
              {visibleNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'notification-item-read' : 'notification-item-unread'}`}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-row">
                    <span className={`notification-type-dot notification-type-${notification.type || 'default'}`} />
                    <span className="notification-item-time">{formatRelativeTime(notification.timestamp)}</span>
                  </div>
                  <p className="notification-item-message">{notification.message}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="notification-empty-state">
              <p className="notification-empty-title">No notifications yet</p>
              <p className="notification-empty-copy">
                Important candidate, scoring, decision, and interview updates will appear here.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
