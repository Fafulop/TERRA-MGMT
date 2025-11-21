import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPedidos,
  getPedido,
  createPedido,
  updatePedidoStatus,
  deletePedido,
} from '../controllers/ventasPedidosController';
import {
  getAvailablePayments,
  getPedidoPayments,
  attachPayment,
  detachPayment,
  getPedidoPaymentSummary,
} from '../controllers/ventasPaymentsController';

const router = express.Router();

router.use(authenticateToken);

// Pedido routes
router.get('/', getPedidos);
router.get('/:id', getPedido);
router.post('/', createPedido);
router.patch('/:id/status', updatePedidoStatus);
router.delete('/:id', deletePedido);

// Payment routes
router.get('/payments/available', getAvailablePayments);
router.get('/:id/payments', getPedidoPayments);
router.get('/:id/payments/summary', getPedidoPaymentSummary);
router.post('/:id/payments', attachPayment);
router.delete('/payments/:id', detachPayment);

export default router;
