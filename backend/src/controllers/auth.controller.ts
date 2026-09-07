import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { JWT_SECRET } from '../lib/env';
import { obtenerDiagnosticoPorFolio, DiagnosticoApiError } from '../lib/diagnosticoApi';
import { mapCasoADiagnostico } from '../lib/mapCasoDiagnostico';

// REGISTRO DE USUARIO Y SU EMPRESA
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, companyName, rfc } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'El correo electrónico ya está registrado' });
      return;
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear Usuario y Empresa vinculada de forma segura
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        company: {
          create: {
            name: companyName,
            // Si el RFC viene vacío o null, lo guardamos como undefined para que Prisma lo ignore
            ...(rfc && rfc.trim() !== '' ? { rfc: rfc.trim() } : {}),
          },
        },
      },
      include: {
        company: true,
      },
    });

    // Generar Token JWT
    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        company: newUser.company,
      },
    });
  } catch (error: any) {
    console.error('Error detallado en registro:', error);
    // Si hay un error de campo único duplicado en Prisma (ej. RFC o Email repetido)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El RFC o correo ya se encuentra registrado por otra empresa.' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor al registrar usuario' });
  }
};

// REGISTRO DE EMPRESARIOS YA EXISTENTES EN SIDEC (por Folio de Atención CESOFI):
// el nombre y RFC de la empresa se traen de SIDEC, no los teclea el usuario.
export const registerByFolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { folio, email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'El correo electrónico ya está registrado' });
      return;
    }

    const existingCompany = await prisma.company.findUnique({ where: { folioCesofi: folio } });
    if (existingCompany) {
      res.status(400).json({ error: 'Ese Folio ya tiene una cuenta creada. Inicia sesión en su lugar.' });
      return;
    }

    // Igual que en getRuta: primero revisamos si ya nos llegó este folio por push
    // (más rápido y no depende de que la API de jalar de SIDEC sea alcanzable).
    const casoPush = await prisma.diagnosticoCaso.findUnique({ where: { folio } });
    const diagnostico = casoPush ? mapCasoADiagnostico(casoPush) : await obtenerDiagnosticoPorFolio(folio);

    if (!diagnostico) {
      res.status(404).json({ error: `No existe una evaluación registrada para el folio ${folio}.` });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        company: {
          create: {
            name: diagnostico.negocio.nombreNegocio,
            folioCesofi: folio,
            ...(diagnostico.negocio.rfc ? { rfc: diagnostico.negocio.rfc } : {}),
          },
        },
      },
      include: { company: true },
    });

    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Cuenta vinculada exitosamente a tu expediente CESOFI',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        company: newUser.company,
      },
    });
  } catch (error: any) {
    if (error instanceof DiagnosticoApiError) {
      console.error('Error de la API de Diagnóstico durante registro por folio:', error.message);
      res.status(502).json({ error: 'No se pudo validar tu Folio con el Sistema de Diagnóstico. Intenta de nuevo más tarde.' });
      return;
    }

    console.error('Error en registro por folio:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El correo o el RFC ya se encuentran registrados.' });
      return;
    }
    res.status(500).json({ error: 'Error interno del servidor al registrar la cuenta' });
  }
};

// INICIO DE SESIÓN
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};

// CAMBIO DE CONTRASEÑA
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // El userId viene del middleware de autenticación
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    // Buscar el usuario en la BD
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verificar que la contraseña actual sea correcta
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      return;
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor al cambiar la contraseña' });
  }
};