import { Router } from 'express';
import { getRuta, getRutaAdmin } from '../controllers/ruta.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/requireAdmin.middleware';

const router = Router();

// GET /api/ruta -> Plan de mejora, acciones críticas y recomendaciones desde la API de Diagnóstico
router.get('/', authenticateToken, getRuta);

// GET /api/ruta/admin/:companyId -> [ADMIN] La misma Ruta, pero de cualquier empresa
router.get('/admin/:companyId', authenticateToken, requireAdmin, getRutaAdmin);

export default router;
