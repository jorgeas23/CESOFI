import { z } from 'zod';

export const createEvidenceSchema = z.object({
  title: z.string().trim().min(1, 'El título del documento es obligatorio'),
  activityId: z.string().trim().optional(),
});
