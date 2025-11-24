import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPedidoInventoryAvailability,
  allocateInventory,
  getPedidoAllocations,
  deallocateInventory,
  getPedidoEmbalajeAvailability,
  allocateEmbalajeInventory,
  getPedidoEmbalajeAllocations,
  deallocateEmbalajeInventory,
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

// ========== EMBALAJE ALLOCATION ROUTES ==========

// Get available embalaje inventory for a pedido's items
router.get('/:id/embalaje-inventory', getPedidoEmbalajeAvailability);

// Get embalaje allocations for a pedido
router.get('/:id/embalaje-allocations', getPedidoEmbalajeAllocations);

// Allocate embalaje inventory to a pedido item
router.post('/embalaje-allocations', allocateEmbalajeInventory);

// Remove an embalaje allocation
router.delete('/embalaje-allocations/:id', deallocateEmbalajeInventory);

export default router;
