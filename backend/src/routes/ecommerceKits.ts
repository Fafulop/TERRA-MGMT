import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getKits,
  getKit,
  createKit,
  updateKit,
  deleteKit,
  adjustKitStock,
  getAvailableInventoryForKits,
} from '../controllers/ecommerceKitsController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Kit CRUD routes
router.get('/', getKits);
router.get('/inventory/available', getAvailableInventoryForKits);
router.get('/:id', getKit);
router.post('/', createKit);
router.put('/:id', updateKit);
router.delete('/:id', deleteKit);

// Stock management
router.post('/:id/stock', adjustKitStock);

export default router;
