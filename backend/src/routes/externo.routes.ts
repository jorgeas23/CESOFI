import { Router } from 'express';
import { getEstado, recibirCaso } from '../controllers/casoExterno.controller';
import { verificarApiKeyExterna } from '../middlewares/receptorAuth.middleware';
import { validateBody } from '../middlewares/validate';
import { casoSeguimientoSchema } from '../schemas/casoSeguimiento.schema';

const router = Router();

// Todo lo de aquí abajo es machine-to-machine con SIDEC: se autentica con
// X-API-Key (RECEPTOR_API_KEY), nunca con el JWT de los usuarios de la app.
router.use(verificarApiKeyExterna);

// GET /api/externo/estado — healthcheck del contrato seguimiento-cesofi v1
router.get('/estado', getEstado);
router.get('/health', getEstado); // alias que también permite el contrato

// POST /api/externo/casos — recepción de expediente (push)
router.post('/casos', validateBody(casoSeguimientoSchema), recibirCaso);

export default router;
