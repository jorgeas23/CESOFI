import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 1. El empresario envía una duda desde el Centro de Ayuda
export const createSupportMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { subject, message } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      res.status(404).json({ error: 'Empresa no encontrada' });
      return;
    }

    const nuevoMensaje = await prisma.supportMessage.create({
      data: { companyId: company.id, subject, message },
    });

    res.status(201).json({
      message: 'Tu consulta ha sido enviada al equipo de soporte de CESOFI',
      supportMessage: nuevoMensaje,
    });
  } catch (error) {
    console.error('Error al crear mensaje de soporte:', error);
    res.status(500).json({ error: 'Error interno al enviar tu consulta' });
  }
};

// 2. El empresario ve el historial de sus propias dudas (y la respuesta, si ya la tiene)
export const getMySupportMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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

    const mensajes = await prisma.supportMessage.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ message: 'Mensajes obtenidos exitosamente', supportMessages: mensajes });
  } catch (error) {
    console.error('Error al obtener mensajes de soporte:', error);
    res.status(500).json({ error: 'Error interno al consultar tus mensajes' });
  }
};

// 3. [ADMIN] Ver las dudas de todas las empresas (por defecto, las que aún no se responden)
export const listSupportMessagesForAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const statusFiltro = typeof req.query.status === 'string' ? req.query.status : 'PENDIENTE';

    const mensajes = await prisma.supportMessage.findMany({
      where: statusFiltro === 'TODOS' ? {} : { status: statusFiltro as any },
      include: {
        company: { select: { id: true, name: true, folioCesofi: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ message: 'Mensajes obtenidos exitosamente', supportMessages: mensajes });
  } catch (error) {
    console.error('Error al listar mensajes de soporte para admin:', error);
    res.status(500).json({ error: 'Error interno al consultar los mensajes' });
  }
};

// 4. [ADMIN] Responder una duda
export const replySupportMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { respuesta } = req.body;

    const mensaje = await prisma.supportMessage.findUnique({ where: { id } });
    if (!mensaje) {
      res.status(404).json({ error: 'Mensaje no encontrado' });
      return;
    }

    const actualizado = await prisma.supportMessage.update({
      where: { id },
      data: { respuesta, status: 'RESPONDIDO' },
    });

    res.json({ message: 'Respuesta enviada exitosamente', supportMessage: actualizado });
  } catch (error) {
    console.error('Error al responder mensaje de soporte:', error);
    res.status(500).json({ error: 'Error interno al enviar la respuesta' });
  }
};
