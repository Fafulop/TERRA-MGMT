import express from 'express';
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All task routes require authentication
router.use(authenticateToken);

// POST /api/tasks - Create a new task
router.post('/', createTask);

// GET /api/tasks - Get all tasks
router.get('/', getTasks);

// GET /api/tasks/:id - Get a specific task by ID
router.get('/:id', getTaskById);

// PUT /api/tasks/:id - Update a specific task
router.put('/:id', updateTask);

// DELETE /api/tasks/:id - Delete a specific task
router.delete('/:id', deleteTask);

export default router;