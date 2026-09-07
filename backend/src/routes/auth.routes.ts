import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, registerByFolio, login, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate';
import {
  registerSchema,
  registerByFolioSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

// Límite estricto para frenar intentos de fuerza bruta contra login/registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/register-folio', authLimiter, validateBody(registerByFolioSchema), registerByFolio);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.put('/change-password', authenticateToken, validateBody(changePasswordSchema), changePassword);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPassword);

export default router;
