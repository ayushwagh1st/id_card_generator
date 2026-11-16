export interface PDFSummaryStat {
  label: string
  value: string | number
  subtext?: string
}

export interface PDFOptions {
  title: string
  subtitle?: string
  filename: string
  headers: string[]
  data: (string | number)[][]
  themeColor?: [number, number, number] // Primary accent RGB (defaults to website terracotta: [163, 75, 33])
  summaryStats?: PDFSummaryStat[]
  orientation?: 'landscape' | 'portrait'
  docId?: string
}

// Brand color palette matching website's executive editorial theme
export const BRAND_COLORS = {
  deepSlate: [24, 44, 59] as [number, number, number],       // #182c3b - Primary ink
  copper: [163, 75, 33] as [number, number, number],          // #a34b21 - Brand terracotta accent
  paperLight: [248, 245, 238] as [number, number, number],    // #f8f5ee - Warm linen background
  cardBg: [255, 252, 247] as [number, number, number],        // #fffcf7 - Pure card surface
  borderHairline: [216, 212, 201] as [number, number, number],// #d8d4c9 - Refined border
  textDark: [24, 44, 59] as [number, number, number],         // #182c3b - Dark body text
  textMuted: [88, 99, 106] as [number, number, number],       // #58636a - Secondary text
  textSubtle: [140, 148, 155] as [number, number, number],    // #8c949b - Small captions
  rowAlternate: [252, 250, 246] as [number, number, number],  // Subtle warm row striping
}

