import { Request, Response } from 'express';
import pool from '../config/database';
import { checkSubtaskColumnsExist, handleDatabaseError, AppError, setDatabasePool } from '../utils/dbUtils';
import { 
  buildSubtaskSelectQuery, 
  buildSubtaskInsertQuery, 
  buildSubtaskUpdateQuery,
  SubtaskColumnStatus 
} from '../utils/subtaskQueryBuilder';

// Set the database pool for the utilities
setDatabasePool(pool);

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export interface Subtask {
  id: number;
  taskId: number;
  name: string;
  description?: string;
  status: 'pending' | 'completed';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Get all subtasks for a specific task
export const getSubtasksByTaskId = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    
    // Check if required columns exist using centralized utility
    const columnStatus = await checkSubtaskColumnsExist();
    
    // Build query using standardized query builder
    const query = `${buildSubtaskSelectQuery(columnStatus)} 
                   WHERE task_id = $1 
                   ORDER BY created_at ASC`;
    
    const result = await pool.query(query, [taskId]);

    const subtasks = result.rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      name: row.name,
      description: row.description,
      status: columnStatus.status ? (row.status || 'pending') : 'pending',
      assignee: row.assignee,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      referenceName: row.reference_name,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ subtasks });
  } catch (error) {
    handleDatabaseError(error, 'fetch subtasks');
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
};

// Get subtasks for multiple tasks in batch (optimizes N+1 query problem)
export const getBatchSubtasks = async (req: AuthRequest, res: Response) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required and must contain at least one task ID' });
    }

    if (taskIds.length > 100) {
      return res.status(400).json({ error: 'Cannot fetch subtasks for more than 100 tasks at once' });
    }

    // Check if required columns exist using centralized utility
    const columnStatus = await checkSubtaskColumnsExist();

    // Build query with IN clause for efficient batch fetching
    const placeholders = taskIds.map((_, index) => `$${index + 1}`).join(', ');
    const query = `${buildSubtaskSelectQuery(columnStatus)} 
                   WHERE task_id IN (${placeholders})
                   ORDER BY task_id, created_at ASC`;

    const result = await pool.query(query, taskIds);

    // Group subtasks by task ID
    const subtasksByTask: Record<number, any[]> = {};
    
    // Initialize empty arrays for all requested task IDs
    taskIds.forEach(taskId => {
      subtasksByTask[taskId] = [];
    });

    // Group the results by task ID
    result.rows.forEach(row => {
      const subtask = {
        id: row.id,
        taskId: row.task_id,
        name: row.name,
        description: row.description,
        status: columnStatus.status ? (row.status || 'pending') : 'pending',
        assignee: row.assignee,
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        referenceName: row.reference_name,
        startDate: row.start_date,
        endDate: row.end_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      subtasksByTask[row.task_id].push(subtask);
    });

    res.json({ subtasksByTask });
  } catch (error) {
    handleDatabaseError(error, 'batch fetch subtasks');
    res.status(500).json({ error: 'Failed to fetch batch subtasks' });
  }
};

