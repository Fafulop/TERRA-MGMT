import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getTaskComments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First verify that the task exists
    const taskQuery = 'SELECT id FROM tasks WHERE id = $1';
    const taskResult = await pool.query(taskQuery, [taskId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get comments for the task with user information
    const query = `
      SELECT 
        tc.id, 
        tc.task_id, 
        tc.comment, 
        tc.created_at, 
        tc.updated_at,
        u.username,
        u.first_name,
        u.last_name
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at ASC
    `;

    const result = await pool.query(query, [taskId]);
    const comments = result.rows.map(comment => ({
      id: comment.id,
      taskId: comment.task_id,
      comment: comment.comment,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: {
        username: comment.username,
        firstName: comment.first_name,
        lastName: comment.last_name
      }
    }));

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching task comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTaskComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { comment } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // First verify that the task exists
    const taskQuery = 'SELECT id FROM tasks WHERE id = $1';
    const taskResult = await pool.query(taskQuery, [taskId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Insert the comment
    const insertQuery = `
      INSERT INTO task_comments (task_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING id, task_id, comment, created_at, updated_at
    `;

    const insertResult = await pool.query(insertQuery, [taskId, userId, comment.trim()]);
    const newComment = insertResult.rows[0];

    // Get user information for the response
    const userQuery = 'SELECT username, first_name, last_name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      message: 'Comment created successfully',
      comment: {
        id: newComment.id,
        taskId: newComment.task_id,
        comment: newComment.comment,
        createdAt: newComment.created_at,
        updatedAt: newComment.updated_at,
        author: {
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    });
  } catch (error) {
    console.error('Error creating task comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTaskComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, commentId } = req.params;
    const { comment } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Verify that the comment exists and belongs to the user
    const checkQuery = `
      SELECT tc.id, tc.task_id 
      FROM task_comments tc
      WHERE tc.id = $1 AND tc.user_id = $2 AND tc.task_id = $3
    `;
    
    const checkResult = await pool.query(checkQuery, [commentId, userId, taskId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    // Update the comment
    const updateQuery = `
      UPDATE task_comments 
      SET comment = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING id, task_id, comment, created_at, updated_at
    `;

    const updateResult = await pool.query(updateQuery, [comment.trim(), commentId, userId]);
    const updatedComment = updateResult.rows[0];

    // Get user information for the response
    const userQuery = 'SELECT username, first_name, last_name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    res.json({
      message: 'Comment updated successfully',
      comment: {
        id: updatedComment.id,
        taskId: updatedComment.task_id,
        comment: updatedComment.comment,
        createdAt: updatedComment.created_at,
        updatedAt: updatedComment.updated_at,
        author: {
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    });
  } catch (error) {
    console.error('Error updating task comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTaskComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, commentId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify that the comment exists and belongs to the user
    const checkQuery = `
      SELECT tc.id 
      FROM task_comments tc
      WHERE tc.id = $1 AND tc.user_id = $2 AND tc.task_id = $3
    `;
    
    const checkResult = await pool.query(checkQuery, [commentId, userId, taskId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    // Delete the comment
    const deleteQuery = 'DELETE FROM task_comments WHERE id = $1 AND user_id = $2';
    await pool.query(deleteQuery, [commentId, userId]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting task comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};