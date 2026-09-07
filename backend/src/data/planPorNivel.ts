// ⚠️ CONTENIDO PLANTILLA/TEMPORAL ⚠️
// Catálogo de Ruta CESOFI por nivel de madurez (1 a 5), usado para generar el plan de mejora,
// acciones críticas y recomendaciones cuando el asesor de SIDEC aún no generó un diagnóstico
// de IA personalizado. Basado en el nivel que SIDEC sí siempre entrega (`resultado.nivel`).
//
// Este contenido es un placeholder inspirado en el ejemplo de la guía de integración de SIDEC.
// Debe reemplazarse por el catálogo oficial del programa CESOFI cuando esté definido.

export interface RecomendacionCesofi {
  recomendacionId: string;
  titulo: string;
  categoria: string;
  institucion?: string;
  esCapacitacion?: boolean;
  enlace?: string;
  justificacion: string;
}

export interface PasoCesofi {
  orden: number;
  titulo: string;
  descripcion: string;
  area: string;
  impactoEnPuntaje?: string;
  recursos: string;
  plazo: string;
}

export interface PlanNivel {
  nivelObjetivo: number;
  tiempoEstimado: string;
  accionesCriticas: string[];
  pasos: PasoCesofi[];
  recomendaciones: RecomendacionCesofi[];
}

