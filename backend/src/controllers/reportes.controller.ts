import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { mapCasoADiagnostico } from '../lib/mapCasoDiagnostico';
import { PLAN_POR_NIVEL } from '../data/planPorNivel';

const VERDE = '034123';
const VERDE_CLARO = 'E6F4EA';
const GRIS = '64748B';

interface EvidenciaFila {
  titulo: string;
  pasoId: string | null;
  pasoTitulo: string | null;
  status: string;
  fileName: string | null;
  createdAt: Date;
  feedback: string | null;
}

interface FilaReporte {
  id: string;
  name: string;
  rfc: string | null;
  folioCesofi: string | null;
  phone: string | null;
  address: string | null;
  level: string;
  points: number;
  createdAt: Date;
  contactName: string;
  contactEmail: string;
  nivelActual: number | null;
  nivelObjetivo: number | null;
  totalPasos: number | null;
  pasosCompletados: number;
  pasosRechazados: number;
  pasosPendientes: number | null;
  evidenciasTotal: number;
  evidenciasAprobadas: number;
  evidenciasRechazadas: number;
  evidenciasEnRevision: number;
  evidencias: EvidenciaFila[];
}

// Arma una fila de reporte por empresa a partir de datos que ya tenemos en nuestra base — nunca
// llama a la API de "jalar" de SIDEC aquí (sería lenta/poco confiable para N empresas a la vez).
// Si una empresa no tiene un caso recibido por push, su nivel/pasos simplemente quedan vacíos:
// preferible a bloquear todo el reporte por una integración externa que puede estar caída.
async function construirFilasReporte(): Promise<FilaReporte[]> {
  const companies = await prisma.company.findMany({
    include: {
      user: { select: { name: true, email: true } },
      evidences: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const folios = companies.map((c) => c.folioCesofi).filter((f): f is string => Boolean(f));
  const casos = folios.length
    ? await prisma.diagnosticoCaso.findMany({ where: { folio: { in: folios } } })
    : [];
  const casoPorFolio = new Map(casos.map((c) => [c.folio, c]));

  return companies.map((company): FilaReporte => {
    const caso = company.folioCesofi ? casoPorFolio.get(company.folioCesofi) : undefined;
    const diagnostico = caso ? mapCasoADiagnostico(caso) : null;

    let plan = diagnostico?.diagnosticoIA?.planMejoraNivel ?? null;
    const nivelActual = diagnostico?.resultado?.nivel ?? null;

    if ((!plan || plan.pasos.length === 0) && nivelActual !== null) {
      const plantilla = PLAN_POR_NIVEL[nivelActual];
      if (plantilla) {
        plan = {
          nivelActual,
          nivelObjetivo: plantilla.nivelObjetivo,
          tiempoEstimado: plantilla.tiempoEstimado,
          pasos: plantilla.pasos,
        };
      }
    }

    let pasosCompletados = 0;
    let pasosRechazados = 0;
    if (plan?.pasos?.length) {
      for (const paso of plan.pasos) {
        const delPaso = company.evidences.filter((e) => e.pasoId === paso.id);
        const ultima = delPaso[delPaso.length - 1];
        if (ultima?.status === 'APROBADO') pasosCompletados++;
        else if (ultima?.status === 'RECHAZADO') pasosRechazados++;
      }
    }

    const totalPasos = plan?.pasos?.length ?? null;

    return {
      id: company.id,
      name: company.name,
      rfc: company.rfc,
      folioCesofi: company.folioCesofi,
      phone: company.phone,
      address: company.address,
      level: company.level,
      points: company.points,
      createdAt: company.createdAt,
      contactName: company.user.name,
      contactEmail: company.user.email,
      nivelActual,
      nivelObjetivo: plan?.nivelObjetivo ?? null,
      totalPasos,
      pasosCompletados,
      pasosRechazados,
      pasosPendientes: totalPasos !== null ? totalPasos - pasosCompletados - pasosRechazados : null,
      evidenciasTotal: company.evidences.length,
      evidenciasAprobadas: company.evidences.filter((e) => e.status === 'APROBADO').length,
      evidenciasRechazadas: company.evidences.filter((e) => e.status === 'RECHAZADO').length,
      evidenciasEnRevision: company.evidences.filter((e) => e.status === 'EN_REVISION').length,
      evidencias: company.evidences.map((e) => ({
        titulo: e.title,
        pasoId: e.pasoId,
        pasoTitulo: plan?.pasos?.find((p) => p.id === e.pasoId)?.titulo ?? null,
        status: e.status,
        fileName: e.fileName,
        createdAt: e.createdAt,
        feedback: e.feedback,
      })),
    };
  });
}

const fecha = (d: Date) => d.toLocaleDateString('es-MX');
const nombreArchivo = (ext: string) => `cesofi-reporte-${new Date().toISOString().slice(0, 10)}.${ext}`;

// [ADMIN] Descarga un reporte de todas las empresas en Excel: hoja "Empresas" (datos, nivel,
// puntos, avance de pasos) y hoja "Evidencias" (una fila por documento subido).
export const exportarReporteExcel = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filas = await construirFilasReporte();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CESOFI';
    workbook.created = new Date();

    const resumen = workbook.addWorksheet('Empresas');
    resumen.columns = [
      { header: 'Empresa', key: 'name', width: 28 },
      { header: 'Folio CESOFI', key: 'folioCesofi', width: 18 },
      { header: 'RFC', key: 'rfc', width: 16 },
      { header: 'Contacto', key: 'contactName', width: 20 },
      { header: 'Correo', key: 'contactEmail', width: 26 },
      { header: 'Teléfono', key: 'phone', width: 14 },
      { header: 'Dirección', key: 'address', width: 30 },
      { header: 'Nivel (app)', key: 'level', width: 12 },
      { header: 'Puntos', key: 'points', width: 10 },
      { header: 'Nivel SIDEC actual', key: 'nivelActual', width: 16 },
      { header: 'Nivel meta', key: 'nivelObjetivo', width: 12 },
      { header: 'Pasos totales', key: 'totalPasos', width: 13 },
      { header: 'Pasos completados', key: 'pasosCompletados', width: 16 },
      { header: 'Pasos rechazados', key: 'pasosRechazados', width: 15 },
      { header: 'Pasos pendientes', key: 'pasosPendientes', width: 15 },
      { header: 'Evidencias totales', key: 'evidenciasTotal', width: 15 },
      { header: 'Aprobadas', key: 'evidenciasAprobadas', width: 12 },
      { header: 'Rechazadas', key: 'evidenciasRechazadas', width: 12 },
      { header: 'En revisión', key: 'evidenciasEnRevision', width: 12 },
      { header: 'Registrado', key: 'createdAtFmt', width: 14 },
    ];
    resumen.getRow(1).font = { bold: true, color: { argb: 'FF' + VERDE } };
    resumen.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + VERDE_CLARO } };
    resumen.views = [{ state: 'frozen', ySplit: 1 }];

    filas.forEach((f) => {
      resumen.addRow({ ...f, createdAtFmt: fecha(f.createdAt) });
    });

    const detalle = workbook.addWorksheet('Evidencias');
    detalle.columns = [
      { header: 'Empresa', key: 'empresa', width: 28 },
      { header: 'Folio', key: 'folio', width: 18 },
      { header: 'Paso de la Ruta', key: 'pasoTitulo', width: 32 },
      { header: 'Documento', key: 'titulo', width: 28 },
      { header: 'Archivo', key: 'fileName', width: 22 },
      { header: 'Estado', key: 'status', width: 14 },
      { header: 'Fecha', key: 'createdAtFmt', width: 14 },
      { header: 'Comentario del dictamen', key: 'feedback', width: 34 },
    ];
    detalle.getRow(1).font = { bold: true, color: { argb: 'FF' + VERDE } };
    detalle.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + VERDE_CLARO } };
    detalle.views = [{ state: 'frozen', ySplit: 1 }];

    filas.forEach((f) => {
      f.evidencias.forEach((e) => {
        detalle.addRow({
          empresa: f.name,
          folio: f.folioCesofi || '—',
          pasoTitulo: e.pasoTitulo || e.pasoId || '—',
          titulo: e.titulo,
          fileName: e.fileName || '—',
          status: e.status,
          createdAtFmt: fecha(e.createdAt),
          feedback: e.feedback || '',
        });
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('xlsx')}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar el reporte en Excel:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte en Excel' });
  }
};

// ---------- tabla dibujada a mano para el PDF (pdfkit no trae tablas) ----------
function dibujarTabla(
  doc: PDFKit.PDFDocument,
  headers: string[],
  colWidths: number[],
  rows: string[][],
  startX: number
) {
  const rowHeight = 20;
  const fontSize = 8;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  const dibujarEncabezado = () => {
    let x = startX;
    const y = doc.y;
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#' + VERDE_CLARO);
    doc.fillColor('#' + VERDE).font('Helvetica-Bold').fontSize(fontSize);
    headers.forEach((h, i) => {
      doc.text(h, x + 4, y + 6, { width: colWidths[i] - 8, ellipsis: true });
      x += colWidths[i];
    });
    doc.y = y + rowHeight;
    doc.moveDown(0);
  };

  dibujarEncabezado();

  doc.font('Helvetica').fontSize(fontSize).fillColor('#1F2933');
  rows.forEach((row, rowIndex) => {
    if (doc.y + rowHeight > bottomLimit) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
      dibujarEncabezado();
      doc.font('Helvetica').fontSize(fontSize).fillColor('#1F2933');
    }

    const y = doc.y;
    if (rowIndex % 2 === 1) {
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#F8FAFC');
      doc.fillColor('#1F2933');
    }
    let x = startX;
    row.forEach((cell, i) => {
      doc.text(cell ?? '—', x + 4, y + 6, { width: colWidths[i] - 8, ellipsis: true });
      x += colWidths[i];
    });
    doc.y = y + rowHeight;
  });

  doc.moveDown(1);
}

