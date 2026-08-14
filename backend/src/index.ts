import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- RUTAS DEL SERVIDOR ---
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import evidenceRoutes from './routes/evidence.routes';

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/evidence', evidenceRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`⚡ Backend corriendo en http://localhost:${PORT}`);
});