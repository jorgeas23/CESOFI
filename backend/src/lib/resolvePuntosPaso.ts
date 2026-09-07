import { Company } from '@prisma/client';
import { prisma } from './prisma';
import { PLAN_POR_NIVEL } from '../data/planPorNivel';

/** "+2 pts" / "+5 puntos" / "3 pts" -> 2 / 5 / 3. Sin match -> 0. */
function extraerPuntos(valor?: string | null): number {
  if (!valor) return 0;
  const match = valor.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/**
 * Resuelve cuántos puntos vale un paso de la Ruta, buscando primero en el caso recibido por
 * push (el más específico del negocio) y si no, en el catálogo propio por nivel. Se captura al
 * subir la evidencia para que el valor quede fijo aunque el plan cambie después.
 */
export async function resolverPuntosDePaso(company: Company, pasoId?: string | null): Promise<number> {
  if (!pasoId) return 0;

  if (company.folioCesofi) {
    const caso = await prisma.diagnosticoCaso.findUnique({ where: { folio: company.folioCesofi } });
    const pasos = (caso?.diagnosticoJson as any)?.planMejoraNivel?.pasos;
    const pasoPush = Array.isArray(pasos) ? pasos.find((p: any) => p.id === pasoId) : null;
    if (pasoPush) return extraerPuntos(pasoPush.impactoEnPuntaje);
  }

  for (const nivel of Object.values(PLAN_POR_NIVEL)) {
    const pasoCatalogo = nivel.pasos.find((p) => p.id === pasoId);
    if (pasoCatalogo) return extraerPuntos(pasoCatalogo.impactoEnPuntaje);
  }

  return 0;
}

const NIVEL_POR_PUNTOS: Array<{ nombre: string; min: number }> = [
  { nombre: 'Oro', min: 1000 },
  { nombre: 'Plata', min: 500 },
  { nombre: 'Bronce', min: 0 },
];

export function calcularNivelPorPuntos(points: number): string {
  return NIVEL_POR_PUNTOS.find((n) => points >= n.min)!.nombre;
}
