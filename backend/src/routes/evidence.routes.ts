import { Router } from 'express';
import multer from 'multer';
import { getEvidences, createEvidence, listEvidencesForAdmin, reviewEvidence } from '../controllers/evidence.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/requireAdmin.middleware';
import { validateBody } from '../middlewares/validate';
import { createEvidenceSchema, reviewEvidenceSchema } from '../schemas/evidence.schema';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error('Formato no permitido. Solo se aceptan PDF, PNG o JPG.'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

// GET  /api/evidence  -> Obtener lista de evidencias protegida por token
router.get('/', authenticateToken, getEvidences);

// POST /api/evidence  -> Registrar una nueva evidencia (multipart/form-data, campo "file")
router.post('/', authenticateToken, upload.single('file'), validateBody(createEvidenceSchema), createEvidence);

// GET   /api/evidence/admin -> [ADMIN] Listar evidencias de todas las empresas para dictaminar
router.get('/admin', authenticateToken, requireAdmin, listEvidencesForAdmin);

// PATCH /api/evidence/:id -> [ADMIN] Aprobar o rechazar una evidencia
router.patch('/:id', authenticateToken, requireAdmin, validateBody(reviewEvidenceSchema), reviewEvidence);

export default router;
