import express from 'express';
import { register, login, getCurrentUser, registerValidation, loginValidation } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticateToken, getCurrentUser);

export default router;