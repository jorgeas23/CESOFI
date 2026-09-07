import { Router } from 'express';
import { getCompanyProfile, updateCompanyProfile, listCompaniesForAdmin } from '../controllers/company.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/requireAdmin.middleware';
import { validateBody } from '../middlewares/validate';
import { updateCompanySchema } from '../schemas/company.schema';

const router = Router();

// Endpoints protegidos para consultar y actualizar la empresa del usuario autenticado
router.get('/me', authenticateToken, getCompanyProfile);
router.put('/me', authenticateToken, validateBody(updateCompanySchema), updateCompanyProfile);

// GET /api/company/admin -> [ADMIN] Directorio completo de empresarios registrados
router.get('/admin', authenticateToken, requireAdmin, listCompaniesForAdmin);

export default router;
