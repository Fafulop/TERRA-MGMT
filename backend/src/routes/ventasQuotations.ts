import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
} from '../controllers/ventasQuotationsController';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getQuotations);
router.get('/:id', getQuotation);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

export default router;
