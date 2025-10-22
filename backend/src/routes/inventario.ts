import express from 'express';

// Items controllers
import {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  permanentlyDeleteItem,
  getItemHistory
} from '../controllers/inventarioItemsController';

// Counts controllers
import {
  getCurrentInventory,
  getCounts,
  createCount,
  createBatchCounts,
  updateCount,
  deleteCount,
  getCountsByDate,
  getCountsForDate
} from '../controllers/inventarioCountsController';

// Count Sessions controllers
import {
  getCountSessions,
  getCountSession,
  createCountSession,
  updateCountSession,
  completeCountSession,
  deleteCountSession
} from '../controllers/countSessionsController';

import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All inventario routes require authentication
router.use(authenticateToken);

// ============================================================
// DASHBOARD / CURRENT INVENTORY
// ============================================================
router.get('/current', getCurrentInventory); // GET /api/inventario/current

// ============================================================
// ITEMS CATALOG (Master Data)
// ============================================================
router.get('/items', getItems);                              // GET /api/inventario/items
router.get('/items/:id', getItem);                          // GET /api/inventario/items/:id
router.post('/items', createItem);                           // POST /api/inventario/items
router.put('/items/:id', updateItem);                       // PUT /api/inventario/items/:id
router.delete('/items/:id', deleteItem);                    // DELETE /api/inventario/items/:id (toggle status)
router.delete('/items/:id/permanent', permanentlyDeleteItem); // DELETE /api/inventario/items/:id/permanent (hard delete)
router.get('/items/:id/history', getItemHistory);           // GET /api/inventario/items/:id/history

// ============================================================
// INVENTORY COUNTS (Transactions)
// ============================================================
router.get('/counts', getCounts);                   // GET /api/inventario/counts
router.post('/counts', createCount);                // POST /api/inventario/counts
router.post('/counts/batch', createBatchCounts);    // POST /api/inventario/counts/batch
router.put('/counts/:id', updateCount);             // PUT /api/inventario/counts/:id
router.delete('/counts/:id', deleteCount);          // DELETE /api/inventario/counts/:id
router.get('/counts/by-date', getCountsByDate);     // GET /api/inventario/counts/by-date
router.get('/counts/for-date', getCountsForDate);   // GET /api/inventario/counts/for-date?date=YYYY-MM-DD

// ============================================================
// COUNT SESSIONS (Batch Counting)
// ============================================================
router.get('/sessions', getCountSessions);                  // GET /api/inventario/sessions
router.get('/sessions/:id', getCountSession);               // GET /api/inventario/sessions/:id
router.post('/sessions', createCountSession);               // POST /api/inventario/sessions
router.put('/sessions/:id', updateCountSession);            // PUT /api/inventario/sessions/:id
router.post('/sessions/:id/complete', completeCountSession); // POST /api/inventario/sessions/:id/complete
router.delete('/sessions/:id', deleteCountSession);         // DELETE /api/inventario/sessions/:id

export default router;
