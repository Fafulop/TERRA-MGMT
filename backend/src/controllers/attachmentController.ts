import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getTaskAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify task exists
    const taskQuery = 'SELECT id FROM tasks WHERE id = $1';
    const taskResult = await pool.query(taskQuery, [taskId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get attachments for the task
    const query = `
      SELECT 
        a.id,
        a.task_id,
        a.file_name,
        a.file_url,
        a.file_size,
        a.file_type,
        a.attachment_type,
        a.url_title,
        a.created_at,
        u.username,
        u.first_name,
        u.last_name
      FROM attachments a
      JOIN users u ON a.user_id = u.id
      WHERE a.task_id = $1
      ORDER BY a.created_at ASC
    `;

    const result = await pool.query(query, [taskId]);
    const attachments = result.rows.map(attachment => ({
      id: attachment.id,
      taskId: attachment.task_id,
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      fileSize: attachment.file_size,
      fileType: attachment.file_type,
      attachmentType: attachment.attachment_type,
      urlTitle: attachment.url_title,
      createdAt: attachment.created_at,
      uploadedBy: {
        username: attachment.username,
        firstName: attachment.first_name,
        lastName: attachment.last_name
      }
    }));

    res.json({ attachments });
  } catch (error) {
    console.error('Error fetching task attachments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCommentAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify comment exists
    const commentQuery = 'SELECT id FROM task_comments WHERE id = $1';
    const commentResult = await pool.query(commentQuery, [commentId]);

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get attachments for the comment
    const query = `
      SELECT 
        a.id,
        a.comment_id,
        a.file_name,
        a.file_url,
        a.file_size,
        a.file_type,
        a.attachment_type,
        a.url_title,
        a.created_at,
        u.username,
        u.first_name,
        u.last_name
      FROM attachments a
      JOIN users u ON a.user_id = u.id
      WHERE a.comment_id = $1
      ORDER BY a.created_at ASC
    `;

    const result = await pool.query(query, [commentId]);
    const attachments = result.rows.map(attachment => ({
      id: attachment.id,
      commentId: attachment.comment_id,
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      fileSize: attachment.file_size,
      fileType: attachment.file_type,
      attachmentType: attachment.attachment_type,
      urlTitle: attachment.url_title,
      createdAt: attachment.created_at,
      uploadedBy: {
        username: attachment.username,
        firstName: attachment.first_name,
        lastName: attachment.last_name
      }
    }));

    res.json({ attachments });
  } catch (error) {
    console.error('Error fetching comment attachments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTaskAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { fileName, fileUrl, fileSize, fileType, attachmentType, urlTitle } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!fileName || !fileUrl || !attachmentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['file', 'url'].includes(attachmentType)) {
      return res.status(400).json({ error: 'Invalid attachment type' });
    }

    // Verify task exists
    const taskQuery = 'SELECT id FROM tasks WHERE id = $1';
    const taskResult = await pool.query(taskQuery, [taskId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Insert the attachment
    const insertQuery = `
      INSERT INTO attachments (task_id, user_id, file_name, file_url, file_size, file_type, attachment_type, url_title)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, task_id, file_name, file_url, file_size, file_type, attachment_type, url_title, created_at
    `;

    const insertResult = await pool.query(insertQuery, [
      taskId, userId, fileName, fileUrl, fileSize, fileType, attachmentType, urlTitle
    ]);
    const newAttachment = insertResult.rows[0];

    // Get user information for the response
    const userQuery = 'SELECT username, first_name, last_name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      message: 'Attachment created successfully',
      attachment: {
        id: newAttachment.id,
        taskId: newAttachment.task_id,
        fileName: newAttachment.file_name,
        fileUrl: newAttachment.file_url,
        fileSize: newAttachment.file_size,
        fileType: newAttachment.file_type,
        attachmentType: newAttachment.attachment_type,
        urlTitle: newAttachment.url_title,
        createdAt: newAttachment.created_at,
        uploadedBy: {
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    });
  } catch (error) {
    console.error('Error creating task attachment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCommentAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { fileName, fileUrl, fileSize, fileType, attachmentType, urlTitle } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!fileName || !fileUrl || !attachmentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['file', 'url'].includes(attachmentType)) {
      return res.status(400).json({ error: 'Invalid attachment type' });
    }

    // Verify comment exists
    const commentQuery = 'SELECT id FROM task_comments WHERE id = $1';
    const commentResult = await pool.query(commentQuery, [commentId]);

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Insert the attachment
    const insertQuery = `
      INSERT INTO attachments (comment_id, user_id, file_name, file_url, file_size, file_type, attachment_type, url_title)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, comment_id, file_name, file_url, file_size, file_type, attachment_type, url_title, created_at
    `;

    const insertResult = await pool.query(insertQuery, [
      commentId, userId, fileName, fileUrl, fileSize, fileType, attachmentType, urlTitle
    ]);
    const newAttachment = insertResult.rows[0];

    // Get user information for the response
    const userQuery = 'SELECT username, first_name, last_name FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      message: 'Attachment created successfully',
      attachment: {
        id: newAttachment.id,
        commentId: newAttachment.comment_id,
        fileName: newAttachment.file_name,
        fileUrl: newAttachment.file_url,
        fileSize: newAttachment.file_size,
        fileType: newAttachment.file_type,
        attachmentType: newAttachment.attachment_type,
        urlTitle: newAttachment.url_title,
        createdAt: newAttachment.created_at,
        uploadedBy: {
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }
    });
  } catch (error) {
    console.error('Error creating comment attachment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify attachment exists and belongs to user
    const checkQuery = 'SELECT id FROM attachments WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [attachmentId, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found or unauthorized' });
    }

    // Delete the attachment
    const deleteQuery = 'DELETE FROM attachments WHERE id = $1 AND user_id = $2';
    await pool.query(deleteQuery, [attachmentId, userId]);

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};