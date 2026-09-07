import { z } from 'zod';

export const createEvidenceSchema = z.object({
  title: z.string().trim().min(1, 'El título del documento es obligatorio'),
  activityId: z.string().trim().optional(),
  // Id del paso de la Ruta CESOFI al que corresponde este documento (opcional: una evidencia
  // también puede subirse sin ligarla a un paso específico, como hasta ahora).
  pasoId: z.string().trim().optional(),
});

export const reviewEvidenceSchema = z.object({
  status: z.enum(['APROBADO', 'RECHAZADO'], {
    message: 'El estatus debe ser APROBADO o RECHAZADO',
  }),
  feedback: z.string().trim().max(1000).optional(),
});
