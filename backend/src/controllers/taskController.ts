import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority = 'medium', dueDate, area, subarea } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!area || area.trim() === '') {
      return res.status(400).json({ error: 'Area is required' });
    }

    if (!subarea || subarea.trim() === '') {
      return res.status(400).json({ error: 'Subarea is required' });
    }

    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    const query = `
      INSERT INTO tasks (title, description, priority, due_date, area, subarea, user_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id, title, description, priority, due_date, area, subarea, status, user_id, created_at, updated_at
    `;

    const values = [
      title.trim(),
      description?.trim() || null,
      priority,
      dueDate || null,
      area.trim(),
      subarea.trim(),
      userId
    ];

    const result = await pool.query(query, values);
    const task = result.rows[0];

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.due_date,
        area: task.area,
        subarea: task.subarea,
        status: task.status,
        userId: task.user_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get tasks specific to the authenticated user
    const query = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.priority, 
        t.due_date,
        t.start_date,
        t.end_date,
        t.area,
        t.subarea,
        t.status, 
        t.user_id, 
        t.created_at, 
        t.updated_at,
        u.username,
        u.first_name,
        u.last_name
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    const tasks = result.rows.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.due_date,
      startDate: task.start_date,
      endDate: task.end_date,
      area: task.area,
      subarea: task.subarea,
      status: task.status,
      userId: task.user_id,
      username: task.username,
      firstName: task.first_name,
      lastName: task.last_name,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.priority, 
        t.due_date,
        t.start_date,
        t.end_date,
        t.area,
        t.subarea,
        t.status, 
        t.user_id, 
        t.created_at, 
        t.updated_at,
        u.username,
        u.first_name,
        u.last_name
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];
    res.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.due_date,
        startDate: task.start_date,
        endDate: task.end_date,
        area: task.area,
        subarea: task.subarea,
        status: task.status,
        userId: task.user_id,
        username: task.username,
        firstName: task.first_name,
        lastName: task.last_name,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate, startDate, endDate, area, subarea } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate inputs
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Check if task exists and belongs to user
    const checkQuery = 'SELECT id FROM tasks WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description?.trim() || null);
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(dueDate || null);
    }

    if (startDate !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(startDate || null);
    }

    if (endDate !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(endDate || null);
    }

    if (area !== undefined) {
      if (!area.trim()) {
        return res.status(400).json({ error: 'Area cannot be empty' });
      }
      updates.push(`area = $${paramCount++}`);
      values.push(area.trim());
    }

    if (subarea !== undefined) {
      if (!subarea.trim()) {
        return res.status(400).json({ error: 'Subarea cannot be empty' });
      }
      updates.push(`subarea = $${paramCount++}`);
      values.push(subarea.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, userId);

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING id, title, description, priority, due_date, start_date, end_date, area, subarea, status, user_id, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    const task = result.rows[0];

    res.json({
      message: 'Task updated successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.due_date,
        startDate: task.start_date,
        endDate: task.end_date,
        area: task.area,
        subarea: task.subarea,
        status: task.status,
        userId: task.user_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = 'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};