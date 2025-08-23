import { Request, Response } from 'express';
import pool from '../config/database';

export interface AuthRequest extends Request {
  userId?: number;
}

export interface PersonalTaskFormData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  area: string;
  subarea: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface PersonalTask {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  area: string;
  subarea: string;
  status: 'pending' | 'in_progress' | 'completed';
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

// Create a new personal task
export const createPersonalTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { title, description, priority = 'medium', dueDate, area, subarea, status = 'pending' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!area || !area.trim()) {
      return res.status(400).json({ error: 'Area is required' });
    }

    if (!subarea || !subarea.trim()) {
      return res.status(400).json({ error: 'Subarea is required' });
    }

    const query = `
      INSERT INTO personal_tasks (title, description, priority, due_date, area, subarea, user_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, description, priority, due_date, area, subarea, status, user_id, created_at, updated_at
    `;

    const values = [
      title.trim(),
      description?.trim() || null,
      priority,
      dueDate ? new Date(dueDate) : null,
      area.trim(),
      subarea.trim(),
      userId,
      status
    ];

    const result = await pool.query(query, values);
    const task = result.rows[0];

    const formattedTask: PersonalTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.due_date?.toISOString(),
      area: task.area,
      subarea: task.subarea,
      status: task.status,
      userId: task.user_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };

    res.status(201).json({ 
      message: 'Personal task created successfully',
      task: formattedTask
    });

  } catch (error) {
    console.error('Error creating personal task:', error);
    res.status(500).json({ 
      error: 'Failed to create personal task',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all personal tasks for the logged-in user ONLY
export const getPersonalTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT 
        pt.id, 
        pt.title, 
        pt.description, 
        pt.priority, 
        pt.due_date,
        pt.area,
        pt.subarea,
        pt.status, 
        pt.user_id, 
        pt.created_at, 
        pt.updated_at,
        u.username,
        u.first_name,
        u.last_name
      FROM personal_tasks pt
      LEFT JOIN users u ON pt.user_id = u.id
      WHERE pt.user_id = $1
      ORDER BY pt.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    const tasks = result.rows.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.due_date?.toISOString(),
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

    res.json({ 
      tasks,
      total: tasks.length,
      message: 'Personal tasks retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching personal tasks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch personal tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get a specific personal task by ID (only if owned by logged-in user)
export const getPersonalTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT 
        pt.id, 
        pt.title, 
        pt.description, 
        pt.priority, 
        pt.due_date,
        pt.area,
        pt.subarea,
        pt.status, 
        pt.user_id, 
        pt.created_at, 
        pt.updated_at,
        u.username,
        u.first_name,
        u.last_name
      FROM personal_tasks pt
      LEFT JOIN users u ON pt.user_id = u.id
      WHERE pt.id = $1 AND pt.user_id = $2
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personal task not found or access denied' });
    }

    const task = result.rows[0];
    const formattedTask: PersonalTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.due_date?.toISOString(),
      area: task.area,
      subarea: task.subarea,
      status: task.status,
      userId: task.user_id,
      username: task.username,
      firstName: task.first_name,
      lastName: task.last_name,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };

    res.json({ 
      task: formattedTask,
      message: 'Personal task retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching personal task:', error);
    res.status(500).json({ 
      error: 'Failed to fetch personal task',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update a personal task (only if owned by logged-in user)
export const updatePersonalTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, description, priority, dueDate, area, subarea, status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if task exists and belongs to user
    const checkQuery = 'SELECT id FROM personal_tasks WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Personal task not found or access denied' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      updateValues.push(title.trim());
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description?.trim() || null);
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      updateValues.push(priority);
    }
    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramCount++}`);
      updateValues.push(dueDate ? new Date(dueDate) : null);
    }
    if (area !== undefined) {
      updateFields.push(`area = $${paramCount++}`);
      updateValues.push(area.trim());
    }
    if (subarea !== undefined) {
      updateFields.push(`subarea = $${paramCount++}`);
      updateValues.push(subarea.trim());
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add WHERE clause parameters
    updateValues.push(id, userId);

    const updateQuery = `
      UPDATE personal_tasks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING id, title, description, priority, due_date, area, subarea, status, user_id, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, updateValues);
    const task = result.rows[0];

    const formattedTask: PersonalTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.due_date?.toISOString(),
      area: task.area,
      subarea: task.subarea,
      status: task.status,
      userId: task.user_id,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };

    res.json({ 
      message: 'Personal task updated successfully',
      task: formattedTask
    });

  } catch (error) {
    console.error('Error updating personal task:', error);
    res.status(500).json({ 
      error: 'Failed to update personal task',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete a personal task (only if owned by logged-in user)
export const deletePersonalTask = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = 'DELETE FROM personal_tasks WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personal task not found or access denied' });
    }

    res.json({ 
      message: 'Personal task deleted successfully',
      deletedTaskId: result.rows[0].id
    });

  } catch (error) {
    console.error('Error deleting personal task:', error);
    res.status(500).json({ 
      error: 'Failed to delete personal task',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get personal tasks statistics for dashboard
export const getPersonalTasksStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'completed') as overdue
      FROM personal_tasks 
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    const stats = result.rows[0];

    res.json({
      stats: {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        inProgress: parseInt(stats.in_progress),
        completed: parseInt(stats.completed),
        highPriority: parseInt(stats.high_priority),
        overdue: parseInt(stats.overdue)
      },
      message: 'Personal tasks statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching personal tasks statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch personal tasks statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};