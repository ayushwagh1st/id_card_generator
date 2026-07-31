export async function exportToPDF({
  title,
  subtitle,
  filename,
  headers,
  data,
  themeColor = [99, 102, 241], // Default Indigo
  summaryStats
}: PDFOptions) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

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

  let currentY = 45;

  // Draw Summary Stats
  if (summaryStats && summaryStats.length > 0) {
    const marginX = 14;
    const boxWidth = 50;
    const boxHeight = 22;
    const gap = 5;

    summaryStats.forEach((stat, i) => {
      // If we run out of horizontal space, could wrap, but typically max 5-6 stats
      const x = marginX + (boxWidth + gap) * i;
      
      // Draw background box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

      // Draw value
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value.toString(), x + boxWidth / 2, currentY + 10, { align: 'center' });

      // Draw label
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.label.toUpperCase(), x + boxWidth / 2, currentY + 17, { align: 'center' });
    });

    currentY += boxHeight + 8;
  }

  // AutoTable
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: currentY,
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
