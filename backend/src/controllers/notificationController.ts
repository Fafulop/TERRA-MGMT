import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get user notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { unread_only } = req.query;

    let query = `
      SELECT
        n.id,
        n.user_id,
        n.task_id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.created_at,
        n.updated_at,
        t.title as task_title,
        t.status as task_status,
        t.due_date as task_due_date
      FROM notifications n
      LEFT JOIN tasks t ON n.task_id = t.id
      WHERE n.user_id = $1
    `;

    const params: any[] = [userId];

    if (unread_only === 'true') {
      query += ` AND n.is_read = false`;
    }

    query += ` ORDER BY n.created_at DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      error: 'Failed to fetch unread count',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id',
      [userId]
    );

    res.json({
      message: 'All notifications marked as read',
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user notification preferences
export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    let result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    // If preferences don't exist, create default ones
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO notification_preferences (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch notification preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update user notification preferences
export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      deadline_approaching,
      deadline_today,
      overdue,
      new_task,
      status_change,
      days_before_deadline
    } = req.body;

    // First check if preferences exist
    const checkResult = await pool.query(
      'SELECT id FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Create new preferences
      result = await pool.query(
        `INSERT INTO notification_preferences (
          user_id,
          deadline_approaching,
          deadline_today,
          overdue,
          new_task,
          status_change,
          days_before_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          userId,
          deadline_approaching ?? true,
          deadline_today ?? true,
          overdue ?? true,
          new_task ?? true,
          status_change ?? true,
          days_before_deadline ?? 3
        ]
      );
    } else {
      // Update existing preferences
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (deadline_approaching !== undefined) {
        updates.push(`deadline_approaching = $${paramCount++}`);
        values.push(deadline_approaching);
      }
      if (deadline_today !== undefined) {
        updates.push(`deadline_today = $${paramCount++}`);
        values.push(deadline_today);
      }
      if (overdue !== undefined) {
        updates.push(`overdue = $${paramCount++}`);
        values.push(overdue);
      }
      if (new_task !== undefined) {
        updates.push(`new_task = $${paramCount++}`);
        values.push(new_task);
      }
      if (status_change !== undefined) {
        updates.push(`status_change = $${paramCount++}`);
        values.push(status_change);
      }
      if (days_before_deadline !== undefined) {
        updates.push(`days_before_deadline = $${paramCount++}`);
        values.push(days_before_deadline);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No preferences provided to update' });
      }

      values.push(userId);
      result = await pool.query(
        `UPDATE notification_preferences
         SET ${updates.join(', ')}
         WHERE user_id = $${paramCount}
         RETURNING *`,
        values
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create notification (used by notification service)
export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, task_id, type, title, message } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, type, title, message'
      });
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, task_id, type, title, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, task_id, type, title, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
