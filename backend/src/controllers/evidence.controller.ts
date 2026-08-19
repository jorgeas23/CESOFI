import { Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { SUPABASE_EVIDENCE_BUCKET } from '../lib/env';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hora

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

    // Cambiamos la ruta interna de storage por una URL firmada temporal para poder verla/descargarla
    const evidencesWithUrls = await Promise.all(
      evidences.map(async (evidence) => {
        if (!evidence.fileUrl) return evidence;

        const { data } = await supabaseAdmin.storage
          .from(SUPABASE_EVIDENCE_BUCKET)
          .createSignedUrl(evidence.fileUrl, SIGNED_URL_TTL_SECONDS);

        return { ...evidence, fileUrl: data?.signedUrl ?? null };
      })
    );

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
    const { title, activityId } = req.body;
    const file = req.file;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'El título del documento es obligatorio' });
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

    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'pdf';
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

    // Crear la evidencia en estado EN_REVISION para dictamen oficial
    const newEvidence = await prisma.evidence.create({
      data: {
        companyId: company.id,
        activityId: activityId || undefined,
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
