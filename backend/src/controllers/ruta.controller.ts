import { Response } from 'express';
import { Company } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DiagnosticoRespuesta, obtenerDiagnosticoPorFolio, DiagnosticoApiError, isDiagnosticoApiConfigured } from '../lib/diagnosticoApi';
import { PLAN_POR_NIVEL } from '../data/planPorNivel';
import { mapCasoADiagnostico } from '../lib/mapCasoDiagnostico';

// Arma la Ruta CESOFI (plan de mejora, acciones críticas y recomendaciones/capacitaciones) de
// una empresa ya identificada. Compartido entre el empresario consultando la suya (getRuta) y
// un administrador consultando la de cualquiera (getRutaAdmin) — misma lógica, misma prioridad
// de fuentes, para que lo que el admin ve sea exactamente lo que ve el empresario.
async function resolverRutaDeCompany(company: Company) {
  if (!company.folioCesofi) {
    return {
      linked: false,
      configured: isDiagnosticoApiConfigured(),
      message: 'Aún no ha vinculado un Folio de Atención CESOFI.',
    };
  }

  // 1. ¿Ya nos llegó este folio por push (POST /api/externo/casos)? Es la fuente más rica y
  //    específica del negocio (riesgos, fortalezas, crédito recomendado), así que tiene
  //    prioridad sobre la API de "jalar" cuando existe.
  const casoPush = await prisma.diagnosticoCaso.findUnique({ where: { folio: company.folioCesofi } });

  let diagnostico: DiagnosticoRespuesta | null = casoPush ? mapCasoADiagnostico(casoPush) : null;
  let fuente: 'push' | 'pull' | null = casoPush ? 'push' : null;

  // 2. Si no hay nada por push, intentamos la API de "jalar" de SIDEC.
  if (!diagnostico) {
    diagnostico = await obtenerDiagnosticoPorFolio(company.folioCesofi);
    if (diagnostico) fuente = 'pull';
  }

  if (!diagnostico) {
    return {
      linked: true,
      found: false,
      message: `No existe una evaluación registrada para el folio ${company.folioCesofi}.`,
    };
  }

  // Si el asesor de SIDEC aún no generó un diagnóstico de IA personalizado, construimos la
  // Ruta con el catálogo propio de CESOFI a partir del nivel de madurez que SIDEC sí entrega
  // siempre. Esto es lo que de verdad nos interesa de la evaluación: el nivel.
  let diagnosticoIA = diagnostico.diagnosticoIA;
  let generadoPorCesofi = false;

  if ((!diagnosticoIA || !diagnosticoIA.planMejoraNivel?.pasos?.length) && diagnostico.resultado) {
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

  return {
    linked: true,
    found: true,
    fuente,
    ...diagnostico,
    diagnosticoIA,
    generadoPorCesofi,
  };
}

// Obtiene la Ruta CESOFI de la empresa del usuario autenticado.
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

    res.json(await resolverRutaDeCompany(company));
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

// [ADMIN] Obtiene la Ruta CESOFI de cualquier empresa, por su id — para que un administrador
// pueda revisar qué pasos lleva cumplidos un empresario antes de dictaminar su evidencia.
export const getRutaAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const companyId = String(req.params.companyId);

    const company = await prisma.company.findUnique({ where: { id: companyId } });

    if (!company) {
      res.status(404).json({ error: 'Empresa no encontrada' });
      return;
    }

    res.json(await resolverRutaDeCompany(company));
  } catch (error) {
    if (error instanceof DiagnosticoApiError) {
      console.error('Error de la API de Diagnóstico:', error.message);
      res.status(error.status === 401 || error.status === 503 ? 502 : error.status).json({
        error: 'No se pudo obtener la ruta desde el Sistema de Diagnóstico. Intenta de nuevo más tarde.',
      });
      return;
    }

    console.error('Error al obtener la ruta (admin):', error);
    res.status(500).json({ error: 'Error interno al consultar la ruta de la empresa' });
  }
};
