import { describe, it, expect, vi } from 'vitest'
import { exportToPDF, BRAND_COLORS } from '../../lib/pdf'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

describe('PDF Export Engine', () => {
  it('should generate and save executive pdf without stats', async () => {
    const docInstance = new jsPDF()

    await exportToPDF({
      title: 'Operations Report',
      subtitle: 'Official executive documentation',
      filename: 'operations_report.pdf',
      headers: ['ID', 'Name', 'Status'],
      data: [['1', 'Alice', 'Approved'], ['2', 'Bob', 'Pending']]
    })

    expect(docInstance.save).toHaveBeenCalledWith('operations_report.pdf')
    expect(autoTable).toHaveBeenCalled()
  })

  it('should render executive KPI metric summary cards and handle status cell styling', async () => {
    const docInstance = new jsPDF()

    await exportToPDF({
      title: 'Volunteer Analytics',
      subtitle: 'Complete workforce allocation roster',
      filename: 'volunteer_analytics.pdf',
      headers: ['SNK ID', 'Name', 'Duty', 'Status'],
      data: [
        ['SNK-001', 'Alice', 'Lead', 'Approved'],
        ['SNK-002', 'Bob', 'Medic', 'Pending'],
        ['SNK-003', 'Charlie', 'Logistics', 'Rejected'],
        ['SNK-004', 'David', 'Guide', 'Checked Out']
      ],
      summaryStats: [
        { label: 'Total', value: 4 },
        { label: 'Approved', value: 1 },
        { label: 'Pending', value: 1 },
        { label: 'Rejected', value: 1 },
        { label: 'Checked Out', value: 1 },
        { label: 'Extra Tile', value: 99 }
      ]
    })

    expect(docInstance.save).toHaveBeenCalledWith('volunteer_analytics.pdf')
    expect(docInstance.roundedRect).toHaveBeenCalled()
    expect(docInstance.line).toHaveBeenCalled()

    // Verify autoTable call options
    const autoTableCalls = vi.mocked(autoTable).mock.calls
    const lastCall = autoTableCalls[autoTableCalls.length - 1]
    const options = lastCall[1] as any
    expect(options.head).toEqual([['SNK ID', 'Name', 'Duty', 'Status']])
    expect(options.theme).toBe('plain')

    // Test didParseCell hook with various status values
    const approvedCell: any = { section: 'body', cell: { raw: 'Approved', styles: {} } }
    options.didParseCell(approvedCell)
    expect(approvedCell.cell.styles.textColor).toEqual([16, 122, 87])
    expect(approvedCell.cell.styles.fontStyle).toBe('bold')

    const pendingCell: any = { section: 'body', cell: { raw: 'Pending', styles: {} } }
    options.didParseCell(pendingCell)
    expect(pendingCell.cell.styles.textColor).toEqual([180, 83, 9])
    expect(pendingCell.cell.styles.fontStyle).toBe('bold')

    const rejectedCell: any = { section: 'body', cell: { raw: 'Rejected', styles: {} } }
    options.didParseCell(rejectedCell)
    expect(rejectedCell.cell.styles.textColor).toEqual([185, 28, 28])
    expect(rejectedCell.cell.styles.fontStyle).toBe('bold')

    const checkedOutCell: any = { section: 'body', cell: { raw: 'Checked Out', styles: {} } }
    options.didParseCell(checkedOutCell)
    expect(checkedOutCell.cell.styles.textColor).toEqual([100, 116, 139])

    // Test didDrawPage running header on page > 1
    options.didDrawPage({ pageNumber: 2 })
    expect(docInstance.line).toHaveBeenCalled()
  })

  it('exposes official brand colors consistent with website theme', () => {
    expect(BRAND_COLORS.deepSlate).toEqual([24, 44, 59])
    expect(BRAND_COLORS.copper).toEqual([163, 75, 33])
    expect(BRAND_COLORS.paperLight).toEqual([248, 245, 238])
    expect(BRAND_COLORS.cardBg).toEqual([255, 252, 247])
    expect(BRAND_COLORS.borderHairline).toEqual([216, 212, 201])
  })
})
