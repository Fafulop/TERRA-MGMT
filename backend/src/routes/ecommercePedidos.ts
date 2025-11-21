import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPedidos,
  getPedido,
  createPedido,
  updatePedidoStatus,
  updatePedido,
  deletePedido,
} from '../controllers/ecommercePedidosController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Pedido CRUD routes
router.get('/', getPedidos);
router.get('/:id', getPedido);
router.post('/', createPedido);
router.put('/:id', updatePedido);
router.patch('/:id/status', updatePedidoStatus);
router.delete('/:id', deletePedido);

export default router;
