import express from 'express';
import {
  getEmbalajeInventory,
  getEmbalajeMovements,
  addEmbalajeInventory,
  removeEmbalajeInventory,
  adjustEmbalajeInventory,
} from '../controllers/embalajeInventoryController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/inventory', getEmbalajeInventory);
router.get('/inventory/movements', getEmbalajeMovements);

// POST routes for inventory operations
router.post('/inventory/add', addEmbalajeInventory);
router.post('/inventory/remove', removeEmbalajeInventory);
router.post('/inventory/adjust', adjustEmbalajeInventory);

export default router;