// [ADMIN] Descarga el mismo reporte en PDF: tabla resumen de empresas + detalle de evidencias.
export const exportarReportePdf = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filas = await construirFilasReporte();

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('pdf')}"`);
    doc.pipe(res);

    // Portada breve
    doc.rect(0, 0, doc.page.width, 6).fill('#' + VERDE);
    doc.moveDown(1.2);
    doc.fillColor('#' + VERDE).font('Helvetica-Bold').fontSize(20).text('CESOFI — Reporte de Empresas');
    doc.fillColor('#' + GRIS).font('Helvetica').fontSize(10).text(
      `Generado el ${new Date().toLocaleDateString('es-MX')} · ${filas.length} empresa(s) registradas`
    );
    doc.moveDown(1);

    // Tabla resumen
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Datos y avance por empresa');
    doc.moveDown(0.4);
    dibujarTabla(
      doc,
      ['Empresa', 'Folio', 'Contacto', 'Nivel', 'Pts', 'Nivel SIDEC', 'Pasos ok', 'Pasos', 'Evid. total', 'Aprob.', 'Rech.', 'En rev.', 'Registrado'],
      [95, 75, 100, 45, 35, 55, 45, 40, 50, 40, 40, 45, 60],
      filas.map((f) => [
        f.name,
        f.folioCesofi || '—',
        f.contactEmail,
        f.level,
        String(f.points),
        // pdfkit usa las fuentes estándar (WinAnsi) — sin soporte para "→", se usa "->" en su lugar
        f.nivelActual !== null ? `${f.nivelActual} -> ${f.nivelObjetivo ?? '—'}` : 'Sin dato',
        f.totalPasos !== null ? String(f.pasosCompletados) : '—',
        f.totalPasos !== null ? String(f.totalPasos) : '—',
        String(f.evidenciasTotal),
        String(f.evidenciasAprobadas),
        String(f.evidenciasRechazadas),
        String(f.evidenciasEnRevision),
        fecha(f.createdAt),
      ]),
      30
    );

    // Detalle de evidencias
    const evidenciasFilas = filas.flatMap((f) =>
      f.evidencias.map((e) => [
        f.name,
        f.folioCesofi || '—',
        e.pasoTitulo || e.pasoId || '—',
        e.titulo,
        e.status,
        fecha(e.createdAt),
      ])
    );

    if (evidenciasFilas.length > 0) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Evidencia subida por paso');
      doc.moveDown(0.4);
      dibujarTabla(
        doc,
        ['Empresa', 'Folio', 'Paso de la Ruta', 'Documento', 'Estado', 'Fecha'],
        [130, 80, 220, 180, 80, 65],
        evidenciasFilas,
        30
      );
    }

    doc.end();
  } catch (error) {
    console.error('Error al generar el reporte en PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'No se pudo generar el reporte en PDF' });
    } else {
      res.end();
    }
  }
};
