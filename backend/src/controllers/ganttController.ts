import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * Gantt Chart Controller
 * Handles global project management operations where any user can view/edit any task
 */

export const getGanttTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get ALL tasks from ALL users for global project view
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
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query);
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
    console.error('Error fetching Gantt tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTaskTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }

    // Check if task exists (for Gantt, any user can update timeline)
    const checkQuery = 'SELECT id FROM tasks WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update only timeline fields
    const query = `
      UPDATE tasks
      SET start_date = $1, end_date = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, title, start_date, end_date, updated_at
    `;

    const values = [
      startDate || null,
      endDate || null,
      id
    ];

    const result = await pool.query(query, values);
    const task = result.rows[0];

    res.json({
      message: 'Task timeline updated successfully',
      task: {
        id: task.id,
        title: task.title,
        startDate: task.start_date,
        endDate: task.end_date,
        updatedAt: task.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating task timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTaskDependency = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, dependsOnTaskId, dependencyType = 'finish_to_start' } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!taskId || !dependsOnTaskId) {
      return res.status(400).json({ error: 'Both taskId and dependsOnTaskId are required' });
    }

    if (taskId === dependsOnTaskId) {
      return res.status(400).json({ error: 'Task cannot depend on itself' });
    }

    const validTypes = ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'];
    if (!validTypes.includes(dependencyType)) {
      return res.status(400).json({ error: 'Invalid dependency type' });
    }

    // Check if both tasks exist
    const tasksQuery = 'SELECT id FROM tasks WHERE id IN ($1, $2)';
    const tasksResult = await pool.query(tasksQuery, [taskId, dependsOnTaskId]);

    if (tasksResult.rows.length !== 2) {
      return res.status(404).json({ error: 'One or both tasks not found' });
    }

    // Check for circular dependencies
    const circularCheckQuery = `
      WITH RECURSIVE dep_chain AS (
        SELECT task_id, depends_on_task_id, 1 as level
        FROM task_dependencies 
        WHERE depends_on_task_id = $1
        
        UNION ALL
        
        SELECT td.task_id, td.depends_on_task_id, dc.level + 1
        FROM task_dependencies td
        JOIN dep_chain dc ON td.depends_on_task_id = dc.task_id
        WHERE dc.level < 10
      )
      SELECT task_id FROM dep_chain WHERE task_id = $2
    `;
    
    const circularResult = await pool.query(circularCheckQuery, [taskId, dependsOnTaskId]);
    if (circularResult.rows.length > 0) {
      return res.status(400).json({ error: 'This dependency would create a circular dependency' });
    }

    const query = `
      INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type)
      VALUES ($1, $2, $3)
      RETURNING id, task_id, depends_on_task_id, dependency_type, created_at, updated_at
    `;

    const values = [taskId, dependsOnTaskId, dependencyType];
    const result = await pool.query(query, values);
    const dependency = result.rows[0];

    res.status(201).json({
      message: 'Task dependency created successfully',
      dependency: {
        id: dependency.id,
        taskId: dependency.task_id,
        dependsOnTaskId: dependency.depends_on_task_id,
        dependencyType: dependency.dependency_type,
        createdAt: dependency.created_at,
        updatedAt: dependency.updated_at
      }
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Dependency already exists between these tasks' });
    }
    console.error('Error creating task dependency:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTaskDependency = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if dependency exists
    const checkQuery = 'SELECT id FROM task_dependencies WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    const query = 'DELETE FROM task_dependencies WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    res.json({ message: 'Task dependency deleted successfully' });
  } catch (error) {
    console.error('Error deleting task dependency:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};