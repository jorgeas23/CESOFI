import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { CasoSeguimientoPayload } from '../schemas/casoSeguimiento.schema';

// GET /api/externo/estado — healthcheck para que SIDEC compruebe disponibilidad
// antes de disparar envíos. Ya pasó por verificarApiKeyExterna al llegar aquí.
export const getEstado = (_req: Request, res: Response): void => {
  res.json({
    ok: true,
    version: '1.0.0',
    sistema: 'sistema-seguimiento',
  });
};

/** ISO 8601 -> Date, o null si viene vacío/mal formado (nunca truena Prisma con una fecha inválida). */
function aFechaValida(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * POST /api/externo/casos — recibe un expediente completo (contrato
 * seguimiento-cesofi v1) y lo guarda o actualiza.
 *
 * Reglas del contrato que aplica:
 *  - Idempotencia: mismo Idempotency-Key -> mismo seguimientoCasoId, sin
 *    volver a tocar la base.
 *  - Correlación: primero caso.seguimientoIdOriginal, luego caso.folio,
 *    si ninguno coincide se crea un caso nuevo.
 *  - Nunca 500 por datos inválidos — eso ya lo filtró la validación de Zod
 *    antes de llegar aquí; un 500 real es una falla de infraestructura.
 */
export const recibirCaso = async (req: Request, res: Response): Promise<void> => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    res.status(400).json({ error: 'Falta el header Idempotency-Key' });
    return;
  }

  const body = req.body as CasoSeguimientoPayload;

  try {
    // Reenvío de una petición ya procesada: se responde igual, sin tocar nada.
    const yaProcesado = await prisma.casoIdempotencia.findUnique({ where: { idempotencyKey } });

    if (yaProcesado) {
      res.status(200).json({ ok: true, seguimientoCasoId: yaProcesado.casoId });
      return;
    }

    const { caso, empresario, negocio, evaluacion, diagnostico, emisor } = body;

    const datos = {
      folio: caso.folio,
      folioSedeco: caso.folioSedeco ?? null,
      evaluacionId: caso.evaluacionId ?? null,
      fechaEvaluacion: aFechaValida(caso.fechaEvaluacion),
      actualizadoEn: aFechaValida(caso.actualizadoEn),
      emisorSistema: emisor?.sistema ?? null,
      emisorInstalacion: emisor?.instalacion ?? null,
      asesorNombre: caso.asesor?.nombre ?? null,
      asesorEmail: caso.asesor?.email ?? null,
      empresarioFolioSedeco: empresario?.folioSedeco ?? null,
      empresarioNombre: empresario?.nombreCompleto ?? empresario?.nombre ?? null,
      empresarioRfc: empresario?.rfc ?? null,
      empresarioCurp: empresario?.curp ?? null,
      empresarioTelefono: empresario?.telefono ?? null,
      empresarioEmail: empresario?.email ?? null,
      negocioNombre: negocio.nombreNegocio,
      negocioSector: negocio.sector ?? null,
      negocioJson: negocio,
      evaluacionJson: evaluacion ?? undefined,
      diagnosticoJson: diagnostico,
    };

    // 1. Por seguimientoIdOriginal (respaldo histórico), 2. por folio, 3. nuevo.
    let existente = caso.seguimientoIdOriginal
      ? await prisma.diagnosticoCaso.findUnique({ where: { id: caso.seguimientoIdOriginal } })
      : null;

    if (!existente) {
      existente = await prisma.diagnosticoCaso.findUnique({ where: { folio: caso.folio } });
    }

    let guardado;
    let esNuevo = false;

    if (existente) {
      guardado = await prisma.diagnosticoCaso.update({ where: { id: existente.id }, data: datos });
    } else {
      guardado = await prisma.diagnosticoCaso.create({ data: datos });
      esNuevo = true;
    }

    await prisma.casoIdempotencia.create({
      data: { idempotencyKey, casoId: guardado.id },
    });

    res.status(esNuevo ? 201 : 200).json({ ok: true, seguimientoCasoId: guardado.id });
  } catch (error) {
    console.error('Error al recibir caso de SIDEC:', error);
    res.status(500).json({ error: 'Error interno del receptor al guardar el expediente' });
  }
};
