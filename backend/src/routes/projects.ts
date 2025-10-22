import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectTasks,
  addTaskToProject,
  updateProjectTask,
  removeTaskFromProject
} from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Project-Task relationships
router.get('/:id/tasks', getProjectTasks);
router.post('/:id/tasks', addTaskToProject);
router.put('/:id/tasks/:taskId', updateProjectTask);
router.delete('/:id/tasks/:taskId', removeTaskFromProject);

export default router;
