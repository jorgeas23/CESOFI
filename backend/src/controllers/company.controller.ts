import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// OBTENER INFORMACIÓN DE LA EMPRESA DEL USUARIO AUTENTICADO
export const getCompanyProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no identificado' });
      return;
    }

    let company = await prisma.company.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Si por alguna razón el usuario no tiene empresa vinculada, se crea una por defecto
    if (!company) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      company = await prisma.company.create({
        data: {
          userId,
          name: `Empresa de ${user.name}`,
          points: 0,
          level: 'Bronce',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    res.json({
      message: 'Perfil de empresa obtenido exitosamente',
      company,
    });
  } catch (error) {
    console.error('Error al obtener perfil de empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar la empresa' });
  }
};

// ACTUALIZAR INFORMACIÓN DE LA EMPRESA Y REPRESENTANTE
export const updateCompanyProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, rfc, phone, address, contactName, logoUrl, folioCesofi } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no identificado' });
      return;
    }

    // Actualizar nombre del usuario si viene `contactName`
    if (contactName && contactName.trim() !== '') {
      await prisma.user.update({
        where: { id: userId },
        data: { name: contactName.trim() },
      });
    }

    // Actualizar datos de la empresa
    const updatedCompany = await prisma.company.update({
      where: { userId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(rfc !== undefined ? { rfc: rfc ? rfc.trim() : null } : {}),
        ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
        ...(address !== undefined ? { address: address ? address.trim() : null } : {}),
        ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
        ...(folioCesofi !== undefined ? { folioCesofi: folioCesofi ? folioCesofi.trim() : null } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Perfil de empresa actualizado exitosamente',
      company: updatedCompany,
    });
  } catch (error: any) {
    console.error('Error al actualizar perfil de empresa:', error);

    if (error.code === 'P2002') {
      const target: string[] = error.meta?.target || [];
      const message = target.includes('folioCesofi')
        ? 'Ese Folio CESOFI ya está vinculado a otra empresa.'
        : 'El RFC ya se encuentra registrado por otra empresa.';
      res.status(400).json({ error: message });
      return;
    }

    res.status(500).json({ error: 'Error interno del servidor al actualizar la empresa' });
  }
};
