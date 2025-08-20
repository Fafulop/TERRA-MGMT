import express from 'express';
import { getTaskComments, createTaskComment, updateTaskComment, deleteTaskComment } from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All comment routes require authentication
router.use(authenticateToken);

// GET /api/tasks/:taskId/comments - Get all comments for a task
router.get('/:taskId/comments', getTaskComments);

// POST /api/tasks/:taskId/comments - Create a new comment for a task
router.post('/:taskId/comments', createTaskComment);

// PUT /api/tasks/:taskId/comments/:commentId - Update a specific comment
router.put('/:taskId/comments/:commentId', updateTaskComment);

// DELETE /api/tasks/:taskId/comments/:commentId - Delete a specific comment
router.delete('/:taskId/comments/:commentId', deleteTaskComment);

export default router;