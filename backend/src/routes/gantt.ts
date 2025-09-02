import express from 'express';
import { 
  getGanttTasks, 
  updateTaskTimeline, 
  createTaskDependency, 
  deleteTaskDependency 
} from '../controllers/ganttController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All Gantt routes require authentication
router.use(authenticateToken);

/**
 * Gantt Chart Routes
 * These routes handle global project management where any user can view/edit any task
 */

// GET /api/gantt/tasks - Get all tasks with timeline and dependencies for Gantt chart
router.get('/tasks', getGanttTasks);

// PUT /api/gantt/tasks/:id/timeline - Update task timeline (start/end dates)
router.put('/tasks/:id/timeline', updateTaskTimeline);

// POST /api/gantt/dependencies - Create a new task dependency
router.post('/dependencies', createTaskDependency);

// DELETE /api/gantt/dependencies/:id - Delete a task dependency
router.delete('/dependencies/:id', deleteTaskDependency);

export default router;