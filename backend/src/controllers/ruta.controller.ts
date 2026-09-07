import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { obtenerDiagnosticoPorFolio, DiagnosticoApiError, isDiagnosticoApiConfigured } from '../lib/diagnosticoApi';
import { PLAN_POR_NIVEL } from '../data/planPorNivel';

// Obtiene la Ruta CESOFI (plan de mejora, acciones críticas y recomendaciones/capacitaciones)
// consultando la API externa del Sistema de Diagnóstico Financiero con el folio vinculado
// a la empresa del usuario autenticado.
export const getRuta = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const company = await prisma.company.findUnique({ where: { userId } });

    if (!company) {
      res.status(404).json({ error: 'Empresa no encontrada' });
      return;
    }

    if (!company.folioCesofi) {
      res.json({
        linked: false,
        configured: isDiagnosticoApiConfigured(),
        message: 'Aún no has vinculado tu Folio de Atención CESOFI.',
      });
      return;
    }

    const diagnostico = await obtenerDiagnosticoPorFolio(company.folioCesofi);

    if (!diagnostico) {
      res.json({
        linked: true,
        found: false,
        message: `No existe una evaluación registrada para el folio ${company.folioCesofi}.`,
      });
      return;
    }

    // Si el asesor de SIDEC aún no generó un diagnóstico de IA personalizado, construimos la
    // Ruta con el catálogo propio de CESOFI a partir del nivel de madurez que SIDEC sí entrega
    // siempre. Esto es lo que de verdad nos interesa de la evaluación: el nivel.
    let diagnosticoIA = diagnostico.diagnosticoIA;
    let generadoPorCesofi = false;

    if (!diagnosticoIA && diagnostico.resultado) {
      const plantilla = PLAN_POR_NIVEL[diagnostico.resultado.nivel];
      if (plantilla) {
        diagnosticoIA = {
          resumenGeneral: 'Plan generado automáticamente por CESOFI según tu nivel de madurez.',
          accionesCriticas: plantilla.accionesCriticas,
          recomendaciones: plantilla.recomendaciones,
          planMejoraNivel: {
            nivelActual: diagnostico.resultado.nivel,
            nivelObjetivo: plantilla.nivelObjetivo,
            tiempoEstimado: plantilla.tiempoEstimado,
            pasos: plantilla.pasos,
          },
        };
        generadoPorCesofi = true;
      }
    }

    res.json({
      linked: true,
      found: true,
      ...diagnostico,
      diagnosticoIA,
      generadoPorCesofi,
    });
  } catch (error) {
    if (error instanceof DiagnosticoApiError) {
      console.error('Error de la API de Diagnóstico:', error.message);
      res.status(error.status === 401 || error.status === 503 ? 502 : error.status).json({
        error: 'No se pudo obtener tu ruta desde el Sistema de Diagnóstico. Intenta de nuevo más tarde.',
      });
      return;
    }

    console.error('Error al obtener la ruta:', error);
    res.status(500).json({ error: 'Error interno al consultar tu ruta' });
  }
};
