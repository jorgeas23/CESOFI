import { Router } from 'express';
import {
  createSupportMessage,
  getMySupportMessages,
  listSupportMessagesForAdmin,
  replySupportMessage,
} from '../controllers/support.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/requireAdmin.middleware';
import { validateBody } from '../middlewares/validate';
import { createSupportMessageSchema, replySupportMessageSchema } from '../schemas/support.schema';

const router = Router();

// POST /api/support       -> El empresario envía una duda
router.post('/', authenticateToken, validateBody(createSupportMessageSchema), createSupportMessage);

// GET  /api/support        -> El empresario ve el historial de sus propias dudas
router.get('/', authenticateToken, getMySupportMessages);

// GET   /api/support/admin -> [ADMIN] Ver dudas de todas las empresas
router.get('/admin', authenticateToken, requireAdmin, listSupportMessagesForAdmin);

// PATCH /api/support/:id   -> [ADMIN] Responder una duda
router.patch('/:id', authenticateToken, requireAdmin, validateBody(replySupportMessageSchema), replySupportMessage);

export default router;