export const PLAN_POR_NIVEL: Record<number, PlanNivel> = {
  1: {
    nivelObjetivo: 2,
    tiempoEstimado: '4 meses',
    accionesCriticas: [
      'Separar las cuentas personales del flujo del negocio mediante una cuenta bancaria exclusiva.',
      'Registrar diariamente los cobros y pagos en una bitácora de caja.',
    ],
    pasos: [
      {
        orden: 1,
        titulo: 'Control Básico de Caja',
        descripcion: 'Implementar una bitácora simple de ingresos y egresos diarios del negocio.',
        area: 'Finanzas',
        impactoEnPuntaje: '+2 pts',
        recursos: 'Plantilla de Control de Caja SEDECO',
        plazo: 'Mes 1-2',
      },
      {
        orden: 2,
        titulo: 'Regularización Fiscal Inicial',
        descripcion: 'Tramitar o actualizar la Constancia de Situación Fiscal ante el SAT.',
        area: 'Fiscal',
        impactoEnPuntaje: '+3 pts',
        recursos: 'Módulo de Orientación Fiscal SAT',
        plazo: 'Mes 2-4',
      },
    ],
    recomendaciones: [
      {
        recomendacionId: 'CAP-BASE-01',
        titulo: 'Taller de Formalización Básica de Negocios',
        categoria: 'Capacitación',
        institucion: 'ICATCAM',
        esCapacitacion: true,
        justificacion: 'Te ayuda a entender los primeros pasos para formalizar tu negocio.',
      },
    ],
  },
  2: {
    nivelObjetivo: 3,
    tiempoEstimado: '6 meses',
    accionesCriticas: [
      'Separar inmediatamente las cuentas personales del flujo del negocio mediante una cuenta bancaria exclusiva.',
      'Registrar diariamente los cobros y pagos en una bitácora de caja para controlar el margen real.',
      'Tramitar la Constancia de Situación Fiscal (CSF) con actividad económica actualizada ante el SAT.',
    ],
    pasos: [
      {
        orden: 1,
        titulo: 'Control Básico de Inventarios y Caja',
        descripcion: 'Implementar bitácora de entradas y salidas de mercancía y conciliar saldo al final de cada turno.',
        area: 'Operación',
        impactoEnPuntaje: '+2 pts',
        recursos: 'Plantilla de Control de Inventario SEDECO',
        plazo: 'Mes 1-2',
      },
      {
        orden: 2,
        titulo: 'Formalización Fiscal Básica',
        descripcion: 'Inscripción en el Régimen Simplificado de Confianza (RESICO) y emisión de facturas.',
        area: 'Fiscal',
        impactoEnPuntaje: '+4 pts',
        recursos: 'Módulo de Orientación Fiscal SEDECO / SAT',
        plazo: 'Mes 3-4',
      },
    ],
    recomendaciones: [
      {
        recomendacionId: 'CAP-FIN-01',
        titulo: 'Taller de Educación Financiera y Costos',
        categoria: 'Capacitación',
        institucion: 'ICATCAM',
        esCapacitacion: true,
        justificacion: 'Permitirá al empresario estructurar sus costos y calcular su punto de equilibrio.',
      },
    ],
  },
  3: {
    nivelObjetivo: 4,
    tiempoEstimado: '6 meses',
    accionesCriticas: [
      'Documentar procesos clave de operación del negocio.',
      'Establecer un presupuesto mensual formal y darle seguimiento.',
    ],
    pasos: [
      {
        orden: 1,
        titulo: 'Presencia Digital del Negocio',
        descripcion: 'Crear o formalizar redes sociales/catálogo digital para ampliar el alcance de ventas.',
        area: 'Ventas',
        impactoEnPuntaje: '+3 pts',
        recursos: 'Guía de Digitalización SEDECO',
        plazo: 'Mes 1-3',
      },
      {
        orden: 2,
        titulo: 'Presupuesto de Inversión',
        descripcion: 'Calcular los requerimientos financieros para el siguiente periodo de crecimiento.',
        area: 'Finanzas',
        impactoEnPuntaje: '+4 pts',
        recursos: 'Plantilla de Presupuesto de Inversión SEDECO',
        plazo: 'Mes 3-6',
      },
    ],
    recomendaciones: [
      {
        recomendacionId: 'CAP-DIG-01',
        titulo: 'Taller de Ventas Digitales y Marketing',
        categoria: 'Capacitación',
        institucion: 'ICATCAM',
        esCapacitacion: true,
        justificacion: 'Ayuda a diversificar canales de venta y aumentar ingresos.',
      },
    ],
  },
  4: {
    nivelObjetivo: 5,
    tiempoEstimado: '8 meses',
    accionesCriticas: [
      'Evaluar opciones de financiamiento formal para expansión.',
      'Formalizar la estructura administrativa del negocio (roles y responsabilidades).',
    ],
    pasos: [
      {
        orden: 1,
        titulo: 'Vinculación con Financiamiento',
        descripcion: 'Preparar la documentación necesaria para acceder a crédito empresarial formal.',
        area: 'Financiamiento',
        impactoEnPuntaje: '+5 pts',
        recursos: 'Ventanilla Única SEDECO / Bancampeche',
        plazo: 'Mes 1-4',
      },
      {
        orden: 2,
        titulo: 'Estructura Organizacional',
        descripcion: 'Definir roles, responsabilidades y procesos de contratación del negocio.',
        area: 'Administración',
        impactoEnPuntaje: '+4 pts',
        recursos: 'Guía de Estructura Organizacional SEDECO',
        plazo: 'Mes 4-8',
      },
    ],
    recomendaciones: [
      {
        recomendacionId: 'CAP-EXP-01',
        titulo: 'Asesoría en Acceso a Financiamiento',
        categoria: 'Financiera',
        institucion: 'Bancampeche',
        esCapacitacion: false,
        justificacion: 'Prepara al negocio para solicitar crédito formal de expansión.',
      },
    ],
  },
  5: {
    nivelObjetivo: 5,
    tiempoEstimado: '—',
    accionesCriticas: [
      'Mantener actualizados los controles financieros y fiscales alcanzados.',
    ],
    pasos: [
      {
        orden: 1,
        titulo: 'Consolidación y Mentoría',
        descripcion: 'Da seguimiento continuo a tus indicadores y participa como mentor de otros negocios en la Ruta CESOFI.',
        area: 'Administración',
        recursos: 'Programa de Mentoría CESOFI',
        plazo: 'Continuo',
      },
    ],
    recomendaciones: [],
  },
};
