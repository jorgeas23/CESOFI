import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().trim().min(1, 'El nombre del representante es obligatorio'),
  companyName: z.string().trim().min(1, 'El nombre de la empresa es obligatorio'),
  rfc: z.string().trim().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});
