import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  updateQuoteStatus,
  getQuotesSummary
} from '../controllers/ventasQuotesController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all quotes with filters
router.get('/', getQuotes);

// Get quotes summary/statistics
router.get('/summary', getQuotesSummary);

// Get single quote
router.get('/:id', getQuote);

// Create new quote
router.post('/', createQuote);

// Update quote
router.put('/:id', updateQuote);

// Update quote status
router.put('/:id/status', updateQuoteStatus);

// Delete quote
router.delete('/:id', deleteQuote);

export default router;
