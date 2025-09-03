import express from 'express';
import { 
  getSubtasksByTaskId, 
  createSubtask, 
  updateSubtask, 
  deleteSubtask 
} from '../controllers/subtaskController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All subtask routes require authentication
router.use(authenticateToken);

/**
 * Subtask Routes
 * These routes handle subtask management for Gantt chart tasks
 */

// GET /api/subtasks/task/:taskId - Get all subtasks for a specific task
router.get('/task/:taskId', getSubtasksByTaskId);

// POST /api/subtasks - Create a new subtask
router.post('/', createSubtask);

// PUT /api/subtasks/:id - Update a subtask
router.put('/:id', updateSubtask);

// DELETE /api/subtasks/:id - Delete a subtask
router.delete('/:id', deleteSubtask);

export default router;