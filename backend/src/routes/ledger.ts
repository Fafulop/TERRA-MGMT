import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getLedgerEntries,
  getLedgerEntry,
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  getLedgerSummary,
  markAsRealized
} from '../controllers/ledgerController';

const router = express.Router();

// All ledger routes require authentication
router.use(authenticateToken);

// GET /api/ledger - Get all ledger entries for user with filtering and pagination
router.get('/', getLedgerEntries);

// GET /api/ledger/summary - Get ledger summary/dashboard data
router.get('/summary', getLedgerSummary);

// GET /api/ledger/:id - Get a specific ledger entry with attachments
router.get('/:id', getLedgerEntry);

// POST /api/ledger - Create a new ledger entry
router.post('/', createLedgerEntry);

// PUT /api/ledger/:id - Update a ledger entry
router.put('/:id', updateLedgerEntry);

// DELETE /api/ledger/:id - Delete a ledger entry
router.delete('/:id', deleteLedgerEntry);

// PUT /api/ledger/:id/realize - Mark a por_realizar entry as realized
router.put('/:id/realize', markAsRealized);

export default router;