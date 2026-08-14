import { Router } from 'express';
import { register, login, changePassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/change-password', authenticateToken, changePassword);

export default router;