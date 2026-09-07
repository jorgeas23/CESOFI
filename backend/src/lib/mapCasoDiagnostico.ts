import { DiagnosticoCaso } from '@prisma/client';
import { DiagnosticoRespuesta } from './diagnosticoApi';

/** "Nivel 1" -> 1, "1" -> 1, valores raros -> 0 (nunca revienta con datos sucios de origen). */
function extraerNivel(valor: unknown): number {
  const match = String(valor ?? '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function aNumero(valor: unknown): number {
  const num = Number(valor);
  return Number.isFinite(num) ? num : 0;
}

function esViable(valor: unknown): boolean {
  return String(valor ?? '').trim().toUpperCase().startsWith('VIABLE');
}

/**
 * Convierte un expediente recibido por push (contrato seguimiento-cesofi v1, guardado en
 * DiagnosticoCaso) a la misma forma que usamos para lo que trae la API de "jalar" de SIDEC,
 * para que el resto del código (getRuta, el frontend) no tenga que saber de dónde vino.
 */
export function mapCasoADiagnostico(caso: DiagnosticoCaso): DiagnosticoRespuesta {
  const evaluacion = (caso.evaluacionJson as any) || {};
  const diagnostico = (caso.diagnosticoJson as any) || {};
  const resultado = evaluacion.resultado || {};
  const plan = diagnostico.planMejoraNivel || {};

  return {
    folio: caso.folio,
    evaluacionId: caso.evaluacionId ?? 0,
    negocio: {
      rfc: caso.empresarioRfc,
      nombreNegocio: caso.negocioNombre,
    },
    resultado: {
      nivel: extraerNivel(resultado.nivel),
      puntajeTotal: aNumero(resultado.puntajeTotal),
      dscr: aNumero(resultado.dscr),
      esViable: esViable(resultado.esViable),
    },
    fechaEvaluacion: (caso.fechaEvaluacion ?? caso.recibidoEn).toISOString(),
    actualizadoEn: (caso.actualizadoEn ?? caso.actualizadoLocalEn).toISOString(),
    diagnosticoIA: {
      resumenGeneral: diagnostico.resumenGeneral || '',
      fortalezas: diagnostico.fortalezas || [],
      riesgos: diagnostico.riesgos || [],
      accionesCriticas: (diagnostico.accionesCriticas || []).map((a: any) =>
        typeof a === 'string' ? a : a.texto
      ),
      recomendaciones: (diagnostico.recomendaciones || []).map((r: any) => ({
        recomendacionId: r.id || r.recomendacionId,
        titulo: r.titulo,
        categoria: r.categoria,
        institucion: r.institucion,
        esCapacitacion: r.esCapacitacion,
        enlace: r.enlace,
        justificacion: r.justificacion,
      })),
      planMejoraNivel: {
        nivelActual: plan.nivelActual ?? extraerNivel(resultado.nivel),
        nivelObjetivo: plan.nivelObjetivo ?? extraerNivel(resultado.nivel) + 1,
        tiempoEstimado: plan.tiempoEstimado || '',
        pasos: (plan.pasos || []).map((p: any) => ({
          orden: p.orden,
          titulo: p.titulo,
          descripcion: p.descripcion,
          area: p.area,
          impactoEnPuntaje: p.impactoEnPuntaje,
          recursos: p.recursos,
          plazo: p.plazo,
        })),
      },
      editadoPorAsesor: diagnostico.editadoPorAsesor,
    },
  };
}
