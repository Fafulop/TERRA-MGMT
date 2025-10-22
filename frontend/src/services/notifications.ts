import axios from 'axios';
import type { Notification, NotificationPreferences, NotificationPreferencesFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: `${API_URL}/notifications`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all notifications
export async function getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
  const params = unreadOnly ? { unread_only: 'true' } : {};
  const response = await api.get<Notification[]>('/', { params });
  return response.data;
}

// Get unread notification count
export async function getUnreadCount(): Promise<number> {
  const response = await api.get<{ count: number }>('/unread-count');
  return response.data.count;
}

// Mark notification as read
export async function markAsRead(notificationId: number): Promise<Notification> {
  const response = await api.patch<Notification>(`/${notificationId}/read`);
  return response.data;
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<{ message: string; count: number }> {
  const response = await api.patch<{ message: string; count: number }>('/mark-all-read');
  return response.data;
}

// Delete notification
export async function deleteNotification(notificationId: number): Promise<void> {
  await api.delete(`/${notificationId}`);
}

// Get user notification preferences
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await api.get<NotificationPreferences>('/preferences');
  return response.data;
}

// Update user notification preferences
export async function updateNotificationPreferences(
  preferences: NotificationPreferencesFormData
): Promise<NotificationPreferences> {
  const response = await api.put<NotificationPreferences>('/preferences', preferences);
  return response.data;
}
