import { Request, Response, NextFunction } from 'express';
import { RECEPTOR_API_KEY } from '../lib/env';

// Autenticación por llave compartida para el receptor push del Sistema de
// Diagnóstico (X-API-Key), distinta del JWT que usan los usuarios humanos
// de la app. Sin RECEPTOR_API_KEY configurada, nada puede pasar por aquí.
export const verificarApiKeyExterna = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const llave = req.headers['x-api-key'];

  if (!RECEPTOR_API_KEY || llave !== RECEPTOR_API_KEY) {
    res.status(401).json({ error: 'X-API-Key inválida o ausente' });
    return;
  }

  next();
};
