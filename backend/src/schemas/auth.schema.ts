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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'El enlace de recuperación es inválido'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// Registro para empresarios que ya tienen un Folio de Atención CESOFI en SIDEC:
// el nombre/RFC de la empresa se toman de SIDEC, no se piden a mano.
export const registerByFolioSchema = z.object({
  folio: z.string().trim().min(1, 'El Folio de Atención CESOFI es obligatorio'),
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().trim().min(1, 'Tu nombre es obligatorio'),
});
