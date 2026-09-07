import { z } from 'zod';

// Validación permisiva a propósito: el payload de SIDEC (contrato
// seguimiento-cesofi v1) trae bloques ricos y variables (evaluacion,
// negocio, diagnostico) que no vale la pena tipar campo por campo aquí.
// Solo se exige lo que el receptor necesita para identificar y guardar el
// caso; el resto se guarda tal cual llega en columnas Json.
export const casoSeguimientoSchema = z.object({
  contrato: z.string().refine((v) => v === 'seguimiento-cesofi', {
    message: 'contrato no soportado; se esperaba "seguimiento-cesofi"',
  }),
  version: z.number().refine((v) => v === 1, {
    message: 'version no soportada; se esperaba 1',
  }),
  emisor: z.record(z.string(), z.any()).optional().nullable(),
  caso: z.object({
    folio: z.string().trim().min(1, 'caso.folio es obligatorio'),
    folioSedeco: z.string().trim().optional().nullable(),
    seguimientoIdOriginal: z.string().trim().optional().nullable(),
    evaluacionId: z.number().optional().nullable(),
    fechaEvaluacion: z.string().optional().nullable(),
    actualizadoEn: z.string().optional().nullable(),
    asesor: z.record(z.string(), z.any()).optional().nullable(),
  }).catchall(z.any()),
  empresario: z.record(z.string(), z.any()).optional().nullable(),
  negocio: z.object({
    nombreNegocio: z.string().trim().min(1, 'negocio.nombreNegocio es obligatorio'),
  }).catchall(z.any()),
  evaluacion: z.record(z.string(), z.any()).optional().nullable(),
  diagnostico: z.record(z.string(), z.any()),
});

export type CasoSeguimientoPayload = z.infer<typeof casoSeguimientoSchema>;
