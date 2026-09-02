import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/** Exporta un reporte a PDF con el membrete de la empresa, mismo rol que
 * `downloadCsv` tenía antes en Reportes (checklist: "quiero que lo haga
 * en pdf... no en csv"). */
export function downloadPdf(
  filename: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' })
  doc.setProperties({ title: `Trendy Import - ${subtitle}` })

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Trendy Import', 14, 16)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, 14, 23)

  const generadoEl = new Date().toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Generado el ${generadoEl}`, 14, 29)
  doc.setTextColor(0)

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59] },
  })

  doc.save(filename)
}
