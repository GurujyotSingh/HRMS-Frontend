import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheck,

  faExclamationTriangle,
  faInfoCircle,
  faClock,
  faCheckCircle,
  faTrash,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { Notification } from '../../../types/calendar';
import { formatDate, formatTime } from '../../../utils/formatters';

const Notifications: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          notification_id: 1,
          user_id: 1,
          type: 'Approval',
          title: 'Leave Request Pending',
          message: 'John Doe has submitted a leave request for 5 days',
          is_read: false,
          created_at: '2024-03-15T09:30:00',
          action_url: '/admin/leave/1',
          priority: 'High',
        },
        {
          notification_id: 2,
          user_id: 1,
          type: 'Reminder',
          title: 'Payroll Processing',
          message: 'Payroll for March needs to be processed by tomorrow',
          is_read: false,
          created_at: '2024-03-15T08:15:00',
          action_url: '/admin/payroll',
          priority: 'High',
        },
        {
          notification_id: 3,
          user_id: 1,
          type: 'Alert',
          title: 'New Employee Onboarding',
          message: '3 new employees are scheduled for onboarding next week',
          is_read: true,
          created_at: '2024-03-14T14:20:00',
          action_url: '/admin/onboarding',
          priority: 'Medium',
        },
        {
          notification_id: 4,
          user_id: 1,
          type: 'Info',
          title: 'System Maintenance',
          message: 'System will be down for maintenance on Sunday, 2 AM to 4 AM',
          is_read: true,
          created_at: '2024-03-13T11:00:00',
          priority: 'Low',
        },
        {
          notification_id: 5,
          user_id: 1,
          type: 'Approval',
          title: 'Travel Claim Approved',
          message: 'Your travel claim for ₹45,000 has been approved',
          is_read: false,
          created_at: '2024-03-12T16:45:00',
          action_url: '/user/travel/2',
          priority: 'Medium',
        },
        {
          notification_id: 6,
          user_id: 1,
          type: 'Reminder',
          title: 'Performance Review Due',
          message: 'Quarterly performance reviews are due in 5 days',
          is_read: false,
          created_at: '2024-03-11T10:30:00',
          action_url: '/admin/performance',
          priority: 'Medium',
        },
      ];
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.notification_id === id ? { ...n, is_read: true } : n
    ));
    showNotification('Notification marked as read', 'success');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    showNotification('All notifications marked as read', 'success');
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter(n => n.notification_id !== id));
    showNotification('Notification deleted', 'success');
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      setNotifications([]);
      showNotification('All notifications deleted', 'success');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Approval': return faCheckCircle;
      case 'Reminder': return faClock;
      case 'Alert': return faExclamationTriangle;
      case 'Info': return faInfoCircle;
      default: return faBell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'High') return '#ef4444';
    if (priority === 'Medium') return '#f59e0b';
    if (priority === 'Low') return '#10b981';
    
    switch (type) {
      case 'Approval': return '#4361ee';
      case 'Reminder': return '#f59e0b';
      case 'Alert': return '#ef4444';
      case 'Info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Notifications</h1>
          <p>Stay updated with important alerts and reminders</p>
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={handleMarkAllAsRead}>
              <FontAwesomeIcon icon={faCheckDouble} /> Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="danger" onClick={handleDeleteAll}>
              <FontAwesomeIcon icon={faTrash} /> Delete All
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon blue">
            <FontAwesomeIcon icon={faBell} />
          </div>
          <div className="stat-info">
            <h3>{notifications.length}</h3>
            <p>Total</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon orange">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-info">
            <h3>{unreadCount}</h3>
            <p>Unread</p>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon green">
            <FontAwesomeIcon icon={faCheck} />
          </div>
          <div className="stat-info">
            <h3>{notifications.length - unreadCount}</h3>
            <p>Read</p>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
        <button
          className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Read
        </button>
      </div>

      {/* Notifications List */}
      <Card className="notifications-list-card">
        {filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div
                key={notification.notification_id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                style={{ borderLeftColor: getNotificationColor(notification.type, notification.priority) }}
              >
                <div
                  className="notification-icon"
                  style={{ backgroundColor: `${getNotificationColor(notification.type, notification.priority)}20` }}
                >
                  <FontAwesomeIcon
                    icon={getNotificationIcon(notification.type)}
                    style={{ color: getNotificationColor(notification.type, notification.priority) }}
                  />
                </div>

                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <span className="notification-time">
                      {formatDate(notification.created_at)} at {formatTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-footer">
                    <span className={`priority-badge priority-${notification.priority.toLowerCase()}`}>
                      {notification.priority}
                    </span>
                    <span className="notification-type">{notification.type}</span>
                  </div>
                </div>

                <div className="notification-actions">
                  {!notification.is_read && (
                    <button
                      className="action-btn read"
                      onClick={() => handleMarkAsRead(notification.notification_id)}
                      title="Mark as read"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                  )}
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(notification.notification_id)}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  {notification.action_url && (
                    <a href={notification.action_url} className="action-btn view" title="View">
                      <FontAwesomeIcon icon={faEye} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FontAwesomeIcon icon={faBell} className="empty-icon" />
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;