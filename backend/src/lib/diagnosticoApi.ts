import { DIAGNOSTICO_API_URL, DIAGNOSTICO_API_KEY } from './env';

const REQUEST_TIMEOUT_MS = 10_000;

export interface DiagnosticoRespuesta {
  folio: string;
  evaluacionId: number;
  negocio: {
    rfc: string | null;
    nombreNegocio: string;
  };
  resultado: {
    nivel: number;
    puntajeTotal: number;
    dscr: number;
    esViable: boolean;
  };
  fechaEvaluacion: string;
  actualizadoEn: string;
  diagnosticoIA: {
    resumenGeneral: string;
    accionesCriticas?: string[];
    recomendaciones?: Array<{
      recomendacionId: string;
      titulo: string;
      categoria: string;
      institucion?: string;
      esCapacitacion?: boolean;
      enlace?: string;
      justificacion: string;
    }>;
    planMejoraNivel: {
      nivelActual: number;
      nivelObjetivo: number;
      tiempoEstimado: string;
      pasos: Array<{
        orden: number;
        titulo: string;
        descripcion: string;
        area: string;
        impactoEnPuntaje?: string;
        recursos: string;
        plazo: string;
      }>;
    };
    editadoPorAsesor?: boolean;
    fechaEdicionManual?: string;
  } | null;
}

export function isDiagnosticoApiConfigured(): boolean {
  return Boolean(DIAGNOSTICO_API_URL && DIAGNOSTICO_API_KEY);
}

export class DiagnosticoApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'DiagnosticoApiError';
  }
}

// Consulta el expediente de un microempresario por su Folio CESOFI en la API externa
// del Sistema de Diagnóstico Financiero. Devuelve `null` si el folio no existe (404).
export async function obtenerDiagnosticoPorFolio(folio: string): Promise<DiagnosticoRespuesta | null> {
  if (!isDiagnosticoApiConfigured()) {
    throw new DiagnosticoApiError(503, 'La integración con el Sistema de Diagnóstico no está configurada');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${DIAGNOSTICO_API_URL}/api/externo/v1/casos/${encodeURIComponent(folio)}/diagnostico-ia`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': DIAGNOSTICO_API_KEY,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401) {
      throw new DiagnosticoApiError(401, 'Llave de acceso a la API de Diagnóstico inválida');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new DiagnosticoApiError(response.status, `Error del Sistema de Diagnóstico (${response.status}): ${body}`);
    }

    return (await response.json()) as DiagnosticoRespuesta;
  } catch (error) {
    if (error instanceof DiagnosticoApiError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new DiagnosticoApiError(504, 'El Sistema de Diagnóstico no respondió a tiempo');
    }
    throw new DiagnosticoApiError(502, 'No se pudo conectar con el Sistema de Diagnóstico');
  } finally {
    clearTimeout(timeout);
  }
}
