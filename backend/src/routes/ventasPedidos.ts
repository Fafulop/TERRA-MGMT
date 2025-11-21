import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPedidos,
  getPedido,
  createPedido,
  updatePedidoStatus,
  deletePedido,
} from '../controllers/ventasPedidosController';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getPedidos);
router.get('/:id', getPedido);
router.post('/', createPedido);
router.patch('/:id/status', updatePedidoStatus);
router.delete('/:id', deletePedido);

export default router;
