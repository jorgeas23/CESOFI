import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

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

    res.json({
      message: 'Evidencias obtenidas exitosamente',
      evidences,
    });
  } catch (error) {
    console.error('Error al obtener evidencias:', error);
    res.status(500).json({ error: 'Error interno al consultar evidencias' });
  }
};

// 2. Registrar/Subir una nueva evidencia
export const createEvidence = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { title, fileName, fileSize, fileType, activityId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'El título del documento es obligatorio' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      res.status(404).json({ error: 'Empresa no encontrada' });
      return;
    }

    // Crear la evidencia en estado EN_REVISION para dictamen oficial
    const newEvidence = await prisma.evidence.create({
      data: {
        companyId: company.id,
        activityId: activityId || undefined,
        title: title.trim(),
        fileName: fileName || 'documento_adjunto.pdf',
        fileSize: fileSize || '1.5 MB',
        fileType: fileType || 'pdf',
        status: 'EN_REVISION',
      },
    });

    res.status(201).json({
      message: 'Documento ingresado al proceso de dictamen y auditoría oficial',
      evidence: newEvidence,
    });
  } catch (error) {
    console.error('Error al registrar evidencia:', error);
    res.status(500).json({ error: 'Error interno al procesar la evidencia' });
  }
};