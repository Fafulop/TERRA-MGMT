import express from 'express';
import { authenticateToken } from '../middleware/auth';

// Import controllers
import {
  getAllProducts,
  createProduct,
  updateProduct,
  getAllColors,
  createColor,
  updateColor
} from '../controllers/ceramicsMasterDataController';

import {
  getAllItemCategories,
  createItemCategory,
  updateItemCategory,
  deleteItemCategory
} from '../controllers/itemCategoriesController';

const router = express.Router();

// ============================================================
// MASTER DATA ROUTES - ITEM CATEGORIES
// ============================================================

// Item Categories (Product Types: PLATO, VASO, TAZA, etc.)
router.get('/item-categories', authenticateToken, getAllItemCategories);
router.post('/item-categories', authenticateToken, createItemCategory);
router.put('/item-categories/:id', authenticateToken, updateItemCategory);
router.delete('/item-categories/:id', authenticateToken, deleteItemCategory);

// ============================================================
// MASTER DATA ROUTES - PRODUCTS
// ============================================================

// Products (ceramic items with single concepto and optional color)
router.get('/products', authenticateToken, getAllProducts);
router.post('/products', authenticateToken, createProduct);
router.put('/products/:id', authenticateToken, updateProduct);

// ============================================================
// MASTER DATA ROUTES - ENAMEL COLORS
// ============================================================

// Enamel Colors (required for ESMALTADO products)
router.get('/colors', authenticateToken, getAllColors);
router.post('/colors', authenticateToken, createColor);
router.put('/colors/:id', authenticateToken, updateColor);

export default router;
