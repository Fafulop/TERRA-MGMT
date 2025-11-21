import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPedidoInventoryAvailability,
  allocateInventory,
  getPedidoAllocations,
  deallocateInventory,
} from '../controllers/ventasInventoryController';

const router = express.Router();

router.use(authenticateToken);

// Get available inventory for a pedido's items
router.get('/:id/inventory', getPedidoInventoryAvailability);

// Get allocations for a pedido
router.get('/:id/allocations', getPedidoAllocations);

// Allocate inventory to a pedido item
router.post('/allocations', allocateInventory);

// Remove an allocation
router.delete('/allocations/:id', deallocateInventory);

export default router;
