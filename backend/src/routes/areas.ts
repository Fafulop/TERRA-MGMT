import express from 'express';
import areasController from '../controllers/areasController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All areas routes require authentication
router.use(authenticateToken);

// Areas routes
router.get('/', areasController.getAreas);
router.get('/:id', areasController.getAreaById);
router.post('/', areasController.createArea);
router.put('/:id', areasController.updateArea);
router.delete('/:id', areasController.deleteArea);

// Subareas routes
router.post('/subareas', areasController.createSubarea);
router.put('/subareas/:id', areasController.updateSubarea);
router.delete('/subareas/:id', areasController.deleteSubarea);

export default router;