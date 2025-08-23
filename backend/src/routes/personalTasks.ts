import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createPersonalTask,
  getPersonalTasks,
  getPersonalTaskById,
  updatePersonalTask,
  deletePersonalTask,
  getPersonalTasksStats
} from '../controllers/personalTasksController';

const router = express.Router();

// All personal tasks routes require authentication
router.use(authenticateToken);

// Personal tasks CRUD routes
router.post('/', createPersonalTask);
router.get('/', getPersonalTasks);
router.get('/stats', getPersonalTasksStats);
router.get('/:id', getPersonalTaskById);
router.put('/:id', updatePersonalTask);
router.delete('/:id', deletePersonalTask);

export default router;