// Create a new subtask
export const createSubtask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, name, description, status = 'pending', assignee, referenceType, referenceId, referenceName, startDate, endDate } = req.body;

    if (!taskId || !name) {
      return res.status(400).json({ error: 'Task ID and name are required' });
    }

    // Verify the parent task exists and get its date boundaries
    const taskCheck = await pool.query(
      'SELECT id, start_date, end_date FROM tasks WHERE id = $1', 
      [taskId]
    );
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Parent task not found' });
    }

    const parentTask = taskCheck.rows[0];
    const parentStartDate = parentTask.start_date ? new Date(parentTask.start_date) : null;
    const parentEndDate = parentTask.end_date ? new Date(parentTask.end_date) : null;

    // Validate subtask dates against each other
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'Subtask start date cannot be after end date' });
    }

    // Only validate against parent boundaries if parent has both dates
    if (parentStartDate && parentEndDate) {
      // Validate subtask dates against parent task boundaries
      if (startDate && new Date(startDate) < parentStartDate) {
        return res.status(400).json({ 
          error: `Subtask start date cannot be earlier than parent task start date (${parentStartDate.toLocaleDateString()})` 
        });
      }

      if (endDate && new Date(endDate) > parentEndDate) {
        return res.status(400).json({ 
          error: `Subtask end date cannot be later than parent task end date (${parentEndDate.toLocaleDateString()})` 
        });
      }

      if (startDate && new Date(startDate) > parentEndDate) {
        return res.status(400).json({ 
          error: `Subtask start date cannot be later than parent task end date (${parentEndDate.toLocaleDateString()})` 
        });
      }

      if (endDate && new Date(endDate) < parentStartDate) {
        return res.status(400).json({ 
          error: `Subtask end date cannot be earlier than parent task start date (${parentStartDate.toLocaleDateString()})` 
        });
      }
    }

    // Check if status column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subtasks' AND column_name = 'status'
    `);
    
    const hasStatusColumn = columnCheck.rows.length > 0;

    const insertQuery = hasStatusColumn ?
      `INSERT INTO subtasks (task_id, name, description, status, assignee, reference_type, reference_id, reference_name, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, task_id, name, description, status, assignee, reference_type, reference_id, reference_name, start_date, end_date, created_at, updated_at` :
      `INSERT INTO subtasks (task_id, name, description, assignee, reference_type, reference_id, reference_name, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, task_id, name, description, assignee, reference_type, reference_id, reference_name, start_date, end_date, created_at, updated_at`;

    const insertParams = hasStatusColumn ?
      [taskId, name, description || null, status, assignee || null, referenceType || null, referenceId || null, referenceName || null, startDate || null, endDate || null] :
      [taskId, name, description || null, assignee || null, referenceType || null, referenceId || null, referenceName || null, startDate || null, endDate || null];

    const result = await pool.query(insertQuery, insertParams);

    const subtask = {
      id: result.rows[0].id,
      taskId: result.rows[0].task_id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      status: hasStatusColumn ? (result.rows[0].status || 'pending') : 'pending',
      assignee: result.rows[0].assignee,
      referenceType: result.rows[0].reference_type,
      referenceId: result.rows[0].reference_id,
      referenceName: result.rows[0].reference_name,
      startDate: result.rows[0].start_date,
      endDate: result.rows[0].end_date,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    res.status(201).json({ message: 'Subtask created successfully', subtask });
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
};

// Update a subtask
export const updateSubtask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, assignee, referenceType, referenceId, referenceName, startDate, endDate } = req.body;

    // Get the subtask and its parent task
    const subtaskCheck = await pool.query(
      'SELECT task_id FROM subtasks WHERE id = $1', 
      [id]
    );
    if (subtaskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const taskId = subtaskCheck.rows[0].task_id;
    const parentTaskResult = await pool.query(
      'SELECT start_date, end_date FROM tasks WHERE id = $1', 
      [taskId]
    );
    
    if (parentTaskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent task not found' });
    }

    const parentTask = parentTaskResult.rows[0];
    const parentStartDate = parentTask.start_date ? new Date(parentTask.start_date) : null;
    const parentEndDate = parentTask.end_date ? new Date(parentTask.end_date) : null;

    // Validate subtask dates against each other
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'Subtask start date cannot be after end date' });
    }

    // Only validate against parent boundaries if parent has both dates
    if (parentStartDate && parentEndDate) {
      // Validate subtask dates against parent task boundaries
      if (startDate && new Date(startDate) < parentStartDate) {
        return res.status(400).json({ 
          error: `Subtask start date cannot be earlier than parent task start date (${parentStartDate.toLocaleDateString()})` 
        });
      }

      if (endDate && new Date(endDate) > parentEndDate) {
        return res.status(400).json({ 
          error: `Subtask end date cannot be later than parent task end date (${parentEndDate.toLocaleDateString()})` 
        });
      }

      if (startDate && new Date(startDate) > parentEndDate) {
        return res.status(400).json({ 
          error: `Subtask start date cannot be later than parent task end date (${parentEndDate.toLocaleDateString()})` 
        });
      }

      if (endDate && new Date(endDate) < parentStartDate) {
        return res.status(400).json({ 
          error: `Subtask end date cannot be earlier than parent task start date (${parentStartDate.toLocaleDateString()})` 
        });
      }
    }

    // Check if status column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subtasks' AND column_name = 'status'
    `);
    
    const hasStatusColumn = columnCheck.rows.length > 0;

    const updateQuery = hasStatusColumn ?
      `UPDATE subtasks 
       SET name = $1, description = $2, status = $3, assignee = $4, reference_type = $5, reference_id = $6, reference_name = $7, start_date = $8, end_date = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING id, task_id, name, description, status, assignee, reference_type, reference_id, reference_name, start_date, end_date, created_at, updated_at` :
      `UPDATE subtasks 
       SET name = $1, description = $2, assignee = $3, reference_type = $4, reference_id = $5, reference_name = $6, start_date = $7, end_date = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING id, task_id, name, description, assignee, reference_type, reference_id, reference_name, start_date, end_date, created_at, updated_at`;

    const updateParams = hasStatusColumn ?
      [name, description || null, status, assignee || null, referenceType || null, referenceId || null, referenceName || null, startDate || null, endDate || null, id] :
      [name, description || null, assignee || null, referenceType || null, referenceId || null, referenceName || null, startDate || null, endDate || null, id];

    const result = await pool.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const subtask = {
      id: result.rows[0].id,
      taskId: result.rows[0].task_id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      status: hasStatusColumn ? (result.rows[0].status || 'pending') : 'pending',
      assignee: result.rows[0].assignee,
      referenceType: result.rows[0].reference_type,
      referenceId: result.rows[0].reference_id,
      referenceName: result.rows[0].reference_name,
      startDate: result.rows[0].start_date,
      endDate: result.rows[0].end_date,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };

    res.json({ message: 'Subtask updated successfully', subtask });
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ error: 'Failed to update subtask' });
  }
};

// Delete a subtask
export const deleteSubtask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM subtasks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    res.json({ message: 'Subtask deleted successfully' });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
};

// Get all tasks and subtasks for reference dropdown
export const getTasksAndSubtasksForReference = async (req: AuthRequest, res: Response) => {
  try {
    // Get all tasks
    const tasksQuery = `
      SELECT 
        id,
        title as name,
        'task' as type
      FROM tasks 
      ORDER BY title ASC
    `;
    
    // Get all subtasks
    const subtasksQuery = `
      SELECT 
        s.id,
        s.name,
        'subtask' as type,
        t.title as parent_task_name
      FROM subtasks s
      JOIN tasks t ON s.task_id = t.id
      ORDER BY t.title ASC, s.name ASC
    `;

    const [tasksResult, subtasksResult] = await Promise.all([
      pool.query(tasksQuery),
      pool.query(subtasksQuery)
    ]);

    // Combine and format the results
    const references = [
      ...tasksResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        displayName: `Task: ${row.name}`
      })),
      ...subtasksResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        parentTaskName: row.parent_task_name,
        displayName: `Subtask: ${row.name} (${row.parent_task_name})`
      }))
    ];

    res.json({ references });
  } catch (error) {
    console.error('Error fetching tasks and subtasks for reference:', error);
    res.status(500).json({ error: 'Failed to fetch reference data' });
  }
};