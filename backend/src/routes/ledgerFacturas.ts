import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getFacturasForEntry,
  createFactura,
  updateFactura,
  deleteFactura
} from '../controllers/ledgerFacturasController';

const router = express.Router();

// All factura routes require authentication
router.use(authenticateToken);

// GET /api/ledger-mxn/:entryId/facturas - Get all facturas for a ledger entry
router.get('/:entryId/facturas', getFacturasForEntry);

// POST /api/ledger-mxn/:entryId/facturas - Create a new factura for a ledger entry
router.post('/:entryId/facturas', createFactura);

// PUT /api/ledger-mxn/facturas/:id - Update a factura (owner only)
router.put('/facturas/:id', updateFactura);

// DELETE /api/ledger-mxn/facturas/:id - Delete a factura (owner only)
router.delete('/facturas/:id', deleteFactura);

export default router;
