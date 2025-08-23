import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getMxnLedgerEntries,
  getMxnLedgerEntry,
  createMxnLedgerEntry,
  updateMxnLedgerEntry,
  deleteMxnLedgerEntry,
  getMxnLedgerSummary,
  markMxnAsRealized
} from '../controllers/ledgerMxnController';

const router = express.Router();

// All MXN ledger routes require authentication
router.use(authenticateToken);

// GET /api/ledger-mxn - Get all MXN ledger entries for user with filtering and pagination
router.get('/', getMxnLedgerEntries);

// GET /api/ledger-mxn/summary - Get MXN ledger summary/dashboard data
router.get('/summary', getMxnLedgerSummary);

// GET /api/ledger-mxn/:id - Get a specific MXN ledger entry with attachments
router.get('/:id', getMxnLedgerEntry);

// POST /api/ledger-mxn - Create a new MXN ledger entry
router.post('/', createMxnLedgerEntry);

// PUT /api/ledger-mxn/:id - Update a MXN ledger entry
router.put('/:id', updateMxnLedgerEntry);

// DELETE /api/ledger-mxn/:id - Delete a MXN ledger entry
router.delete('/:id', deleteMxnLedgerEntry);

// PUT /api/ledger-mxn/:id/realize - Mark a por_realizar MXN entry as realized
router.put('/:id/realize', markMxnAsRealized);

export default router;