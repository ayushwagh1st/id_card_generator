import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getVolunteerReportData,
  getSessionReportData,
  getModelReportData,
  getSecurityReportData,
  getRegisteredChildrenReportData
} from '../../server/actions/reports'
import { createClient } from '@/lib/supabase/server'

describe('Report Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
    mockSupabase.order.mockReset()
    mockSupabase.select.mockReturnThis()
    mockSupabase.from.mockReturnThis()
  })

  it('should get volunteer report data with enriched fields and stats', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({
      data: [
        {
          id: 'v1',
          snk_id: 'SNK-001',
          full_name: 'John Doe',
          mobile_number: '1234567890',
          age: 17,
          gender: 'Male',
          model_id: 'm1',
          status: 'Approved',
          designation: 'Field Officer',
          branch: 'North',
          accommodation: true
        },
        {
          id: 'v2',
          snk_id: 'SNK-002',
          full_name: 'Jane Smith',
          mobile_number: '9876543210',
          age: 22,
          gender: 'Female',
          model_id: null,
          status: 'Pending',
          designation: 'Volunteer',
          branch: 'General',
          accommodation: false
        }
      ],
      error: null
    })

    const result = await getVolunteerReportData()
    expect(result.data).toBeDefined()
    expect(result.data?.length).toBe(2)
    expect(result.data?.[0].designation).toBe('Field Officer')
    expect(result.data?.[0].branch).toBe('North')
    expect(result.stats).toBeDefined()

    const totalStat = result.stats?.find(s => s.label === 'Total Volunteers')
    expect(totalStat?.value).toBe(2)
    const approvedStat = result.stats?.find(s => s.label === 'Approved')
    expect(approvedStat?.value).toBe(1)
    const minorStat = result.stats?.find(s => s.label === 'Minors (Under 18)')
    expect(minorStat?.value).toBe(1)
  })

  it('should get session report data with capacity metrics', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({
      data: [
        {
          id: 's1',
          name: 'Security Briefing',
          status: 'Completed',
          capacity: 50,
          volunteer_sessions: [{ count: 40 }]
        },
        {
          id: 's2',
          name: 'First Aid',
          status: 'Scheduled',
          capacity: 30,
          volunteer_sessions: [{ count: 15 }]
        }
      ],
      error: null
    })

    const result = await getSessionReportData()
    expect(result.data).toBeDefined()
    expect(result.stats).toBeDefined()
    const capStat = result.stats?.find(s => s.label === 'Capacity Filled')
    expect(capStat?.value).toBe('69%') // 55 / 80 = ~68.75% -> 69%
  })

  it('should get model report data with staffing status breakdown', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({
      data: [
        { id: 'm1', name: 'Robotics Lab', status: 'Active' },
        { id: 'm2', name: 'Aviation Deck', status: 'Active' }
      ],
      error: null
    })

    const result = await getModelReportData()
    expect(result.data).toBeDefined()
    expect(result.stats).toBeDefined()
    const totalStat = result.stats?.find(s => s.label === 'Total Models')
    expect(totalStat?.value).toBe(2)
  })

  it('should get security report data with readiness stats', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({
      data: [
        { id: 'sec1', name: 'Officer A', email: 'a@example.com', status: 'Active' },
        { id: 'sec2', name: 'Officer B', email: 'b@example.com', status: 'Inactive' }
      ],
      error: null
    })

    const result = await getSecurityReportData()
    expect(result.data).toBeDefined()
    expect(result.stats).toBeDefined()
    const readinessStat = result.stats?.find(s => s.label === 'Deployment Readiness')
    expect(readinessStat?.value).toBe('50%')
  })

  it('should get registered children report data with on-site tracking stats', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({
      data: [
        {
          id: 'c1',
          qr_id: 'qr1',
          name: 'Child One',
          status: 'Checked In',
          checked_in_at: '2026-11-16T08:00:00Z',
          checked_out_at: null,
          created_at: '2026-11-16T07:30:00Z'
        },
        {
          id: 'c2',
          qr_id: 'qr2',
          name: 'Child Two',
          status: 'Checked Out',
          checked_in_at: '2026-11-16T08:00:00Z',
          checked_out_at: '2026-11-16T09:00:00Z',
          created_at: '2026-11-16T07:30:00Z'
        }
      ],
      error: null
    })

    const result = await getRegisteredChildrenReportData()
    expect(result.data).toBeDefined()
    expect(result.stats).toBeDefined()
    const onSiteStat = result.stats?.find(s => s.label === 'Currently On-Site')
    expect(onSiteStat?.value).toBe(1)
    const checkedOutStat = result.stats?.find(s => s.label === 'Checked Out')
    expect(checkedOutStat?.value).toBe(1)
  })
})
