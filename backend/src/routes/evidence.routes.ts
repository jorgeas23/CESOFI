import { Router } from 'express';
import { getEvidences, createEvidence } from '../controllers/evidence.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// GET  /api/evidence  -> Obtener lista de evidencias protegida por token
router.get('/', authenticateToken, getEvidences);

// POST /api/evidence  -> Registrar una nueva evidencia
router.post('/', authenticateToken, createEvidence);

export default router;