import express from 'express';
import cors from 'cors';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

app.use(helmet());

// CORS_ORIGIN acepta una lista separada por comas (ej. "https://app.cesofi.mx,https://admin.cesofi.mx").
// Sin configurar, permite cualquier origen (adecuado solo para desarrollo).
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['*'];

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Límite general para toda la API (protege contra abuso/scraping masivo)
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// --- RUTAS DEL SERVIDOR ---
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import evidenceRoutes from './routes/evidence.routes';
import rutaRoutes from './routes/ruta.routes';
import externoRoutes from './routes/externo.routes';
import supportRoutes from './routes/support.routes';

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/ruta', rutaRoutes);
app.use('/api/externo', externoRoutes);
app.use('/api/support', supportRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'El archivo supera el tamaño máximo permitido (10 MB)'
      : 'No se pudo procesar el archivo adjunto';
    res.status(413).json({ error: message });
    return;
  }

  // Mensaje conocido y seguro que lanza el fileFilter de multer (ver evidence.routes.ts)
  if (err.message === 'Formato no permitido. Solo se aceptan PDF, PNG o JPG.') {
    res.status(415).json({ error: err.message });
    return;
  }

  res.status(400).json({ error: 'Solicitud inválida' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`⚡ Backend corriendo en http://localhost:${PORT}`);
});