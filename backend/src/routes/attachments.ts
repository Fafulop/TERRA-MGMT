import express from 'express';
import { 
  getTaskAttachments, 
  getCommentAttachments, 
  createTaskAttachment, 
  createCommentAttachment, 
  deleteAttachment 
} from '../controllers/attachmentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All attachment routes require authentication
router.use(authenticateToken);

// GET /api/tasks/:taskId/attachments - Get all attachments for a task
router.get('/tasks/:taskId/attachments', getTaskAttachments);

// POST /api/tasks/:taskId/attachments - Create a new attachment for a task
router.post('/tasks/:taskId/attachments', createTaskAttachment);

// GET /api/comments/:commentId/attachments - Get all attachments for a comment
router.get('/comments/:commentId/attachments', getCommentAttachments);

// POST /api/comments/:commentId/attachments - Create a new attachment for a comment
router.post('/comments/:commentId/attachments', createCommentAttachment);

// DELETE /api/attachments/:attachmentId - Delete a specific attachment
router.delete('/attachments/:attachmentId', deleteAttachment);

export default router;