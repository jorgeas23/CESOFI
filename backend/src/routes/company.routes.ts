import { Router } from 'express';
import { getCompanyProfile, updateCompanyProfile } from '../controllers/company.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Endpoints protegidos para consultar y actualizar la empresa del usuario autenticado
router.get('/me', authenticateToken, getCompanyProfile);
router.put('/me', authenticateToken, updateCompanyProfile);

export default router;