import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAvailablePayments,
  getPedidoPayments,
  attachPayment,
  detachPayment,
  getPedidoPaymentSummary,
} from '../controllers/ecommercePaymentsController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get available payments (VENTAS ECOMMERCE income not attached to any pedido)
router.get('/available', getAvailablePayments);

// Get payments attached to a specific pedido
router.get('/:id/payments', getPedidoPayments);

// Get payment summary for a pedido
router.get('/:id/payments/summary', getPedidoPaymentSummary);

// Attach a payment to a pedido
router.post('/:id/payments', (req, res, next) => {
  // Add pedido_id from params to body for the controller
  req.body.pedido_id = parseInt(req.params.id);
  next();
}, attachPayment);

// Detach a payment from a pedido
router.delete('/payments/:id', detachPayment);

export default router;
