import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().trim().min(1).optional(),
  rfc: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  contactName: z.string().trim().optional(),
  logoUrl: z.string().trim().optional().nullable(),
  folioCesofi: z.string().trim().optional().nullable(),
});
