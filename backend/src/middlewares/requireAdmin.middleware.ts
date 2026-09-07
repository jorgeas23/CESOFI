import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

// Usar siempre después de authenticateToken. El rol viene del JWT, firmado por nosotros al
// hacer login — no se puede falsificar sin la JWT_SECRET, así que basta con leerlo de ahí.
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.userRole !== 'ADMIN') {
    res.status(403).json({ error: 'Esta acción requiere permisos de administrador' });
    return;
  }
  next();
};
