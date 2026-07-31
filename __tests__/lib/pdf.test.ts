import { describe, it, expect, vi } from 'vitest'
import { exportToPDF } from '../../lib/pdf'
import jsPDF from 'jspdf'

describe('PDF Export', () => {
  it('should generate and save pdf', async () => {
    const docInstance = new jsPDF()
    
    await exportToPDF({
      title: 'Test PDF',
      filename: 'test.pdf',
      headers: ['A', 'B'],
      data: [['1', '2']]
    })

    expect(docInstance.save).toHaveBeenCalledWith('test.pdf')
  })
})
