import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getVolunteerReportData,
  getSessionReportData,
  getModelReportData,
  getSecurityReportData
} from '../../server/actions/reports'
import { createClient } from '@/lib/supabase/server'

describe('Report Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  it('should get volunteer report data', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({ data: [{ status: 'Approved' }], error: null })

    const result = await getVolunteerReportData()
    expect(result.data).toBeDefined()
  })

  it('should get session report data', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({ data: [{ id: '1' }], error: null })

    const result = await getSessionReportData()
    expect(result.data).toBeDefined()
  })

  it('should get model report data', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({ data: [{ id: '1' }], error: null })

    const result = await getModelReportData()
    expect(result.data).toBeDefined()
  })

  it('should get security report data', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({ data: [{ id: '1' }], error: null })

    const result = await getSecurityReportData()
    expect(result.data).toBeDefined()
  })
})
