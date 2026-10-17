import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  Flag,
  RefreshCw,
  CalendarPlus,
  AlertTriangle,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { getTimeAgo } from '../data/constants';
import type { AppNotification } from '../types';

interface NotificationBellProps {
  type: 'user' | 'operator';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    userNotifications,
    operatorNotifications,
    markAllUserNotificationsRead,
    markUserNotificationRead,
    markAllOperatorNotificationsRead,
    markOperatorNotificationRead,
  } = useParking();

  const notifications = type === 'user' ? userNotifications : operatorNotifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'user') {
      markAllUserNotificationsRead();
    } else {
      markAllOperatorNotificationsRead();
    }
  };

  const handleNotificationClick = (id: string) => {
    if (type === 'user') {
      markUserNotificationRead(id);
    } else {
      markOperatorNotificationRead(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderIcon = (notif: AppNotification) => {
    const t = notif.type.toLowerCase();
    if (t.includes('confirmed') || t.includes('available')) {
      return <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981' }} />;
    }
    if (t.includes('cancelled')) {
      return <XCircle style={{ width: 18, height: 18, color: '#ef4444' }} />;
    }
    if (t.includes('completed')) {
      return <Flag style={{ width: 18, height: 18, color: '#2563eb' }} />;
    }
    if (t.includes('updated') || t.includes('maintenance')) {
      return <RefreshCw style={{ width: 18, height: 18, color: '#f59e0b' }} />;
    }
    if (t.includes('new_booking')) {
      return <CalendarPlus style={{ width: 18, height: 18, color: '#2563eb' }} />;
    }
    if (t.includes('issue')) {
      return <AlertTriangle style={{ width: 18, height: 18, color: '#ef4444' }} />;
    }
    return <Bell style={{ width: 18, height: 18, color: '#64748b' }} />;
  };

  return (
    <div className="notification-bell-container" ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="notification-bell"
        id={type === 'user' ? 'user-notification-bell' : 'operator-notification-bell'}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        style={{ cursor: 'pointer' }}
      >
        <Bell style={{ width: 20, height: 20 }} />
        {unreadCount > 0 && (
          <span className="notification-badge" id={type === 'user' ? 'user-notification-badge' : 'operator-notification-badge'}>
            {unreadCount}
          </span>
        )}
      </button>

      <div
        className={`notification-panel ${isOpen ? 'open' : ''}`}
        id={type === 'user' ? 'user-notification-panel' : 'operator-notification-panel'}
        style={{
          display: isOpen ? 'block' : 'none',
          right: 0,
        }}
      >
        <div className="notification-panel-header">
          <h3>Notifications</h3>
        </div>

        <div className="notification-list" id={type === 'user' ? 'user-notification-list' : 'operator-notification-list'}>
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <BellOff style={{ width: 24, height: 24, margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notification-item ${notif.read ? '' : 'unread'}`}
                onClick={() => handleNotificationClick(notif.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notification-icon">{renderIcon(notif)}</div>
                <div className="notification-content">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                  <div className="notification-time">{getTimeAgo(new Date(notif.timestamp))}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="notification-panel-footer">
          <button type="button" className="btn-link" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
};
