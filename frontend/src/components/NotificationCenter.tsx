import { useState, useEffect } from 'react';
import { X, Check, CheckCheck, Trash2, Settings, Bell, BellOff } from 'lucide-react';
import { format } from 'date-fns';
import type { Notification, NotificationPreferences, NotificationPreferencesFormData } from '../types';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../services/notifications';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications(filter === 'unread');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleUpdatePreferences = async (data: NotificationPreferencesFormData) => {
    try {
      const updated = await updateNotificationPreferences(data);
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline_approaching':
      case 'deadline_today':
        return <Bell className="text-yellow-500" size={20} />;
      case 'overdue':
        return <BellOff className="text-red-500" size={20} />;
      case 'new_task':
        return <Bell className="text-blue-500" size={20} />;
      case 'status_change':
        return <Bell className="text-green-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {showSettings && preferences ? (
          /* Settings Panel */
          <div className="p-6 overflow-y-auto flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Deadline Approaching</span>
                <input
                  type="checkbox"
                  checked={preferences.deadline_approaching}
                  onChange={(e) =>
                    handleUpdatePreferences({ deadline_approaching: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
              </label>

              {preferences.deadline_approaching && (
                <div className="ml-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Days before deadline
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={preferences.days_before_deadline}
                    onChange={(e) =>
                      handleUpdatePreferences({ days_before_deadline: parseInt(e.target.value) })
                    }
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                  />
                </div>
              )}

              <label className="flex items-center justify-between">
                <span className="text-gray-700">Deadline Today</span>
                <input
                  type="checkbox"
                  checked={preferences.deadline_today}
                  onChange={(e) => handleUpdatePreferences({ deadline_today: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-700">Overdue Tasks</span>
                <input
                  type="checkbox"
                  checked={preferences.overdue}
                  onChange={(e) => handleUpdatePreferences({ overdue: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-700">New Tasks</span>
                <input
                  type="checkbox"
                  checked={preferences.new_task}
                  onChange={(e) => handleUpdatePreferences({ new_task: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-700">Status Changes</span>
                <input
                  type="checkbox"
                  checked={preferences.status_change}
                  onChange={(e) => handleUpdatePreferences({ status_change: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          /* Notifications List */
          <>
            {/* Filter and Actions */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unread
                </button>
              </div>

              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            </div>

            {/* Notifications */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Bell size={48} className="mb-4 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read && !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(notification.created_at || notification.createdAt), 'PPp')}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex items-start gap-2">
                          {!notification.is_read && !notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Mark as read"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
