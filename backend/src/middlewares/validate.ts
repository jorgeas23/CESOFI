import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export const validateBody = (schema: ZodType) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues[0]?.message || 'Datos inválidos';
    res.status(400).json({ error: message });
    return;
  }

  req.body = result.data;
  next();
};
