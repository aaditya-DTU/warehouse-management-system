import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { login, getMe, changePassword } from '../controllers/authController.js';

const router = express.Router();


router.post('/login', login);


router.get('/me', authMiddleware, getMe);
router.post('/change-password', authMiddleware, changePassword);

export default router;
