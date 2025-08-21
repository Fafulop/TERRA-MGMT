import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCotizacionesEntries,
  getCotizacionesEntry,
  createCotizacionesEntry,
  updateCotizacionesEntry,
  deleteCotizacionesEntry,
  getCotizacionesSummary
} from '../controllers/cotizacionesController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/cotizaciones - Get all cotizaciones entries with filtering
router.get('/', getCotizacionesEntries);

// GET /api/cotizaciones/summary - Get cotizaciones summary data
router.get('/summary', getCotizacionesSummary);

// GET /api/cotizaciones/:id - Get a specific cotizaciones entry
router.get('/:id', getCotizacionesEntry);

// POST /api/cotizaciones - Create a new cotizaciones entry
router.post('/', createCotizacionesEntry);

// PUT /api/cotizaciones/:id - Update a cotizaciones entry
router.put('/:id', updateCotizacionesEntry);

// DELETE /api/cotizaciones/:id - Delete a cotizaciones entry
router.delete('/:id', deleteCotizacionesEntry);

export default router;