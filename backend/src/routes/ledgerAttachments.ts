import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAttachmentsForEntry,
  createAttachment,
  deleteAttachment
} from '../controllers/ledgerAttachmentsController';

const router = express.Router();

// All attachment routes require authentication
router.use(authenticateToken);

// GET /api/ledger-mxn/:entryId/attachments - Get all attachments for a ledger entry
router.get('/:entryId/attachments', getAttachmentsForEntry);

// POST /api/ledger-mxn/:entryId/attachments - Create a new attachment for a ledger entry
router.post('/:entryId/attachments', createAttachment);

// DELETE /api/ledger-mxn/attachments/:id - Delete an attachment (owner only)
router.delete('/attachments/:id', deleteAttachment);

export default router;
