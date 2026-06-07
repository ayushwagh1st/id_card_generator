import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PDFOptions {
  title: string
  subtitle?: string
  filename: string
  headers: string[]
  data: (string | number)[][]
  themeColor?: [number, number, number] // RGB
}

export function exportToPDF({
  title,
  subtitle,
  filename,
  headers,
  data,
  themeColor = [99, 102, 241] // Default Indigo
}: PDFOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // Set Document Properties
  doc.setProperties({
    title: title,
    creator: 'Samagam ID Card Generator'
  })

  // Header Background
  doc.setFillColor(themeColor[0], themeColor[1], themeColor[2])
  doc.rect(0, 0, 297, 40, 'F')

  // Title Text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 20)

  // Subtitle Text
  if (subtitle) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, 14, 28)
  }

  // Generation Date
  const dateStr = new Date().toLocaleString()
  doc.setFontSize(9)
  doc.text(`Generated on: ${dateStr}`, 283, 20, { align: 'right' })

  // AutoTable
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 45,
    theme: 'grid',
    headStyles: {
      fillColor: themeColor,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 50,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { top: 45, right: 14, bottom: 20, left: 14 },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4
    },
    didDrawPage: function (data) {
      // Footer
      const str = `Page ${(doc as any).internal.getNumberOfPages()}`
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        str,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      )
      doc.text(
        'Confidential & Internal Use Only',
        doc.internal.pageSize.width - data.settings.margin.right,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      )
    }
  })

  doc.save(filename)
}
