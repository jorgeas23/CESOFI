import { z } from 'zod';

export const createSupportMessageSchema = z.object({
  subject: z.string().trim().min(1, 'El asunto es obligatorio').max(200),
  message: z.string().trim().min(1, 'El mensaje es obligatorio').max(2000),
});

export const replySupportMessageSchema = z.object({
  respuesta: z.string().trim().min(1, 'La respuesta no puede estar vacía').max(2000),
});
