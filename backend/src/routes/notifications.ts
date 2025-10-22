import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  createNotification
} from '../controllers/notificationController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user notifications (with optional unread_only query param)
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Get user notification preferences
router.get('/preferences', getPreferences);

// Update user notification preferences
router.put('/preferences', updatePreferences);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Create notification (internal use by notification service)
router.post('/', createNotification);

export default router;
