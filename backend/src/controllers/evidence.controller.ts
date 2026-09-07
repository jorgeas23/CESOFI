import { Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { SUPABASE_EVIDENCE_BUCKET } from '../lib/env';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolverPuntosDePaso, calcularNivelPorPuntos } from '../lib/resolvePuntosPaso';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hora

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Sustituye las rutas internas de storage por URLs firmadas temporales, en lote.
async function conUrlsFirmadas<T extends { fileUrl: string | null }>(evidences: T[]): Promise<T[]> {
  const rutas = evidences.map((e) => e.fileUrl).filter((p): p is string => Boolean(p));
  if (rutas.length === 0) return evidences;

  const { data: firmadas } = await supabaseAdmin.storage
    .from(SUPABASE_EVIDENCE_BUCKET)
    .createSignedUrls(rutas, SIGNED_URL_TTL_SECONDS);

  const urlPorRuta = new Map<string, string>();
  for (const entry of firmadas || []) {
    if (entry.path && entry.signedUrl) urlPorRuta.set(entry.path, entry.signedUrl);
  }

  return evidences.map((e) => ({
    ...e,
    fileUrl: e.fileUrl ? urlPorRuta.get(e.fileUrl) ?? null : e.fileUrl,
  }));
}

// 1. Obtener todas las evidencias de la empresa del usuario
export const getEvidences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      res.status(404).json({ error: 'Empresa no encontrada' });
      return;
    }

    const evidences = await prisma.evidence.findMany({
      where: { companyId: company.id },
      include: {
        activity: {
          select: {
            title: true,
            stepNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const evidencesWithUrls = await conUrlsFirmadas(evidences);

    res.json({
      message: 'Evidencias obtenidas exitosamente',
      evidences: evidencesWithUrls,
    });
  } catch (error) {
    console.error('Error al obtener evidencias:', error);
    res.status(500).json({ error: 'Error interno al consultar evidencias' });
  }
};

// 2. Registrar/Subir una nueva evidencia (con archivo real)
export const createEvidence = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { title, activityId, pasoId } = req.body;
    const file = req.file;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!file) {
      res.status(400).json({ error: 'Debes adjuntar un archivo (PDF, PNG o JPG)' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      res.status(404).json({ error: 'Empresa no encontrada' });
      return;
    }

    if (activityId) {
      const activity = await prisma.activity.findUnique({ where: { id: activityId } });
      if (!activity) {
        res.status(400).json({ error: 'La actividad indicada no existe' });
        return;
      }
    }

    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype] || 'bin';
    const storagePath = `${company.id}/${randomUUID()}-${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUPABASE_EVIDENCE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error al subir archivo a Supabase Storage:', uploadError.message);
      res.status(502).json({ error: 'No se pudo almacenar el archivo. Intenta de nuevo.' });
      return;
    }

    // Capturamos el valor en puntos del paso en este momento: si el plan cambia después,
    // el empresario conserva lo que vio y le prometimos cuando subió su evidencia.
    const pointsReward = await resolverPuntosDePaso(company, pasoId);

    // Crear la evidencia en estado EN_REVISION para dictamen oficial
    const newEvidence = await prisma.evidence.create({
      data: {
        companyId: company.id,
        activityId: activityId || undefined,
        pasoId: pasoId || undefined,
        pointsReward,
        title: title.trim(),
        fileUrl: storagePath,
        fileName: file.originalname,
        fileSize: formatFileSize(file.size),
        fileType: extension,
        status: 'EN_REVISION',
      },
    });

    const { data: signedUrl } = await supabaseAdmin.storage
      .from(SUPABASE_EVIDENCE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    res.status(201).json({
      message: 'Documento ingresado al proceso de dictamen y auditoría oficial',
      evidence: { ...newEvidence, fileUrl: signedUrl?.signedUrl ?? null },
    });
  } catch (error) {
    console.error('Error al registrar evidencia:', error);
    res.status(500).json({ error: 'Error interno al procesar la evidencia' });
  }
};

// 3. [ADMIN] Listar evidencias de todas las empresas, para dictaminar (por defecto, las
//    que están EN_REVISION — las que de verdad necesitan que alguien las revise).
export const listEvidencesForAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const statusFiltro = typeof req.query.status === 'string' ? req.query.status : 'EN_REVISION';

    const evidences = await prisma.evidence.findMany({
      where: statusFiltro === 'TODAS' ? {} : { status: statusFiltro as any },
      include: {
        company: {
          select: { id: true, name: true, folioCesofi: true, rfc: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const evidencesWithUrls = await conUrlsFirmadas(evidences);

    res.json({ message: 'Evidencias obtenidas exitosamente', evidences: evidencesWithUrls });
  } catch (error) {
    console.error('Error al listar evidencias para admin:', error);
    res.status(500).json({ error: 'Error interno al consultar evidencias' });
  }
};

// 4. [ADMIN] Aprobar o rechazar una evidencia — esto es lo que hace que un paso de la Ruta
//    se vea como cumplido (o rechazado) del lado del empresario.
export const reviewEvidence = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, feedback } = req.body;

    const evidence = await prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      res.status(404).json({ error: 'Evidencia no encontrada' });
      return;
    }

    const actualizada = await prisma.evidence.update({
      where: { id },
      data: { status, feedback: feedback || null },
    });

    // Solo se otorgan los puntos la primera vez que se aprueba — nunca dos veces por la
    // misma evidencia, aunque alguien vuelva a dictaminarla.
    if (status === 'APROBADO' && evidence.status !== 'APROBADO' && evidence.pointsReward) {
      const company = await prisma.company.update({
        where: { id: evidence.companyId },
        data: { points: { increment: evidence.pointsReward } },
      });
      await prisma.company.update({
        where: { id: company.id },
        data: { level: calcularNivelPorPuntos(company.points) },
      });
    }

    res.json({ message: 'Evidencia dictaminada exitosamente', evidence: actualizada });
  } catch (error) {
    console.error('Error al dictaminar evidencia:', error);
    res.status(500).json({ error: 'Error interno al dictaminar la evidencia' });
  }
};
