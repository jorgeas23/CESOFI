import { Router } from 'express';
import { getRuta } from '../controllers/ruta.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/ruta -> Plan de mejora, acciones críticas y recomendaciones desde la API de Diagnóstico
router.get('/', authenticateToken, getRuta);

export default router;
