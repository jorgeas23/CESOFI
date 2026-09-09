import { Router } from 'express';
import { exportarReporteExcel, exportarReportePdf } from '../controllers/reportes.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/requireAdmin.middleware';

const router = Router();

// GET /api/reportes/excel -> [ADMIN] Reporte de todas las empresas en un .xlsx descargable
router.get('/excel', authenticateToken, requireAdmin, exportarReporteExcel);

// GET /api/reportes/pdf -> [ADMIN] El mismo reporte en .pdf
router.get('/pdf', authenticateToken, requireAdmin, exportarReportePdf);

export default router;
