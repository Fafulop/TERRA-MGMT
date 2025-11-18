import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getTipos,
  createTipo,
  deleteTipo,
  getSizes,
  createSize,
  deleteSize,
  getCapacities,
  createCapacity,
  deleteCapacity,
  getEsmalteColors,
  createEsmalteColor,
  deleteEsmalteColor
} from '../controllers/produccionMasterDataController';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/produccionProductsController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Master Data Routes

// Tipo routes
router.get('/tipo', getTipos);
router.post('/tipo', createTipo);
router.delete('/tipo/:id', deleteTipo);

// Size routes
router.get('/size', getSizes);
router.post('/size', createSize);
router.delete('/size/:id', deleteSize);

// Capacity routes
router.get('/capacity', getCapacities);
router.post('/capacity', createCapacity);
router.delete('/capacity/:id', deleteCapacity);

// Esmalte Color routes
router.get('/esmalte-color', getEsmalteColors);
router.post('/esmalte-color', createEsmalteColor);
router.delete('/esmalte-color/:id', deleteEsmalteColor);

// Product Routes
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
