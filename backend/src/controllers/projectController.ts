import { Request, Response } from 'express';
import pool from '../config/database';

interface AuthRequest extends Request {
  userId?: number;
}

// Create a new project
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, description, area, subarea, visibility = 'shared', status = 'planning' } = req.body;

    if (!name || !area) {
      return res.status(400).json({ error: 'Name and area are required' });
    }

    const result = await pool.query(
      `INSERT INTO projects (name, description, area, subarea, user_id, visibility, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, area, subarea, userId, visibility, status]
    );

    // Get user information
    const projectWithUser = await pool.query(
      `SELECT p.*, u.username, u.first_name, u.last_name
       FROM projects p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(projectWithUser.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// Get all projects (user's own + shared visible to all)
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { area, subarea, status, visibility } = req.query;

    let query = `
      SELECT
        p.*,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT pt.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN pt.id END) as completed_task_count,
        MIN(pt.start_date) as calculated_start_date,
        MAX(pt.end_date) as calculated_end_date
      FROM projects p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN project_tasks pt ON p.id = pt.project_id
      LEFT JOIN tasks t ON pt.task_id = t.id
      WHERE (p.visibility = 'shared' OR p.user_id = $1)
    `;

    const params: any[] = [userId];
    let paramCount = 1;

    if (area) {
      paramCount++;
      query += ` AND p.area = $${paramCount}`;
      params.push(area);
    }

    if (subarea) {
      paramCount++;
      query += ` AND p.subarea = $${paramCount}`;
      params.push(subarea);
    }

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (visibility) {
      paramCount++;
      query += ` AND p.visibility = $${paramCount}`;
      params.push(visibility);
    }

    query += `
      GROUP BY p.id, u.username, u.first_name, u.last_name
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, params);

    // Calculate progress percentage for each project
    const projects = result.rows.map(project => {
      const taskCount = parseInt(project.task_count) || 0;
      const completedCount = parseInt(project.completed_task_count) || 0;
      const progressPercentage = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

      return {
        ...project,
        task_count: taskCount,
        completed_task_count: completedCount,
        progress_percentage: progressPercentage,
        // Use calculated dates if project dates are null
        start_date: project.start_date || project.calculated_start_date,
        end_date: project.end_date || project.calculated_end_date
      };
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// Get single project by ID with tasks
export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Get project with user info
    const projectResult = await pool.query(
      `SELECT p.*, u.username, u.first_name, u.last_name
       FROM projects p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND (p.visibility = 'shared' OR p.user_id = $2)`,
      [id, userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    const project = projectResult.rows[0];

    // Get all tasks in project with details
    const tasksResult = await pool.query(
      `SELECT
        pt.*,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.area as task_area,
        t.subarea as task_subarea,
        t.due_date,
        tu.username as task_username,
        tu.first_name as task_first_name,
        tu.last_name as task_last_name,
        au.username as added_by_username
       FROM project_tasks pt
       JOIN tasks t ON pt.task_id = t.id
       JOIN users tu ON t.user_id = tu.id
       LEFT JOIN users au ON pt.added_by = au.id
       WHERE pt.project_id = $1
       ORDER BY pt.display_order, pt.start_date`,
      [id]
    );

    // Calculate progress
    const taskCount = tasksResult.rows.length;
    const completedCount = tasksResult.rows.filter(t => t.status === 'completed').length;
    const progressPercentage = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

    res.json({
      ...project,
      tasks: tasksResult.rows,
      task_count: taskCount,
      completed_task_count: completedCount,
      progress_percentage: progressPercentage
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// Update project
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, description, area, subarea, visibility, status, start_date, end_date } = req.body;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           area = COALESCE($3, area),
           subarea = COALESCE($4, subarea),
           visibility = COALESCE($5, visibility),
           status = COALESCE($6, status),
           start_date = COALESCE($7, start_date),
           end_date = COALESCE($8, end_date)
       WHERE id = $9
       RETURNING *`,
      [name, description, area, subarea, visibility, status, start_date, end_date, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// Delete project
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }

    await pool.query('DELETE FROM projects WHERE id = $1', [id]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// Get tasks in a project
export const getProjectTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check project access
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND (visibility = \'shared\' OR user_id = $2)',
      [id, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    const result = await pool.query(
      `SELECT
        pt.*,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.area,
        t.subarea,
        t.due_date,
        t.user_id as task_user_id,
        u.username,
        u.first_name,
        u.last_name
       FROM project_tasks pt
       JOIN tasks t ON pt.task_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE pt.project_id = $1
       ORDER BY pt.display_order, pt.start_date`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch project tasks' });
  }
};

// Add task to project
export const addTaskToProject = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.userId;
    const { id: projectId } = req.params;
    const { taskId, createTask, start_date, end_date, display_order = 0 } = req.body;

    if (!start_date || !end_date) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Check project access and ownership
    const projectCheck = await client.query(
      'SELECT user_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    let finalTaskId = taskId;

    // Option B: Create new task on-the-fly
    if (createTask && !taskId) {
      const { title, description, priority = 'medium', area, subarea } = createTask;

      if (!title || !area || !subarea) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Task title, area, and subarea are required' });
      }

      const newTaskResult = await client.query(
        `INSERT INTO tasks (title, description, priority, area, subarea, user_id, status, start_date, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
         RETURNING id`,
        [title, description, priority, area, subarea, userId, start_date, end_date]
      );

      finalTaskId = newTaskResult.rows[0].id;
    }

    if (!finalTaskId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Either taskId or createTask must be provided' });
    }

    // Check if task already in project
    const existingCheck = await client.query(
      'SELECT id FROM project_tasks WHERE project_id = $1 AND task_id = $2',
      [projectId, finalTaskId]
    );

    if (existingCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Task already in project' });
    }

    // Add task to project
    const result = await client.query(
      `INSERT INTO project_tasks (project_id, task_id, start_date, end_date, display_order, added_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [projectId, finalTaskId, start_date, end_date, display_order, userId]
    );

    // Update project date range if needed
    await client.query(
      `UPDATE projects
       SET start_date = LEAST(COALESCE(start_date, $2::timestamp), $2::timestamp),
           end_date = GREATEST(COALESCE(end_date, $3::timestamp), $3::timestamp)
       WHERE id = $1`,
      [projectId, start_date, end_date]
    );

    await client.query('COMMIT');

    // Fetch complete task details
    const taskDetails = await pool.query(
      `SELECT
        pt.*,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.area,
        t.subarea,
        u.username,
        u.first_name,
        u.last_name
       FROM project_tasks pt
       JOIN tasks t ON pt.task_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE pt.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(taskDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add task to project error:', error);
    res.status(500).json({ error: 'Failed to add task to project' });
  } finally {
    client.release();
  }
};

// Update project task (dates, status, order)
export const updateProjectTask = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.userId;
    const { id: projectId, taskId } = req.params;
    const { start_date, end_date, status, display_order } = req.body;

    // Check project ownership
    const projectCheck = await client.query(
      'SELECT user_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update project_tasks dates/order
    if (start_date || end_date || display_order !== undefined) {
      await client.query(
        `UPDATE project_tasks
         SET start_date = COALESCE($1, start_date),
             end_date = COALESCE($2, end_date),
             display_order = COALESCE($3, display_order)
         WHERE project_id = $4 AND task_id = $5`,
        [start_date, end_date, display_order, projectId, taskId]
      );

      // Recalculate project date range
      if (start_date || end_date) {
        await client.query(
          `UPDATE projects
           SET start_date = (SELECT MIN(start_date) FROM project_tasks WHERE project_id = $1),
               end_date = (SELECT MAX(end_date) FROM project_tasks WHERE project_id = $1)
           WHERE id = $1`,
          [projectId]
        );
      }
    }

    // Update task status if provided (syncs to tasks table)
    if (status) {
      await client.query(
        'UPDATE tasks SET status = $1 WHERE id = $2',
        [status, taskId]
      );
    }

    // Update task start_date and due_date to match project task dates
    if (start_date || end_date) {
      await client.query(
        `UPDATE tasks
         SET start_date = COALESCE($1, start_date),
             due_date = COALESCE($2, due_date)
         WHERE id = $3`,
        [start_date, end_date, taskId]
      );
    }

    await client.query('COMMIT');

    // Fetch updated task
    const result = await pool.query(
      `SELECT
        pt.*,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.area,
        t.subarea,
        u.username,
        u.first_name,
        u.last_name
       FROM project_tasks pt
       JOIN tasks t ON pt.task_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE pt.project_id = $1 AND pt.task_id = $2`,
      [projectId, taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found in project' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update project task error:', error);
    res.status(500).json({ error: 'Failed to update project task' });
  } finally {
    client.release();
  }
};

// Remove task from project
export const removeTaskFromProject = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.userId;
    const { id: projectId, taskId } = req.params;

    // Check project ownership
    const projectCheck = await client.query(
      'SELECT user_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    if (projectCheck.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to modify this project' });
    }

    // Remove task from project (doesn't delete task itself)
    const result = await client.query(
      'DELETE FROM project_tasks WHERE project_id = $1 AND task_id = $2 RETURNING *',
      [projectId, taskId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not found in project' });
    }

    // Recalculate project date range
    await client.query(
      `UPDATE projects
       SET start_date = (SELECT MIN(start_date) FROM project_tasks WHERE project_id = $1),
           end_date = (SELECT MAX(end_date) FROM project_tasks WHERE project_id = $1)
       WHERE id = $1`,
      [projectId]
    );

    await client.query('COMMIT');

    res.json({ message: 'Task removed from project successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Remove task from project error:', error);
    res.status(500).json({ error: 'Failed to remove task from project' });
  } finally {
    client.release();
  }
};