export async function exportToPDF({
  title,
  subtitle,
  filename,
  headers,
  data,
  themeColor = BRAND_COLORS.copper,
  summaryStats,
  orientation = 'landscape',
  docId
}: PDFOptions) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal?.pageSize?.width || (orientation === 'landscape' ? 297 : 210)
  const pageHeight = doc.internal?.pageSize?.height || (orientation === 'landscape' ? 210 : 297)
  const marginX = 14
  const availableWidth = pageWidth - (marginX * 2)

  const referenceId = docId || `DOC-${Math.floor(100000 + Math.random() * 900000)}`
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const formattedTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
  const timestampStr = `${formattedDate} • ${formattedTime}`

  // Set PDF Metadata
  doc.setProperties({
    title,
    subject: subtitle || title,
    author: 'Samagam Event Operations',
    creator: 'Samagam Executive Operations Platform'
  })

  // --- TOP ACCENT BAR ---
  // Clean, thin brand rule at top edge
  doc.setFillColor(themeColor[0], themeColor[1], themeColor[2])
  doc.rect(0, 0, pageWidth, 2.5, 'F')

  // --- BRAND EYEBROW ---
  doc.setTextColor(BRAND_COLORS.copper[0], BRAND_COLORS.copper[1], BRAND_COLORS.copper[2])
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('SAMAGAM EVENT OPERATIONS  •  OFFICIAL EXECUTIVE RECORD', marginX, 10.5)

  // --- TITLE ---
  doc.setTextColor(BRAND_COLORS.deepSlate[0], BRAND_COLORS.deepSlate[1], BRAND_COLORS.deepSlate[2])
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, marginX, 18)

  // --- SUBTITLE ---
  if (subtitle) {
    doc.setTextColor(BRAND_COLORS.textMuted[0], BRAND_COLORS.textMuted[1], BRAND_COLORS.textMuted[2])
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, marginX, 24)
  }

  // --- RIGHT-SIDE METADATA BADGE ---
  const metaBoxWidth = 68
  const metaBoxHeight = 16
  const metaX = pageWidth - marginX - metaBoxWidth
  const metaY = 8

  doc.setFillColor(BRAND_COLORS.cardBg[0], BRAND_COLORS.cardBg[1], BRAND_COLORS.cardBg[2])
  doc.setDrawColor(BRAND_COLORS.borderHairline[0], BRAND_COLORS.borderHairline[1], BRAND_COLORS.borderHairline[2])
  doc.setLineWidth(0.2)
  doc.roundedRect(metaX, metaY, metaBoxWidth, metaBoxHeight, 1.5, 1.5, 'FD')

  // Metadata rows inside badge
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(BRAND_COLORS.textMuted[0], BRAND_COLORS.textMuted[1], BRAND_COLORS.textMuted[2])
  doc.text('REF:', metaX + 4, metaY + 4.5)
  doc.text('DATE:', metaX + 4, metaY + 9)
  doc.text('CLASSIFICATION:', metaX + 4, metaY + 13.5)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(BRAND_COLORS.textDark[0], BRAND_COLORS.textDark[1], BRAND_COLORS.textDark[2])
  doc.text(referenceId, metaX + 26, metaY + 4.5)
  doc.text(timestampStr, metaX + 26, metaY + 9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(BRAND_COLORS.copper[0], BRAND_COLORS.copper[1], BRAND_COLORS.copper[2])
  doc.text('OFFICIAL RECORD', metaX + 26, metaY + 13.5)

  // --- DIVIDER LINE WITH COPPER ACCENT SEGMENT ---
  const lineY = 28
  doc.setDrawColor(BRAND_COLORS.borderHairline[0], BRAND_COLORS.borderHairline[1], BRAND_COLORS.borderHairline[2])
  doc.setLineWidth(0.25)
  doc.line(marginX, lineY, pageWidth - marginX, lineY)

  // Accent copper stroke at beginning of divider
  doc.setDrawColor(themeColor[0], themeColor[1], themeColor[2])
  doc.setLineWidth(0.8)
  doc.line(marginX, lineY, marginX + 32, lineY)

  let currentY = 32

  // --- DYNAMIC KPI METRIC TILES ---
  if (summaryStats && summaryStats.length > 0) {
    const count = summaryStats.length
    const gap = 3.5
    const maxCols = count <= 5 ? count : 4
    const rows = Math.ceil(count / maxCols)
    const cardHeight = 16.5

    for (let r = 0; r < rows; r++) {
      const rowStats = summaryStats.slice(r * maxCols, (r + 1) * maxCols)
      const colsInRow = rowStats.length
      const cardWidth = Math.min(54, (availableWidth - (colsInRow - 1) * gap) / colsInRow)
      const rowY = currentY + (r * (cardHeight + gap))

      rowStats.forEach((stat, i) => {
        const x = marginX + (cardWidth + gap) * i

        // Tile background
        doc.setFillColor(BRAND_COLORS.cardBg[0], BRAND_COLORS.cardBg[1], BRAND_COLORS.cardBg[2])
        doc.setDrawColor(BRAND_COLORS.borderHairline[0], BRAND_COLORS.borderHairline[1], BRAND_COLORS.borderHairline[2])
        doc.setLineWidth(0.2)
        doc.roundedRect(x, rowY, cardWidth, cardHeight, 1.5, 1.5, 'FD')

        // Top accent line on tile
        doc.setFillColor(themeColor[0], themeColor[1], themeColor[2])
        doc.rect(x + 1.5, rowY, cardWidth - 3, 0.8, 'F')

        // Value
        doc.setTextColor(BRAND_COLORS.deepSlate[0], BRAND_COLORS.deepSlate[1], BRAND_COLORS.deepSlate[2])
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text(String(stat.value), x + (cardWidth / 2), rowY + 7.5, { align: 'center' })

        // Label
        doc.setTextColor(BRAND_COLORS.textMuted[0], BRAND_COLORS.textMuted[1], BRAND_COLORS.textMuted[2])
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'bold')
        doc.text(stat.label.toUpperCase(), x + (cardWidth / 2), rowY + 12.5, { align: 'center' })
      })
    }

    currentY += (rows * (cardHeight + gap)) + 4
  }

  // Helper to identify and style status cells
  const isPositiveStatus = (val: string) => /^(approved|active|present|completed|checked in|fully staffed|yes)$/i.test(val.trim())
  const isWarningStatus = (val: string) => /^(pending|scheduled|in progress|late|understaffed)$/i.test(val.trim())
  const isDangerStatus = (val: string) => /^(rejected|absent|unstaffed|cancelled|inactive|no)$/i.test(val.trim())
  const isNeutralStatus = (val: string) => /^(checked out|unassigned|all)$/i.test(val.trim())

  // --- AUTOTABLE GENERATION ---
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: currentY,
    theme: 'plain',
    headStyles: {
      fillColor: BRAND_COLORS.deepSlate,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      lineColor: BRAND_COLORS.copper,
      lineWidth: { bottom: 0.6 }
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: BRAND_COLORS.textDark,
      halign: 'left',
      cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
      lineColor: BRAND_COLORS.borderHairline,
      lineWidth: { bottom: 0.15 }
    },
    alternateRowStyles: {
      fillColor: BRAND_COLORS.rowAlternate
    },
    margin: { top: 26, right: marginX, bottom: 16, left: marginX },
    styles: {
      overflow: 'linebreak'
    },
    didParseCell: (hookData: any) => {
      if (hookData.section === 'body') {
        const textVal = String(hookData.cell.raw ?? hookData.cell.text?.[0] ?? '').trim()
        if (isPositiveStatus(textVal)) {
          hookData.cell.styles.textColor = [16, 122, 87] // Forest emerald
          hookData.cell.styles.fontStyle = 'bold'
        } else if (isWarningStatus(textVal)) {
          hookData.cell.styles.textColor = [180, 83, 9] // Warm amber
          hookData.cell.styles.fontStyle = 'bold'
        } else if (isDangerStatus(textVal)) {
          hookData.cell.styles.textColor = [185, 28, 28] // Red
          hookData.cell.styles.fontStyle = 'bold'
        } else if (isNeutralStatus(textVal)) {
          hookData.cell.styles.textColor = [100, 116, 139] // Muted slate
          hookData.cell.styles.fontStyle = 'normal'
        }
      }
    },
    didDrawPage: (hookData: any) => {
      // Running header on page 2 and later
      const pageNum = hookData.pageNumber
      if (pageNum > 1) {
        doc.setFillColor(themeColor[0], themeColor[1], themeColor[2])
        doc.rect(0, 0, pageWidth, 1.5, 'F')

        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(BRAND_COLORS.textMuted[0], BRAND_COLORS.textMuted[1], BRAND_COLORS.textMuted[2])
        doc.text(`SAMAGAM EVENT OPERATIONS  •  ${title.toUpperCase()}`, marginX, 9)

        doc.setFont('helvetica', 'normal')
        doc.text(`REF: ${referenceId}  •  ${formattedDate}`, pageWidth - marginX, 9, { align: 'right' })

        doc.setDrawColor(BRAND_COLORS.borderHairline[0], BRAND_COLORS.borderHairline[1], BRAND_COLORS.borderHairline[2])
        doc.setLineWidth(0.2)
        doc.line(marginX, 12, pageWidth - marginX, 12)
      }
    }
  })

  // --- MULTI-PAGE RUNNING FOOTER (Two-pass for total page count) ---
  const totalPages = typeof (doc as any).internal?.getNumberOfPages === 'function'
    ? (doc as any).internal.getNumberOfPages()
    : typeof (doc as any).getNumberOfPages === 'function'
      ? (doc as any).getNumberOfPages()
      : 1

  for (let i = 1; i <= totalPages; i++) {
    if (typeof doc.setPage === 'function') {
      doc.setPage(i)
    }

    const footerY = pageHeight - 8

    // Thin hairline divider before footer
    doc.setDrawColor(BRAND_COLORS.borderHairline[0], BRAND_COLORS.borderHairline[1], BRAND_COLORS.borderHairline[2])
    doc.setLineWidth(0.2)
    doc.line(marginX, footerY - 3, pageWidth - marginX, footerY - 3)

    // Left stamp
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(BRAND_COLORS.copper[0], BRAND_COLORS.copper[1], BRAND_COLORS.copper[2])
    doc.text('SAMAGAM OPERATIONS', marginX, footerY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(BRAND_COLORS.textSubtle[0], BRAND_COLORS.textSubtle[1], BRAND_COLORS.textSubtle[2])
    doc.text('  |  CONFIDENTIAL  •  AUTHORIZED RECIPIENTS ONLY', marginX + 33, footerY)

    // Center platform stamp
    doc.text('VERIFIED PLATFORM EXPORT', pageWidth / 2, footerY, { align: 'center' })

    // Right: Page X of Y
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(BRAND_COLORS.textDark[0], BRAND_COLORS.textDark[1], BRAND_COLORS.textDark[2])
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, footerY, { align: 'right' })
  }

  doc.save(filename)
}
